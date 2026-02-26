import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';

import { addIcons } from 'ionicons';
import { timeOutline, waterOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-registro-operacion',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './registro-operacion.page.html',
  styleUrls: ['./registro-operacion.page.scss'],
})
export class RegistroOperacionPage implements OnInit {

  bitacoraId: string | null = null;
  operadorNombre = '';
  turnoDiaNoche = '';
  turnoNumero = '';

  hora = '';
  purgaDeFondo: 'SI' | 'NO' = 'NO';

  editId: string | null = null;

  registros: any[] = [];

  parametros: any[] = [
    { label: 'Presión caldera', unidad: 'bar', value: '' },
    { label: 'Vapor', unidad: 'T/H', value: '' },
    { label: 'Temperatura gases chimenea', unidad: '°C', value: '' },
    { label: 'Nivel TK combustible', unidad: '%', value: '' },
    { label: 'Consumo combustible', unidad: 'm3/h', value: '' },
    { label: 'Flujo bomba 41', unidad: 'm3/h', value: '' },
    { label: 'Temperatura salida ITC', unidad: '°C', value: '' }
  ];

  constructor(
    private storage: Storage,
    private router: Router,
    private api: ApiService,
    private toast: ToastController
  ) {

    addIcons({
      timeOutline,
      waterOutline,
      closeOutline
    });

  }

  async ngOnInit() {
    await this.storage.create();

    const session = await this.storage.get('session');
    this.bitacoraId = await this.storage.get('bitacoraId');

    this.operadorNombre = session?.user?.nombre || '';

    if (!this.bitacoraId) {
      this.router.navigateByUrl('/home', { replaceUrl: true });
      return;
    }

    this.api.getBitacoraById(this.bitacoraId).subscribe((b: any) => {
      this.turnoDiaNoche = b?.turnoDiaNoche;
      this.turnoNumero = b?.turnoNumero;
    });

    this.cargar();
  }

  cargar() {
    if (!this.bitacoraId) return;

    this.api.listarRegistroOperacion(this.bitacoraId)
      .subscribe((res: any) => {
        this.registros = res || [];
      });
  }

  agregarParametro() {
    this.parametros.push({
      label: 'Nuevo parámetro',
      unidad: '',
      value: ''
    });
  }

  eliminarParametro(index: number) {
    this.parametros.splice(index, 1);
  }

  guardar() {

    if (!this.hora) {
      this.mostrarToast('Debes ingresar la hora', 'warning');
      return;
    }

    const payload = {
      hora: this.hora,
      parametros: this.parametros.map(p => ({
        label: p.label,
        unidad: p.unidad,
        value: Number(p.value)
      })),
      purgaDeFondo: this.purgaDeFondo
    };

    if (!this.bitacoraId) return;

    const request = this.editId
      ? this.api.editarRegistroOperacion(this.bitacoraId, this.editId, payload)
      : this.api.crearRegistroOperacion(this.bitacoraId, payload);

    request.subscribe(() => {
      this.editId = null;
      this.limpiar();
      this.cargar();
      this.mostrarToast('Registro guardado correctamente', 'success');
    });
  }

  cargarEnForm(r: any) {
    this.editId = r._id;
    this.hora = r.hora;

    this.parametros = r.parametros.map((p: any) => ({
      label: p.label,
      unidad: p.unidad,
      value: p.value
    }));

    this.purgaDeFondo = r.purgaDeFondo;
  }

  eliminar(r: any) {
    if (!this.bitacoraId) return;

    this.api.eliminarRegistroOperacion(this.bitacoraId, r._id)
      .subscribe(() => {
        this.cargar();
        this.mostrarToast('Registro eliminado', 'success');
      });
  }

  limpiar() {
    this.hora = '';
    this.parametros.forEach(p => p.value = '');
    this.purgaDeFondo = 'NO';
  }

  /* 🔥 REDIRECCIÓN CORREGIDA */
  irACierre() {

    if (!this.bitacoraId) return;

    this.router.navigate(['/cierre'], {
      replaceUrl: true
    }).then(() => {
      window.scrollTo(0, 0);
    });

  }

  async mostrarToast(mensaje: string, color: string) {
    const t = await this.toast.create({
      message: mensaje,
      duration: 2000,
      color
    });
    t.present();
  }

  async salir() {
    await this.storage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

}
