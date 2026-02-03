import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService, ScrapData } from '../../services/socket';
import { Observable, BehaviorSubject, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { Header } from '../../core/header/header';
import { FilterBar } from './components/filter-bar/filter-bar';
import { MachineCard } from './components/machine-card/machine-card';
import { MachineStateService } from '../../services/machine-state';

interface MachineGroup {
  machineId: string;
  totalSum: number;
  lastUpdate: string;
  entries: ScrapData[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, FilterBar, MachineCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  machineFilter$ = new BehaviorSubject<string[]>([]);
  indexFilter$ = new BehaviorSubject<number[]>([]);

  filteredGroups$!: Observable<MachineGroup[]>;
  allMachines$!: Observable<string[]>;
  allIndices$!: Observable<number[]>;

  constructor(
    private socketService: SocketService,
    private stateService: MachineStateService
  ) { }

  trackByMachineId(index: number, item: MachineGroup): string {
    return item.machineId;
  }

  ngOnInit() {
    const rawData$ = this.socketService.getDashboardState();

    rawData$.subscribe(data => {
      this.stateService.updateState(data);
    });

    this.allMachines$ = rawData$.pipe(
      map(data => [...new Set(data.map(d => d.machineId))].sort()),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    this.allIndices$ = rawData$.pipe(
      map(data => [...new Set(data.map(d => d.scrapIndex))].sort((a, b) => a - b)),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    this.filteredGroups$ = combineLatest([
      rawData$,
      this.machineFilter$,
      this.indexFilter$
    ]).pipe(
      map(([data, selectedMachines, selectedIndices]) => {

        const filteredData = data.filter(item => {
          const matchMachine = (selectedMachines.length === 0)
            ? true
            : selectedMachines.includes(item.machineId);

          const matchIndex = (selectedIndices.length === 0)
            ? true
            : selectedIndices.includes(item.scrapIndex);

          return matchMachine && matchIndex;
        });

        const groups: { [key: string]: MachineGroup } = {};

        filteredData.forEach(item => {
          if (!groups[item.machineId]) {
            groups[item.machineId] = {
              machineId: item.machineId,
              totalSum: 0,
              lastUpdate: item.timestamp,
              entries: []
            };
          }
          groups[item.machineId].entries.push(item);

          groups[item.machineId].totalSum += item.sumLast60s;

          if (item.timestamp > groups[item.machineId].lastUpdate) {
            groups[item.machineId].lastUpdate = item.timestamp;
          }
        });

        return Object.values(groups).sort((a, b) => a.machineId.localeCompare(b.machineId));
      })
    );
  }
}