import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { IonContent, IonButton } from '@ionic/angular/standalone';

import { ApiService } from '../services/api';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  session: any = null;

  turno = 'DIA';
  turnoNumero = '39';
  fechaBitacora = '';

  bitacoraAbierta = false;
  bitacoraId: string | null = null;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router
  ) {}

  ngOnInit() {
    this.init();
  }

  async init() {

    await this.storage.create();

    this.session = await this.storage.get('session');

    if (!this.session?.token) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.fechaBitacora = this.getFechaLocal();

    this.validarBitacoraAbierta();
  }

  getFechaLocal(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  cambiarTurno(valor: string) {
    console.log("Turno:", valor);
    this.turno = valor;
  }

  cambiarTurnoNumero(valor: string) {
    console.log("TurnoNumero:", valor);
    this.turnoNumero = valor;
  }

  formatearFecha(fecha: string) {

    if (!fecha) return '';

    const partes = fecha.split('-');

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  validarBitacoraAbierta() {

    this.api.obtenerBitacoraAbierta().subscribe({

      next: async (resp: any) => {

        if (resp?.bitacora?._id) {

          this.bitacoraAbierta = true;
          this.bitacoraId = resp.bitacora._id;

          this.turno = resp.bitacora.turno;
          this.turnoNumero = resp.bitacora.turnoNumero;

          const f = new Date(resp.bitacora.fechaInicio);
          this.fechaBitacora = f.toISOString().split('T')[0];

          await this.storage.set('bitacoraId', resp.bitacora._id);

        }

      },

      error: async () => {

        this.bitacoraAbierta = false;
        this.bitacoraId = null;

        await this.storage.remove('bitacoraId');

      }
    });

  }

  iniciarTurno() {

    if (this.bitacoraAbierta && this.bitacoraId) {

      this.continuarTurno();
      return;

    }

    this.api.iniciarTurno(
      this.turno,
      this.turnoNumero,
      this.fechaBitacora
    ).subscribe({

      next: async (resp: any) => {

        const id = resp?.bitacora?._id;

        if (id) {

          await this.storage.set('bitacoraId', id);

          this.router.navigate(['/checklist'], { replaceUrl: true });

        }

      },

      error: async (err) => {

        if (err?.status === 409 && err?.error?.bitacora?._id) {

          const id = err.error.bitacora._id;

          await this.storage.set('bitacoraId', id);

          this.continuarTurno();

        }

      }
    });

  }

  continuarTurno() {

    if (!this.bitacoraId) return;

    this.router.navigate(['/registro-operacion'], { replaceUrl: true });

  }

  async salir() {

    await this.storage.clear();

    this.router.navigateByUrl('/login', { replaceUrl: true });

  }

}