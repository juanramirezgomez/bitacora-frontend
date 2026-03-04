import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { Storage } from '@ionic/storage-angular';
import { Browser } from '@capacitor/browser';

import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonDatetime,
  IonDatetimeButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-bitacoras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonIcon
  ],
  templateUrl: './bitacoras.page.html',
  styleUrls: ['./bitacoras.page.scss'],
})
export class BitacorasPage implements OnInit {

  session: any = null;

  bitacoras: any[] = [];
  bitacorasFiltradas: any[] = [];

  totalCerradas = 0;
  totalFiltradas = 0;

  searchText = '';
  fechaFiltro: string | null = null;

  paginaActual = 1;
  porPagina = 5;

  cargando = false;
  errorMsg: string | null = null;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  // ===================================================
  // INIT
  // ===================================================

  async ngOnInit() {
    await this.storage.create();
    this.session = await this.storage.get('session');

    if (!this.session?.token) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.cargarBitacoras();
  }

  // ===================================================
  // CARGAR BITÁCORAS
  // ===================================================

  cargarBitacoras() {
    this.cargando = true;

    this.api.listarBitacoras({ estado: 'CERRADA' }).subscribe({
      next: (resp: any) => {

        this.bitacoras = Array.isArray(resp) ? resp : [];

        this.totalCerradas = this.bitacoras.length;

        this.paginaActual = 1;
        this.aplicarFiltros();

        this.cd.detectChanges();

        this.cargando = false;
      },
      error: (err) => {
        console.error("❌ Error cargando bitácoras:", err);
        this.errorMsg = 'Error cargando bitácoras';
        this.cargando = false;
      }
    });
  }

  // ===================================================
  // FILTROS
  // ===================================================

  aplicarFiltros() {
    let filtradas = [...this.bitacoras];

    if (this.searchText) {
      const s = this.searchText.toLowerCase();
      filtradas = filtradas.filter(b =>
        (b.operador || '').toLowerCase().includes(s) ||
        String(b.turnoNumero || '').includes(this.searchText)
      );
    }

    if (this.fechaFiltro) {
      const fecha = new Date(this.fechaFiltro).toDateString();
      filtradas = filtradas.filter(b =>
        new Date(b.fechaInicio).toDateString() === fecha
      );
    }

    this.totalFiltradas = filtradas.length;

    const inicio = (this.paginaActual - 1) * this.porPagina;
    const fin = inicio + this.porPagina;

    this.bitacorasFiltradas = filtradas.slice(inicio, fin);
  }

  limpiarFecha() {
    this.fechaFiltro = null;
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.aplicarFiltros();
    }
  }

  paginaSiguiente() {
    if ((this.paginaActual * this.porPagina) < this.totalFiltradas) {
      this.paginaActual++;
      this.aplicarFiltros();
    }
  }

  trackByBitacora(index: number, item: any) {
    return item._id;
  }

  // ===================================================
  // PDF / EXCEL (ANDROID READY)
  // ===================================================

  async verPdf(bitacora: any) {
    if (!bitacora?._id) return;

    const url = `https://bitacora-backend-vb0e.onrender.com/api/bitacoras/${bitacora._id}/reporte.pdf`;

    await Browser.open({ url });
  }

  async descargarPdf(bitacora: any) {
    if (!bitacora?._id) return;

    const url = `https://bitacora-backend-vb0e.onrender.com/api/bitacoras/${bitacora._id}/reporte.pdf`;

    await Browser.open({ url });
  }

  async descargarExcel(bitacora: any) {
    if (!bitacora?._id) return;

    const url = `https://bitacora-backend-vb0e.onrender.com/api/bitacoras/${bitacora._id}/reporte.excel`;

    await Browser.open({ url });
  }

  // ===================================================
  // LOGOUT
  // ===================================================

  async salir() {
    await this.storage.remove('session');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

}