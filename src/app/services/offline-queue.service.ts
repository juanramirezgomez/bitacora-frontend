import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { OfflineService } from './offline.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {

  private STORAGE_KEY = 'offline_queue';

  constructor(
    private storage: Storage,
    private offlineService: OfflineService,
    private http: HttpClient
  ) {
    this.init();
  }

  async init() {
    await this.storage.create();

    window.addEventListener('online', () => {
      this.processQueue();
    });
  }

  async addToQueue(request: any) {
    const queue = await this.storage.get(this.STORAGE_KEY) || [];
    queue.push(request);
    await this.storage.set(this.STORAGE_KEY, queue);
  }

  async processQueue() {
    if (!this.offlineService.isOnline()) return;

    const queue = await this.storage.get(this.STORAGE_KEY) || [];

    for (const item of queue) {
      try {
        await this.http.request(
          item.method,
          item.url,
          { body: item.body, headers: item.headers }
        ).toPromise();
      } catch (error) {
        console.error('Error sincronizando:', error);
        return;
      }
    }

    await this.storage.remove(this.STORAGE_KEY);
    console.log('Sincronización offline completada');
  }
}