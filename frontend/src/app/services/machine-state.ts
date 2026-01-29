import { Injectable } from '@angular/core';
import { ScrapData } from './socket'; 

export interface MachineHistory {
  sum: Map<number, number[]>; // Index -> Array of Sums
  avg: Map<number, number[]>; // Index -> Array of Avgs
  labels: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MachineStateService {
  private readonly MAX_HISTORY = 60;
  
  // The Master Record: Stores history for ALL machines by ID
  private state = new Map<string, MachineHistory>();

  // Helper to initialize a new machine record
  private initMachine(machineId: string): MachineHistory {
    const history = {
      sum: new Map<number, number[]>(),
      avg: new Map<number, number[]>(),
      labels: []
    };
    [1, 2, 3].forEach(idx => {
      history.sum.set(idx, []);
      history.avg.set(idx, []);
    });
    this.state.set(machineId, history);
    return history;
  }

  /**
   * Called by Dashboard every second with RAW (unfiltered) data
   */
  public updateState(allEntries: ScrapData[]) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Group incoming data by machine to process easily
    const incomingMap = new Map<string, ScrapData[]>();
    allEntries.forEach(d => {
      if (!incomingMap.has(d.machineId)) incomingMap.set(d.machineId, []);
      incomingMap.get(d.machineId)?.push(d);
    });

    // We must update EVERY machine we know about, or initialize new ones
    // Note: You might want to merge this with a list of "Known Machines" if the socket doesn't send data for idle machines
    incomingMap.forEach((entries, machineId) => {
      let history = this.state.get(machineId);
      if (!history) history = this.initMachine(machineId);

      // Create snapshot for this second
      const sumSnap = new Map<number, number>();
      const avgSnap = new Map<number, number>();
      entries.forEach(e => {
        sumSnap.set(e.scrapIndex, e.sumLast60s);
        avgSnap.set(e.scrapIndex, e.avgLast60s);
      });

      // Update Labels (Shared across indexes)
      history.labels.push(timeLabel);
      if (history.labels.length > this.MAX_HISTORY) history.labels.shift();

      // Update Values with Fallback Logic
      [1, 2, 3].forEach(idx => {
        const sHist = history!.sum.get(idx)!;
        const aHist = history!.avg.get(idx)!;

        // Sum Logic
        let newSum = sumSnap.get(idx);
        if (newSum === undefined) newSum = (sHist.length > 0) ? sHist[sHist.length - 1] : 0;
        sHist.push(newSum);
        if (sHist.length > this.MAX_HISTORY) sHist.shift();

        // Avg Logic
        let newAvg = avgSnap.get(idx);
        if (newAvg === undefined) newAvg = (aHist.length > 0) ? aHist[aHist.length - 1] : 0;
        aHist.push(newAvg);
        if (aHist.length > this.MAX_HISTORY) aHist.shift();
      });
    });
  }

  public getHistory(machineId: string): MachineHistory | undefined {
    return this.state.get(machineId);
  }
}