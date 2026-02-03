import { PrismaClient } from '@prisma/client';

export interface AggregatedData {
  machineId: string;
  scrapIndex: number;
  sumLast60s: number;
  avgLast60s: number;
  timestamp: string;
}

export class ScrapAggregator {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async addData(machineId: string, scrapIndex: number, value: number, isoTimestamp: string): Promise<AggregatedData> {
    if (!machineId || scrapIndex < 1 || value < 0) {
      throw new Error('Invalid input data');
    }
    const timestamp = new Date(isoTimestamp);


    // Persist data
    try {
      await this.prisma.scrapRecord.create({
        data: {
          machineId,
          scrapIndex,
          value,
          timestamp
        }
      });
    } catch (error) {
      console.error(`Aggregation failed for ${machineId}:`, error);
      throw error;
    }


    const cutoff = new Date(timestamp.getTime() - 60000);

    // Database query for aggregation
    const aggregate = await this.prisma.scrapRecord.aggregate({
      _sum: {
        value: true
      },
      _avg: {
        value: true
      },
      where: {
        machineId,
        scrapIndex,
        timestamp: {
          gt: cutoff
        }
      }
    });

    return {
      machineId,
      scrapIndex,
      sumLast60s: aggregate._sum.value || 0,
      avgLast60s: parseFloat((aggregate._avg.value || 0).toFixed(2)),
      timestamp: isoTimestamp
    };
  }
}