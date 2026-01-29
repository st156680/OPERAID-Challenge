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
  // 1. Inputs for the filters
  // Changed to string[] to support multi-select (empty array = "All")
  machineFilter$ = new BehaviorSubject<string[]>([]); 
  indexFilter$ = new BehaviorSubject<number | null>(null);

  // 2. Data Streams
  filteredGroups$!: Observable<MachineGroup[]>;
  allMachines$!: Observable<string[]>;
  allIndices$!: Observable<number[]>;

  constructor(
    private socketService: SocketService,
    private stateService: MachineStateService 
  ) {}

  // Optimization: Angular tracks items by ID instead of object reference
  trackByMachineId(index: number, item: MachineGroup): string {
    return item.machineId;
  }

  ngOnInit() {
    // Get the raw data stream (always getting updates)
    const rawData$ = this.socketService.getDashboardState();

    // 3. Feed the background service immediately so history is preserved
    // even for machines that are currently filtered out.
    rawData$.subscribe(data => {
      this.stateService.updateState(data);
    });

    // A. Generate Dropdown Options dynamically from data
    // distinctUntilChanged prevents the dropdown from re-rendering (flickering) every second
    this.allMachines$ = rawData$.pipe(
      map(data => [...new Set(data.map(d => d.machineId))].sort()),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    this.allIndices$ = rawData$.pipe(
      map(data => [...new Set(data.map(d => d.scrapIndex))].sort((a, b) => a - b)),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    // B. The Core Logic: Combine Data + Filter 1 + Filter 2
    this.filteredGroups$ = combineLatest([
      rawData$,
      this.machineFilter$,
      this.indexFilter$
    ]).pipe(
      map(([data, selectedMachines, selectedIndex]) => {

        // Step 1: Filter the raw list
        const filteredData = data.filter(item => {
          // Multi-select logic: If array is empty, show ALL. If not, check inclusion.
          const matchMachine = (selectedMachines.length === 0) 
            ? true 
            : selectedMachines.includes(item.machineId);

          const matchIndex = selectedIndex ? item.scrapIndex === selectedIndex : true;
          
          return matchMachine && matchIndex;
        });

        // Step 2: Group by Machine
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
          
          // Calculate total for the card header (Sum of all filtered entries)
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