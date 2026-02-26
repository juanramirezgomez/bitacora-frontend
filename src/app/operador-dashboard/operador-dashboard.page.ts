import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';

@Component({
  selector: 'app-operador-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './operador-dashboard.page.html',
  styleUrls: ['./operador-dashboard.page.scss'],
})
export class OperadorDashboardPage implements OnInit {

  session: any = null;

  // 🔥 NUEVAS VARIABLES (faltaban)
  turno: string = 'Día';
  turnoNumero: string = '39';

  cargando = false;
  errorMsg: string | null = null;

  constructor(
    private storage: Storage,
    private router: Router,
    private api: ApiService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.session = await this.storage.get('session');

    if (!this.session?.token || this.session?.user?.rol !== 'OPERADOR') {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  async iniciarTurno() {
    this.cargando = true;
    this.errorMsg = null;

    this.api.iniciarTurno(this.turno, this.turnoNumero).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigateByUrl('/checklist');
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error iniciando turno';
        this.cargando = false;
      }
    });
  }

  async salir() {
    await this.storage.remove('session');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
