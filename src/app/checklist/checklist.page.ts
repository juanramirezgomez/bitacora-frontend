import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';

type ServicioEstado = 'EN_SERVICIO' | 'FUERA_DE_SERVICIO';
type NivelAgua = 'BAJO' | 'NORMAL' | 'LLENO';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './checklist.page.html',
  styleUrls: ['./checklist.page.scss'],
})
export class ChecklistPage implements OnInit {

  session: any = null;
  bitacoraId: string | null = null;

  // 🔥 Checklist campos (INICIALMENTE DESELECCIONADOS)
  condicionEquipo: ServicioEstado | null = null;
  calderaHurst: ServicioEstado | null = null;
  bombaAlimentacionAgua: ServicioEstado | null = null;
  bombaPetroleo: ServicioEstado | null = null;
  purgaSuperficie: ServicioEstado | null = null;
  bombaDosificadoraQuimicos: ServicioEstado | null = null;
  trenGas: ServicioEstado | null = null;
  ablandadores: ServicioEstado | null = null;
  nivelAguaTuboNivel: NivelAgua | null = null;

  observacionesIniciales = '';

  guardando = false;
  errorMsg: string | null = null;

  constructor(
    private storage: Storage,
    private router: Router,
    private api: ApiService,
    private toast: ToastController
  ) {}

  // ============================================
  // INIT
  // ============================================

  async ngOnInit() {
    await this.storage.create();

    this.session = await this.storage.get('session');
    this.bitacoraId = await this.storage.get('bitacoraId');

    // 🔒 Validar sesión
    if (!this.session?.token) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    // 🔒 Validar bitácora activa
    if (!this.bitacoraId) {
      await this.router.navigateByUrl('/home', { replaceUrl: true });
      return;
    }

    // 🔥 RESET VISUAL DEL CHECKLIST (CLAVE)
    this.resetChecklist();

    // 🔍 Validar que la bitácora exista
    this.api.getBitacoraById(this.bitacoraId).subscribe({
      next: () => {},
      error: async () => {
        await this.storage.remove('bitacoraId');
        await this.router.navigateByUrl('/home', { replaceUrl: true });
      }
    });
  }

  // ============================================
  // RESET CHECKLIST
  // ============================================

  private resetChecklist() {
    this.condicionEquipo = null;
    this.calderaHurst = null;
    this.bombaAlimentacionAgua = null;
    this.bombaPetroleo = null;
    this.purgaSuperficie = null;
    this.bombaDosificadoraQuimicos = null;
    this.trenGas = null;
    this.ablandadores = null;
    this.nivelAguaTuboNivel = null;
    this.observacionesIniciales = '';
    this.errorMsg = null;
  }

  // ============================================
  // TOAST
  // ============================================

  private async toastOk(msg: string) {
    const t = await this.toast.create({
      message: msg,
      duration: 1500,
      position: 'top',
      color: 'success'
    });
    await t.present();
  }

  // ============================================
  // GUARDAR CHECKLIST
  // ============================================

  guardarChecklist() {
    if (!this.bitacoraId) return;

    // 🔴 Validación mínima (opcional pero recomendada)
    if (
      !this.condicionEquipo ||
      !this.calderaHurst ||
      !this.bombaAlimentacionAgua ||
      !this.bombaPetroleo ||
      !this.purgaSuperficie ||
      !this.bombaDosificadoraQuimicos ||
      !this.trenGas ||
      !this.ablandadores ||
      !this.nivelAguaTuboNivel
    ) {
      this.errorMsg = 'Debes completar todos los campos obligatorios';
      return;
    }

    this.guardando = true;
    this.errorMsg = null;

    const payload = {
      condicionEquipo: this.condicionEquipo,
      calderaHurst: this.calderaHurst,
      bombaAlimentacionAgua: this.bombaAlimentacionAgua,
      bombaPetroleo: this.bombaPetroleo,
      purgaSuperficie: this.purgaSuperficie,
      bombaDosificadoraQuimicos: this.bombaDosificadoraQuimicos,
      trenGas: this.trenGas,
      ablandadores: this.ablandadores,
      nivelAguaTuboNivel: this.nivelAguaTuboNivel,
      observacionesIniciales: this.observacionesIniciales
    };

    this.api.guardarChecklistInicial(this.bitacoraId, payload).subscribe({
      next: async () => {
        this.guardando = false;
        await this.toastOk('Checklist guardado correctamente ✅');
        await this.router.navigateByUrl('/registro-operacion', { replaceUrl: true });
      },
      error: (err) => {
        this.guardando = false;
        this.errorMsg = err?.error?.message || 'Error guardando checklist';
      }
    });
  }

  // ============================================
  // VOLVER
  // ============================================

  async volver() {
    await this.router.navigateByUrl('/home', { replaceUrl: true });
  }

}