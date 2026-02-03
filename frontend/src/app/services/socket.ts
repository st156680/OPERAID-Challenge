import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, retry, scan, startWith } from 'rxjs';

export interface ScrapData {
  machineId: string;
  scrapIndex: number;
  sumLast60s: number;
  avgLast60s: number;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  getUpdates(): Observable<ScrapData> {
    return new Observable<ScrapData>(observer => {
      this.socket.on('connect_error', (error: Error) => {
        console.error('WebSocket connection error:', error);
        observer.error(error);
      });
      this.socket.on('scrap_update', (data: ScrapData) => {
        observer.next(data);
      });
      return () => this.socket.disconnect();
    }).pipe(
      retry({ delay: 3000, count: 3 })
    );
  }

  getDashboardState(): Observable<ScrapData[]> {
    return this.getUpdates().pipe(
      scan((acc: ScrapData[], curr: ScrapData) => {
        const index = acc.findIndex(
          item => item.machineId === curr.machineId && item.scrapIndex === curr.scrapIndex
        );
        if (index > -1) {
          const newAcc = [...acc];
          newAcc[index] = curr;
          return newAcc;
        } else {
          return [...acc, curr];
        }
      }, []),
      startWith([])
    );
  }
}