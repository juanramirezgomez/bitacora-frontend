import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
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

      next: async (resp) => {

        await this.storage.create();
        await this.storage.set('session', resp);

        const rol = resp?.user?.rol;

        this.cargando = false;

        // 🔥 REDIRECCIÓN SEGÚN ROL
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
