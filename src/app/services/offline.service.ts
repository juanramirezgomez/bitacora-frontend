import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {

  private onlineStatus = new BehaviorSubject<boolean>(navigator.onLine);
  public online$ = this.onlineStatus.asObservable();

  constructor() {
    window.addEventListener('online', () => {
      this.onlineStatus.next(true);
    });

    window.addEventListener('offline', () => {
      this.onlineStatus.next(false);
    });
  }

  isOnline(): boolean {
    return this.onlineStatus.value;
  }
}