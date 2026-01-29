interface RawData {
  value: number;
  timestamp: number; // Unix timestamp in ms
}

export interface AggregatedData {
  machineId: string;
  scrapIndex: number;
  sumLast60s: number;
  avgLast60s: number;
  timestamp: string; // ISO String
}

export class ScrapAggregator {
  // Map Key: "machineId:scrapIndex" -> Array of data points
  private store = new Map<string, RawData[]>();

  public addData(machineId: string, scrapIndex: number, value: number, isoTimestamp: string): AggregatedData {
    const key = `${machineId}:${scrapIndex}`;
    const now = new Date(isoTimestamp).getTime();
    const cutoff = now - 60000; // 60 seconds ago

    // 1. Get existing or init new array
    const currentData = this.store.get(key) || [];

    // 2. Add new point
    currentData.push({ value, timestamp: now });

    // 3. Filter data: Keep only points within the last 60 seconds
    // Note: In high-frequency production, a circular buffer is faster, 
    // but Array.filter is cleaner for this scale.
    const filteredData = currentData.filter(d => d.timestamp > cutoff);
    
    // Update store
    this.store.set(key, filteredData);

    // 4. Calculate Aggregations
    const count = filteredData.length;
    const sum = filteredData.reduce((acc, curr) => acc + curr.value, 0);
    const avg = count > 0 ? sum / count : 0;
    return {
      machineId,
      scrapIndex,
      sumLast60s: sum,
      avgLast60s: parseFloat(avg.toFixed(2)), // Clean rounding
      timestamp: isoTimestamp
    };
  }
}