import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';
import { ToastController } from '@ionic/angular';

import {
  IonContent,
  IonButton,
  IonInput,
  IonTextarea,
  IonItem,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';

type SiNo = 'SI' | 'NO';

@Component({
  selector: 'app-cierre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonTextarea,
    IonItem,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon
  ],
  templateUrl: './cierre.page.html',
  styleUrls: ['./cierre.page.scss'],
})
export class CierrePage implements OnInit {

  session: any = null;
  bitacoraId: string | null = null;

  recepcionCombustible: SiNo = 'NO';
  litrosCombustible: number | null = null;

  tk28EnServicio: SiNo = 'SI';
  tk28Porcentaje: number | null = null;

  comentariosFinales = '';

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

  async ngOnInit() {
    await this.storage.create();

    this.session = await this.storage.get('session');
    this.bitacoraId = await this.storage.get('bitacoraId');

    if (!this.session?.token || !this.bitacoraId) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  // ================= FIRMA =================

  ionViewDidEnter() {
    this.initCanvas();
  }

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

  // ================= CIERRE =================

  async cerrarTurno() {

    if (!this.bitacoraId) return;

    this.errorMsg = null;

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
        this.errorMsg = 'El % debe estar entre 0 y 100.';
        return;
      }
    }

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
          color: 'success'
        });

        await t.present();

        await this.storage.remove('bitacoraId');
        await this.router.navigate(['/bitacoras'], { replaceUrl: true });
      },
      error: () => {
        this.guardando = false;
        this.errorMsg = 'Error cerrando turno';
      }
    });
  }

  async salir() {
    await this.storage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}