import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { Storage } from '@ionic/storage-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

  mostrarModal = false;
  pdfUrl: SafeResourceUrl | null = null;
  private rawPdfUrl: string | null = null;
  bitacoraSeleccionada: any | null = null;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.session = await this.storage.get('session');

    if (!this.session?.token) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.cargarBitacoras();
  }

  cargarBitacoras() {
    this.cargando = true;

    this.api.listarBitacoras({ estado: 'CERRADA' }).subscribe({
      next: (resp: any) => {
        const items = resp?.items || resp || [];
        this.bitacoras = items;
        this.totalCerradas = this.bitacoras.length;
        this.paginaActual = 1;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => {
        this.errorMsg = 'Error cargando bitácoras';
        this.cargando = false;
      }
    });
  }

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

  private generarNombre(bitacora: any, extension: string) {
    const fecha = new Date(bitacora.fechaInicio);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear()).slice(-2);
    const turno = (bitacora.turno || '').toLowerCase();
    return `bitacora-${dia}-${mes}-${anio}-${turno}.${extension}`;
  }

  verPdf(bitacora: any) {
    if (!bitacora?._id) return;

    this.bitacoraSeleccionada = bitacora;
    this.mostrarModal = true;
    this.pdfUrl = null;

    this.api.descargarPdf(bitacora._id).subscribe({
      next: (blob: Blob) => {
        if (this.rawPdfUrl) {
          window.URL.revokeObjectURL(this.rawPdfUrl);
        }

        this.rawPdfUrl = window.URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfUrl);
      },
      error: () => alert('Error generando PDF')
    });
  }

  cerrarModal() {
    this.mostrarModal = false;

    if (this.rawPdfUrl) {
      window.URL.revokeObjectURL(this.rawPdfUrl);
      this.rawPdfUrl = null;
    }

    this.pdfUrl = null;
    this.bitacoraSeleccionada = null;
  }

  descargarPdf(bitacora: any) {
    if (!bitacora?._id) return;

    this.api.descargarPdf(bitacora._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generarNombre(bitacora, 'pdf');
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  descargarExcel(bitacora: any) {
    if (!bitacora?._id) return;

    this.api.descargarExcel(bitacora._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generarNombre(bitacora, 'xlsx');
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  async salir() {
    await this.storage.remove('session');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}