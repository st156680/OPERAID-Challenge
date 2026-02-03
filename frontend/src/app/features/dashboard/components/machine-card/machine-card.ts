import { Component, Input, OnChanges, SimpleChanges, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ScrapData } from '../../../../services/socket';
import { MachineStateService } from '../../../../services/machine-state';

export interface MachineGroup {
  machineId: string;
  totalSum: number;
  lastUpdate: string;
  entries: ScrapData[];
}

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [DecimalPipe],
  templateUrl: './machine-card.html',
  styleUrl: './machine-card.css',
})
export class MachineCard implements OnChanges {
  @Input({ required: true }) group!: MachineGroup;
  @Input() selectedIndices: number[] = [];

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  public totalLast60s: number = 0;
  public avgLast60s: number = 0;

  // Sum Chart
  public sumChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Idx 1', borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
      { data: [], label: 'Idx 2', borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
      { data: [], label: 'Idx 3', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 0 }
    ]
  };

  public sumChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { display: true, ticks: { maxTicksLimit: 5 } },
      y: { beginAtZero: true, suggestedMax: 10, title: { display: true, text: 'Sum' } }
    },
    plugins: { legend: { display: true, position: 'bottom' } },
    elements: { point: { radius: 0 } }
  };

  // Average Chart
  public avgChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Idx 1', borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
      { data: [], label: 'Idx 2', borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
      { data: [], label: 'Idx 3', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 0 }
    ]
  };

  public avgChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { display: true, ticks: { maxTicksLimit: 5 } },
      y: { beginAtZero: true, suggestedMax: 5, title: { display: true, text: 'Avg' } }
    },
    plugins: { legend: { display: true, position: 'bottom' } },
    elements: { point: { radius: 0 } }
  };

  constructor(private stateService: MachineStateService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['group'] && this.group) || changes['selectedIndices']) {
      this.calculateKPIs();
      this.syncChartsWithService();
    }
  }

  private calculateKPIs() {
    const latestEntries = new Map<number, ScrapData>();
    this.group.entries.forEach(entry => latestEntries.set(entry.scrapIndex, entry));

    let sum = 0;
    let avgTotal = 0;
    let activeCount = 0;

    latestEntries.forEach((entry, idx) => {
      const isVisible = (this.selectedIndices.length === 0) || (this.selectedIndices.includes(idx));
      if (isVisible) {
        sum += entry.sumLast60s;
        avgTotal += entry.avgLast60s;
        activeCount++;
      }
    });

    this.totalLast60s = sum;
    this.avgLast60s = avgTotal;
  }

  private syncChartsWithService() {
    const history = this.stateService.getHistory(this.group.machineId);
    if (!history) return;

    this.sumChartData.labels = history.labels;
    this.avgChartData.labels = history.labels;

    [1, 2, 3].forEach((scrapIdx, arrayPos) => {

      const isVisible = (this.selectedIndices.length === 0) || (this.selectedIndices.includes(scrapIdx));

      this.sumChartData.datasets[arrayPos].data = isVisible
        ? (history.sum.get(scrapIdx) || [])
        : [];

      this.avgChartData.datasets[arrayPos].data = isVisible
        ? (history.avg.get(scrapIdx) || [])
        : [];
    });

    this.charts?.forEach(child => child.update());
  }
}