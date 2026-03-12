import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  ToastController
} from '@ionic/angular/standalone';

import { ApiService } from '../services/api';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  username = '';
  password = '';
  cargando = false;
  errorMsg: string | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private storage: Storage,
    private toast: ToastController
  ) {}

  async login() {

    if (!this.username || !this.password) {
      this.errorMsg = 'Debes ingresar usuario y contraseña';
      return;
    }

    this.cargando = true;
    this.errorMsg = null;

    this.api.login({
      username: this.username,
      password: this.password
    }).subscribe({

      next: async (resp: any) => {

        await this.storage.create();

        // 🔥 GUARDAR SESIÓN DE FORMA SEGURA
        const session = {
          token: resp.token || resp.accessToken, // soporta ambos formatos
          user: resp.user
        };

        if (!session.token) {
          this.errorMsg = 'No se recibió token del servidor';
          this.cargando = false;
          return;
        }

        await this.storage.set('session', session);

        const rol = session?.user?.rol;

        this.cargando = false;

        if (rol === 'OPERADOR') {
          await this.router.navigateByUrl('/home', { replaceUrl: true });
        }
        else if (rol === 'SUPERVISOR') {
          await this.router.navigateByUrl('/bitacoras', { replaceUrl: true });
        }
        else if (rol === 'ADMIN') {
          await this.router.navigateByUrl('/admin-users', { replaceUrl: true });
        }
        else {
          this.errorMsg = 'Rol no reconocido';
        }
      },

      error: (err) => {
        this.cargando = false;
        this.errorMsg = err?.error?.message || 'Error de autenticación';
      }
    });
  }
}