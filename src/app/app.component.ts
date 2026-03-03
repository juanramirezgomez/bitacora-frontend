import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { OfflineService } from './services/offline.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  isOnline = true;

  constructor(private offlineService: OfflineService) {}

  ngOnInit() {
    this.offlineService.online$.subscribe(status => {
      this.isOnline = status;
    });
  }
}