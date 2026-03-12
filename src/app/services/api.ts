import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Storage } from '@ionic/storage-angular';
import { from, switchMap, Observable, of, catchError, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private baseUrl = environment.apiUrl;
  private storageReady: Promise<any>;

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
    this.storageReady = this.storage.create();
  }

  // ========================================
  // SESSION / AUTH HEADERS
  // ========================================

  private async getSession() {
    await this.storageReady;
    return this.storage.get('session');
  }

  private async buildAuthHeaders(): Promise<HttpHeaders> {
    const session = await this.getSession();
    const token = session?.token;

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private authRequest<T>(
    callback: (headers: HttpHeaders) => Observable<T>
  ): Observable<T> {
    return from(this.buildAuthHeaders()).pipe(
      switchMap(headers => callback(headers))
    );
  }

  // ========================================
  // AUTH
  // ========================================

  login(payload: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/login`, payload);
  }

  me(): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(`${this.baseUrl}/api/auth/me`, { headers })
    );
  }

  // ========================================
  // BITÁCORAS
  // ========================================

  iniciarTurno(
    turno: string,
    turnoNumero: string,
    fechaBitacora: string
  ): Observable<any> {
    return this.authRequest(headers =>
      this.http.post(
        `${this.baseUrl}/api/bitacoras/iniciar`,
        { turno, turnoNumero, fechaInicio: fechaBitacora },
        { headers }
      )
    );
  }

  obtenerBitacoraAbierta(): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras/abierta`,
        { headers }
      )
    );
  }

  listarBitacoras(params?: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras`,
        { headers, params: params || {} }
      )
    );
  }

  getBitacoraById(bitacoraId: string): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}`,
        { headers }
      )
    );
  }

  // ========================================
  // CHECKLIST
  // ========================================

  guardarChecklistInicial(bitacoraId: string, data: any): Observable<any> {

    if (!navigator.onLine) {
      const localKey = `offline-checklist-${bitacoraId}`;
      return from(this.storage.set(localKey, data)).pipe(
        map(() => ({
          offline: true,
          message: 'Guardado localmente'
        }))
      );
    }

    return this.authRequest(headers =>
      this.http.post(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/checklist-inicial`,
        data,
        { headers }
      )
    );
  }

  obtenerChecklistInicial(bitacoraId: string): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/checklist-inicial`,
        { headers }
      )
    );
  }

  existeChecklistInicial(bitacoraId: string): Observable<boolean> {
    return this.obtenerChecklistInicial(bitacoraId).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // ========================================
  // REGISTRO OPERACIÓN
  // ========================================

  listarRegistroOperacion(bitacoraId: string): Observable<any[]> {
    return this.authRequest(headers =>
      this.http.get<any[]>(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/registro-operacion`,
        { headers }
      )
    );
  }

  crearRegistroOperacion(bitacoraId: string, data: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.post(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/registro-operacion`,
        data,
        { headers }
      )
    );
  }

  editarRegistroOperacion(bitacoraId: string, registroId: string, data: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.put(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/registro-operacion/${registroId}`,
        data,
        { headers }
      )
    );
  }

  eliminarRegistroOperacion(bitacoraId: string, registroId: string): Observable<any> {
    return this.authRequest(headers =>
      this.http.delete(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/registro-operacion/${registroId}`,
        { headers }
      )
    );
  }

  // ========================================
  // CIERRE TURNO
  // ========================================

  crearCierre(bitacoraId: string, payload: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.post(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/cierre`,
        payload,
        { headers }
      )
    );
  }

  obtenerCierre(bitacoraId: string): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/cierre`,
        { headers }
      )
    );
  }

  // ========================================
  // PDF
  // ========================================

  descargarPdf(bitacoraId: string): Observable<Blob> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/reporte.pdf`,
        {
          headers,
          responseType: 'blob'
        }
      )
    );
  }

  // ========================================
  // EXCEL
  // ========================================

  descargarExcel(bitacoraId: string): Observable<Blob> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/bitacoras/${bitacoraId}/reporte.excel`,
        {
          headers,
          responseType: 'blob'
        }
      )
    );
  }

  // ========================================
  // ADMIN USERS
  // ========================================

  adminListUsers(query?: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.get(
        `${this.baseUrl}/api/users`,
        { headers, params: query || {} }
      )
    );
  }

  adminCreateUser(payload: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.post(
        `${this.baseUrl}/api/users`,
        payload,
        { headers }
      )
    );
  }

  adminUpdateUser(id: string, payload: any): Observable<any> {
    return this.authRequest(headers =>
      this.http.put(
        `${this.baseUrl}/api/users/${id}`,
        payload,
        { headers }
      )
    );
  }

  adminResetPassword(id: string, password: string): Observable<any> {
    return this.authRequest(headers =>
      this.http.patch(
        `${this.baseUrl}/api/users/${id}/password`,
        { password },
        { headers }
      )
    );
  }

  adminSetActivo(id: string, activo: boolean): Observable<any> {
    return this.authRequest(headers =>
      this.http.patch(
        `${this.baseUrl}/api/users/${id}/activo`,
        { activo },
        { headers }
      )
    );
  }

  adminDeleteUser(id: string): Observable<any> {
    return this.authRequest(headers =>
      this.http.delete(
        `${this.baseUrl}/api/users/${id}`,
        { headers }
      )
    );
  }
}