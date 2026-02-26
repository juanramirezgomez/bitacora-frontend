import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from '../services/api';

type Rol = 'OPERADOR' | 'SUPERVISOR';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
})
export class AdminUsersPage implements OnInit {
  session: any = null;

  cargando = false;
  errorMsg: string | null = null;

  // lista
  users: any[] = [];

  // filtros
  q = '';
  rolFiltro: '' | Rol = '';
  activoFiltro: '' | 'true' | 'false' = '';

  // form crear
  newUsername = '';
  newNombre = '';
  newRol: Rol = 'OPERADOR';
  newPassword = '';
  mostrarNewPass = false;

  // edición rápida (inline)
  editId: string | null = null;
  editUsername = '';
  editNombre = '';
  editRol: Rol = 'OPERADOR';

  // reset password
  resetId: string | null = null;
  resetPassword = '';
  mostrarResetPass = false;

  constructor(
    private api: ApiService,
    private storage: Storage,
    private router: Router,
    private toast: ToastController
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.session = await this.storage.get('session');

    const token = this.session?.token;
    const rol = String(this.session?.user?.rol || '').toUpperCase();

    if (!token) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    // 🔒 SOLO ADMIN
    if (rol !== 'ADMIN') {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.cargarUsuarios();
  }

  private async toastOk(message: string) {
    const t = await this.toast.create({ message, duration: 1400, position: 'top' });
    await t.present();
  }

  private async toastErr(message: string) {
    const t = await this.toast.create({ message, duration: 1800, position: 'top', color: 'danger' });
    await t.present();
  }

  // ====== LOGOUT ======
  async salir() {
    await this.storage.remove('session');
    await this.storage.remove('bitacoraId');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // ====== LISTAR ======
  cargarUsuarios() {
    this.cargando = true;
    this.errorMsg = null;

    const query: any = {};
    if (this.q.trim()) query.q = this.q.trim();
    if (this.rolFiltro) query.rol = this.rolFiltro;
    if (this.activoFiltro !== '') query.activo = this.activoFiltro;

    this.api.adminListUsers(query).subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : [];
        this.cargando = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Error listando usuarios';
        this.cargando = false;
      },
    });
  }

  aplicarFiltros() {
    this.cargarUsuarios();
  }

  limpiarFiltros() {
    this.q = '';
    this.rolFiltro = '';
    this.activoFiltro = '';
    this.cargarUsuarios();
  }

  // ====== CREAR ======
  toggleNewPass() {
    this.mostrarNewPass = !this.mostrarNewPass;
  }

  crearUsuario() {
    this.errorMsg = null;

    const username = String(this.newUsername || '').trim().toLowerCase();
    const nombre = String(this.newNombre || '').trim();
    const rol = this.newRol;
    const password = String(this.newPassword || '').trim();

    if (!username || !nombre || !rol || !password) {
      this.toastErr('Completa username, nombre, rol y password.');
      return;
    }

    this.cargando = true;

    this.api.adminCreateUser({ username, nombre, rol, password }).subscribe({
      next: async () => {
        this.cargando = false;

        // limpiar
        this.newUsername = '';
        this.newNombre = '';
        this.newRol = 'OPERADOR';
        this.newPassword = '';

        await this.toastOk('Usuario creado ✅');
        this.cargarUsuarios();
      },
      error: async (err) => {
        this.cargando = false;
        const msg = err?.error?.message || err?.message || 'Error creando usuario';
        await this.toastErr(msg);
      },
    });
  }

  // ====== EDITAR ======
  empezarEditar(u: any) {
    this.editId = u?.id || u?._id || null;
    this.editUsername = String(u?.username || '').trim();
    this.editNombre = String(u?.nombre || '').trim();
    this.editRol = (String(u?.rol || '').toUpperCase() as Rol) || 'OPERADOR';
  }

  cancelarEditar() {
    this.editId = null;
    this.editUsername = '';
    this.editNombre = '';
    this.editRol = 'OPERADOR';
  }

  guardarEdicion() {
    if (!this.editId) return;

    const payload: any = {
      username: String(this.editUsername || '').trim().toLowerCase(),
      nombre: String(this.editNombre || '').trim(),
      rol: this.editRol,
    };

    if (!payload.username || !payload.nombre) {
      this.toastErr('username y nombre son obligatorios.');
      return;
    }

    this.cargando = true;

    this.api.adminUpdateUser(this.editId, payload).subscribe({
      next: async () => {
        this.cargando = false;
        await this.toastOk('Usuario actualizado ✅');
        this.cancelarEditar();
        this.cargarUsuarios();
      },
      error: async (err) => {
        this.cargando = false;
        const msg = err?.error?.message || err?.message || 'Error editando usuario';
        await this.toastErr(msg);
      },
    });
  }

  // ====== RESET PASSWORD ======
  toggleResetPass() {
    this.mostrarResetPass = !this.mostrarResetPass;
  }

  abrirReset(u: any) {
    this.resetId = u?.id || u?._id || null;
    this.resetPassword = '';
    this.mostrarResetPass = false;
  }

  cancelarReset() {
    this.resetId = null;
    this.resetPassword = '';
    this.mostrarResetPass = false;
  }

  confirmarReset() {
    if (!this.resetId) return;

    const p = String(this.resetPassword || '').trim();
    if (!p) {
      this.toastErr('Debes ingresar la nueva contraseña.');
      return;
    }

    this.cargando = true;

    this.api.adminResetPassword(this.resetId, p).subscribe({
      next: async () => {
        this.cargando = false;
        await this.toastOk('Password actualizado ✅');
        this.cancelarReset();
        this.cargarUsuarios();
      },
      error: async (err) => {
        this.cargando = false;
        const msg = err?.error?.message || err?.message || 'Error reseteando password';
        await this.toastErr(msg);
      },
    });
  }

  // ====== ACTIVO ======
  toggleActivo(u: any) {
    const id = u?.id || u?._id;
    if (!id) return;

    const activo = !Boolean(u?.activo);

    this.cargando = true;
    this.api.adminSetActivo(id, activo).subscribe({
      next: async () => {
        this.cargando = false;
        await this.toastOk(activo ? 'Usuario ACTIVADO ✅' : 'Usuario DESACTIVADO ✅');
        this.cargarUsuarios();
      },
      error: async (err) => {
        this.cargando = false;
        const msg = err?.error?.message || err?.message || 'Error cambiando estado';
        await this.toastErr(msg);
      },
    });
  }

  // ====== ELIMINAR ======
  eliminar(u: any) {
    const id = u?.id || u?._id;
    if (!id) return;

    // confirmación simple (rápida)
    const ok = confirm(`¿Eliminar usuario "${u?.username}"?`);
    if (!ok) return;

    this.cargando = true;

    this.api.adminDeleteUser(id).subscribe({
      next: async () => {
        this.cargando = false;
        await this.toastOk('Usuario eliminado ✅');
        this.cargarUsuarios();
      },
      error: async (err) => {
        this.cargando = false;
        const msg = err?.error?.message || err?.message || 'Error eliminando usuario';
        await this.toastErr(msg);
      },
    });
  }
}
