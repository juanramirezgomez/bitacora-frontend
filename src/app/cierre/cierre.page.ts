import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';

import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonSpinner
} from '@ionic/angular/standalone';

import { ToastController } from '@ionic/angular';

type SiNo = 'SI' | 'NO';

@Component({
  selector: 'app-cierre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonTextarea,
    IonRadioGroup,
    IonRadio,
    IonSpinner
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

  async cerrarTurno() {

    if (!this.bitacoraId) return;

    if (this.recepcionCombustible === 'SI' && !this.litrosCombustible) {
      this.errorMsg = 'Debes ingresar litros de combustible.';
      return;
    }

    if (this.tk28EnServicio === 'SI' && this.tk28Porcentaje == null) {
      this.errorMsg = 'Debes ingresar % del TK-28.';
      return;
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
      comentariosFinales: this.comentariosFinales
    };

    this.api.crearCierre(this.bitacoraId, payload).subscribe({
      next: async () => {
        this.guardando = false;
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