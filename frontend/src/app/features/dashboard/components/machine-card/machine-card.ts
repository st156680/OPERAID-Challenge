import { Component, Input, OnChanges, SimpleChanges, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ScrapData } from '../../../../services/socket'; // Adjust this path to your actual service
import { MachineStateService } from '../../../../services/machine-state'; // Import the new service

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
  
  // Access both charts to update them simultaneously
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  // --- KPI Properties for the Header ---
  public totalLast60s: number = 0;
  public avgLast60s: number = 0;

  // --- CHART 1 CONFIG: SUM ---
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
    animation: false, // Critical for performance at 1Hz
    scales: {
      x: { 
        display: true, // Show timestamps on top graph
        ticks: { maxTicksLimit: 5 } 
      },
      y: { 
        beginAtZero: true, 
        suggestedMax: 10,
        title: { display: true, text: 'Sum' }
      }
    },
    plugins: { legend: { display: false } }, // Hide legend to save space
    elements: { point: { radius: 0 } }
  };

  // --- CHART 2 CONFIG: AVG ---
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
      x: { 
        display: true, 
        ticks: { maxTicksLimit: 5 } 
      },
      y: { 
        beginAtZero: true, 
        suggestedMax: 5,
        title: { display: true, text: 'Avg' }
      }
    },
    plugins: { legend: { display: true, position: 'bottom' } },
    elements: { point: { radius: 0 } }
  };

  constructor(private stateService: MachineStateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group'] && this.group) {
      // 1. Calculate the static numbers for the header (Current Snapshot)
      this.calculateKPIs();
      
      // 2. Sync the charts with the persistent service history
      this.syncChartsWithService();
    }
  }

  private calculateKPIs() {
    // Determine the latest value for each index in this specific update
    // We Map by index to ensure we don't double count if the array has duplicates
    const latestEntries = new Map<number, ScrapData>();
    this.group.entries.forEach(entry => latestEntries.set(entry.scrapIndex, entry));

    let sum = 0;
    let avgTotal = 0;

    latestEntries.forEach(entry => {
      sum += entry.sumLast60s;
      avgTotal += entry.avgLast60s;
    });

    this.totalLast60s = sum;
    // Currently set to Machine Total (Sum of Avgs). 
    // If you want average per index, divide by latestEntries.size
    this.avgLast60s = avgTotal; 
  }

  private syncChartsWithService() {
    // 1. Get global history for this machine from the service
    const history = this.stateService.getHistory(this.group.machineId);

    if (!history) return; 

    // 2. Directly assign the arrays from the service to the chart data
    // Note: We use the spread operator [...] strictly to trigger change detection 
    // if needed, though Chart.js often handles direct reference updates well.
    
    // Sync Time Labels
    this.sumChartData.labels = history.labels;
    this.avgChartData.labels = history.labels;

    // Sync Sum Data (Indices 1, 2, 3)
    this.sumChartData.datasets[0].data = history.sum.get(1) || [];
    this.sumChartData.datasets[1].data = history.sum.get(2) || [];
    this.sumChartData.datasets[2].data = history.sum.get(3) || [];

    // Sync Avg Data (Indices 1, 2, 3)
    this.avgChartData.datasets[0].data = history.avg.get(1) || [];
    this.avgChartData.datasets[1].data = history.avg.get(2) || [];
    this.avgChartData.datasets[2].data = history.avg.get(3) || [];

    // 3. Render Updates
    this.charts?.forEach(child => child.update());
  }
}