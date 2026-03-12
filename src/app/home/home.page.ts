import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonButton
} from '@ionic/angular/standalone';

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

  turno: string = 'DIA';
  turnoNumero: string = '39';

  fechaBitacora: string = '';

  bitacoraAbierta: boolean = false;
  bitacoraId: string | null = null;

  cargando = false;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router
  ) {}

  /* =========================================
     FECHA LOCAL
  ========================================= */

  getFechaLocal(): string {

    const hoy = new Date();

    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /* =========================================
     CAMBIAR TURNO
  ========================================= */

  cambiarTurno(valor: string) {

    this.turno = valor;

  }

  /* =========================================
     CAMBIAR NUMERO TURNO
  ========================================= */

  cambiarTurnoNumero(valor: string) {

    this.turnoNumero = valor;

  }

  /* =========================================
     FORMATEAR FECHA
  ========================================= */

  formatearFecha(fecha: string): string {

    if (!fecha) return '';

    const partes = fecha.split('-');

    if (partes.length !== 3) return fecha;

    const year = partes[0];
    const month = partes[1];
    const day = partes[2];

    return `${day}/${month}/${year}`;
  }

  /* =========================================
     INIT
  ========================================= */

  async ngOnInit() {

    await this.storage.create();

    this.session = await this.storage.get('session');

    if (!this.session?.token) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.fechaBitacora = this.getFechaLocal();

    this.validarBitacoraAbierta();
  }

  /* =========================================
     VALIDAR BITÁCORA ABIERTA
  ========================================= */

  validarBitacoraAbierta() {

    this.api.obtenerBitacoraAbierta().subscribe({

      next: async (resp: any) => {

        if (resp?.bitacora?._id) {

          this.bitacoraAbierta = true;
          this.bitacoraId = resp.bitacora._id;

          this.turno = resp.bitacora.turno;
          this.turnoNumero = resp.bitacora.turnoNumero;

          if (resp.bitacora.fechaInicio) {
            const f = new Date (resp.bitacora.fechaInicio);
            this.fechaBitacora = f.toISOString().split("T")[0];
          }

          await this.storage.set('bitacoraId', resp.bitacora._id);

        } else {

          this.bitacoraAbierta = false;
          this.bitacoraId = null;

          await this.storage.remove('bitacoraId');
        }
      },

      error: async () => {

        this.bitacoraAbierta = false;
        this.bitacoraId = null;

        await this.storage.remove('bitacoraId');
      }
    });
  }

  /* =========================================
     INICIAR TURNO
  ========================================= */

  iniciarTurno() {

    if (this.bitacoraAbierta && this.bitacoraId) {
      this.continuarTurno();
      return;
    }

    this.cargando = true;

    this.api.iniciarTurno(
      this.turno,
      this.turnoNumero,
      this.fechaBitacora
    ).subscribe({

      next: async (resp: any) => {

        const id = resp?.bitacora?._id;

        if (id) {

          await this.storage.set('bitacoraId', id);

          this.bitacoraAbierta = true;
          this.bitacoraId = id;

          this.router.navigate(['/checklist'], { replaceUrl: true });
        }

        this.cargando = false;
      },

      error: async (err) => {

        this.cargando = false;

        if (err?.status === 409 && err?.error?.bitacora?._id) {

          const id = err.error.bitacora._id;

          this.bitacoraAbierta = true;
          this.bitacoraId = id;

          await this.storage.set('bitacoraId', id);

          this.continuarTurno();
        }
      }
    });
  }

  /* =========================================
     CONTINUAR TURNO
  ========================================= */

  continuarTurno() {

    if (!this.bitacoraId) return;

    this.api.obtenerChecklistInicial(this.bitacoraId).subscribe({

      next: () => {
        this.router.navigate(['/registro-operacion'], { replaceUrl: true });
      },

      error: () => {
        this.router.navigate(['/checklist'], { replaceUrl: true });
      }
    });
  }

  /* =========================================
     LOGOUT
  ========================================= */

  async salir() {

    await this.storage.clear();

    this.router.navigateByUrl('/login', { replaceUrl: true });

  }

}