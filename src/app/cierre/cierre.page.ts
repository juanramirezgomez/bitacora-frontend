import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';

type SiNo = 'SI' | 'NO';

@Component({
  selector: 'app-cierre',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './cierre.page.html',
  styleUrls: ['./cierre.page.scss'],
})
export class CierrePage implements OnInit {

  session: any = null;
  bitacoraId: string | null = null;

  // FORMULARIO
  recepcionCombustible: SiNo = 'NO';
  litrosCombustible: number | null = null;

  tk28EnServicio: SiNo = 'SI';
  tk28Porcentaje: number | null = null;

  comentariosFinales = '';

  // FIRMA
  @ViewChild('sigCanvas', { static: false })
  sigCanvas?: ElementRef<HTMLCanvasElement>;

  private ctx?: CanvasRenderingContext2D | null;
  private drawing = false;

  guardando = false;
  errorMsg: string | null = null;

  constructor(
    private storage: Storage,
    private router: Router,
    private api: ApiService,
    private toast: ToastController
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit() {
    await this.storage.create();

    this.session = await this.storage.get('session');
    this.bitacoraId = await this.storage.get('bitacoraId');

    const token = this.session?.token;
    const rol = String(this.session?.user?.rol || '').toUpperCase();

    if (!token) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    if (rol !== 'OPERADOR') {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    if (!this.bitacoraId) {
      await this.router.navigateByUrl('/home', { replaceUrl: true });
      return;
    }
  }

  ionViewDidEnter() {
    this.initCanvas();
  }

  // =====================================================
  // FIRMA
  // =====================================================

  private initCanvas() {
    const canvas = this.sigCanvas?.nativeElement;
    if (!canvas) return;

    const parentWidth = canvas.parentElement?.clientWidth || 320;
    canvas.width = Math.min(700, parentWidth);
    canvas.height = 180;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
  }

  startDraw(ev: any) {
    this.drawing = true;
    const { x, y } = this.getPos(ev);
    this.ctx?.beginPath();
    this.ctx?.moveTo(x, y);
  }

  draw(ev: any) {
    if (!this.drawing) return;
    const { x, y } = this.getPos(ev);
    this.ctx?.lineTo(x, y);
    this.ctx?.stroke();
  }

  endDraw() {
    this.drawing = false;
  }

  private getPos(ev: any) {
    const canvas = this.sigCanvas?.nativeElement!;
    const rect = canvas.getBoundingClientRect();

    const clientX = ev?.touches?.[0]?.clientX ?? ev?.clientX ?? 0;
    const clientY = ev?.touches?.[0]?.clientY ?? ev?.clientY ?? 0;

    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  limpiarFirma() {
    const canvas = this.sigCanvas?.nativeElement;
    if (!canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private firmaBase64(): string {
    const canvas = this.sigCanvas?.nativeElement;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  }

  // =====================================================
  // VALIDACIONES Y CIERRE
  // =====================================================

  async cerrarTurno() {

    if (!this.bitacoraId) return;

    this.errorMsg = null;

    // VALIDACIONES FORMULARIO
    if (this.recepcionCombustible === 'SI' && !this.litrosCombustible) {
      this.errorMsg = 'Debes ingresar litros de combustible.';
      return;
    }

    if (this.tk28EnServicio === 'SI') {
      if (this.tk28Porcentaje == null) {
        this.errorMsg = 'Debes ingresar % del TK-28.';
        return;
      }
      if (this.tk28Porcentaje < 0 || this.tk28Porcentaje > 100) {
        this.errorMsg = 'El % del TK-28 debe estar entre 0 y 100.';
        return;
      }
    }

    // 🔥 VALIDAR QUE EXISTAN REGISTROS DE OPERACIÓN
    this.api.listarRegistroOperacion(this.bitacoraId).subscribe({
      next: (registros: any[]) => {

        if (!registros || registros.length === 0) {
          this.errorMsg = 'Debes ingresar al menos un registro de operación antes de cerrar el turno.';
          return;
        }

        // Si pasa validación → cerrar
        this.enviarCierre();
      },
      error: () => {
        this.errorMsg = 'Error validando registros de operación.';
      }
    });
  }

  // =====================================================
  // ENVÍO REAL AL BACKEND
  // =====================================================

  private enviarCierre() {

    if (!this.bitacoraId) return;

    this.guardando = true;

    const payload = {
      recepcionCombustible: this.recepcionCombustible,
      litrosCombustible: this.recepcionCombustible === 'SI'
        ? this.litrosCombustible
        : null,
      tk28EnServicio: this.tk28EnServicio,
      tk28Porcentaje: this.tk28EnServicio === 'SI'
        ? this.tk28Porcentaje
        : null,
      comentariosFinales: this.comentariosFinales,
      firmaBase64: this.firmaBase64()
    };

    this.api.crearCierre(this.bitacoraId, payload).subscribe({

      next: async () => {

        this.guardando = false;

        const t = await this.toast.create({
          message: 'Turno cerrado correctamente ✅',
          duration: 1500,
          position: 'top',
          color: 'success'
        });
        await t.present();

        // 🔥 Limpiar turno activo
        await this.storage.remove('bitacoraId');

        // 🔥 Redirigir a bitácoras
        await this.router.navigate(['/bitacoras'], { replaceUrl: true });
      },

      error: (err) => {
        this.guardando = false;
        this.errorMsg =
          err?.error?.message || 'Error cerrando turno';
      }
    });
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async salir() {
    await this.storage.remove('session');
    await this.storage.remove('bitacoraId');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
