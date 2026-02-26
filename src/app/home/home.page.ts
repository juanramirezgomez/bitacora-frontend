import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  session: any = null;

  turno: string = 'DIA';
  turnoNumero: string = '39';

  bitacoraAbierta: boolean = false;
  bitacoraId: string | null = null;

  cargando = false;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router
  ) {}

  // =========================================
  // INIT
  // =========================================

  async ngOnInit() {
    await this.storage.create();

    this.session = await this.storage.get('session');

    if (!this.session?.token) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.validarBitacoraAbierta();
  }

  // =========================================
  // VALIDAR CON BACKEND SI HAY ABIERTA
  // =========================================

  validarBitacoraAbierta() {

    this.api.obtenerBitacoraAbierta().subscribe({

      next: async (resp: any) => {

        if (resp?.bitacora?._id) {

          this.bitacoraAbierta = true;
          this.bitacoraId = resp.bitacora._id;

          await this.storage.set('bitacoraId', resp.bitacora._id);

        } else {

          this.bitacoraAbierta = false;
          this.bitacoraId = null;

          await this.storage.remove('bitacoraId');
        }
      },

      error: async () => {

        // Si backend falla o no existe → limpiar estado
        this.bitacoraAbierta = false;
        this.bitacoraId = null;

        await this.storage.remove('bitacoraId');
      }
    });
  }

  // =========================================
  // BOTÓN PRINCIPAL
  // =========================================

  iniciarTurno() {

    if (this.bitacoraAbierta && this.bitacoraId) {
      this.continuarTurno();
      return;
    }

    this.cargando = true;

    this.api.iniciarTurno(this.turno, this.turnoNumero).subscribe({

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

        // 🔥 Si devuelve 409 significa que ya hay una abierta
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

  // =========================================
  // CONTINUAR FLUJO INTELIGENTE
  // =========================================

  continuarTurno() {

    if (!this.bitacoraId) return;

    // Paso 1 → Verificar checklist
    this.api.obtenerChecklistInicial(this.bitacoraId).subscribe({

      next: () => {

        // Paso 2 → Verificar registros
        this.api.listarRegistroOperacion(this.bitacoraId!).subscribe({

          next: (registros: any[]) => {

            if (!registros || registros.length === 0) {
              this.router.navigate(['/registro-operacion'], { replaceUrl: true });
              return;
            }

            // Si tiene registros → ir a registro
            this.router.navigate(['/registro-operacion'], { replaceUrl: true });
          },

          error: () => {
            this.router.navigate(['/registro-operacion'], { replaceUrl: true });
          }
        });
      },

      error: () => {

        // No existe checklist → ir a checklist
        this.router.navigate(['/checklist'], { replaceUrl: true });
      }
    });
  }

  // =========================================
  // SALIR
  // =========================================

  async salir() {
    await this.storage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
