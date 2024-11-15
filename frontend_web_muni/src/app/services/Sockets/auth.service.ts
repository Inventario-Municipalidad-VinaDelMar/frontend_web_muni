import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TokenService } from '../auth-token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://34.176.26.41/api/auth';
  private userKey = 'user';
  private defaultImageUrl = '/assets/img/user.jpeg';

  // BehaviorSubject para manejar el usuario en tiempo real
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  // Método privado para obtener el usuario desde localStorage
  private getUserFromStorage() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // Observable del usuario para que otros componentes puedan suscribirse
  getUserObservable(): Observable<any> {
    return this.userSubject.asObservable();
  }

  // Establece el usuario en localStorage y en el BehaviorSubject
  setUser(user: any): void {
    if (!user) {
      console.error('No se puede establecer el usuario porque es null o undefined');
      return;
    }

    if (!user.imageUrl) {
      user.imageUrl = this.defaultImageUrl; // Asigna una imagen predeterminada si falta
    }
    localStorage.setItem(this.userKey, JSON.stringify(user)); // Guarda el usuario en localStorage
    this.userSubject.next(user); // Actualiza el BehaviorSubject
  }

  // Obtiene el usuario actual (sincrónico)
  getUser(): any {
    return this.userSubject.value;
  }

  // Método para refrescar el token
  refreshToken(): Observable<any> {
    const idToken = this.tokenService.getToken(); // Obtener el token actual
    console.log('Token actual antes de renovar:', idToken); // Log para verificar el token actual antes de enviarlo
  
    return this.http.post<any>(`${this.apiUrl}/token/renew`, { idToken }).pipe(
      tap(response => {
        this.setAuthToken(response.accessToken); // Actualiza el access token
        console.log('Token actualizado:', response.accessToken); // Log para verificar el nuevo token
      })
    );
  }

  setAuthToken(token: string): void {
    this.tokenService.setToken(token);
  }

  isAuthenticated(): boolean {
    const token = this.tokenService.getToken(); // Obtener el token del TokenService
    return !!token; // Retorna true si el token existe y es válido, false si no
  }

  // Método de login con actualización del BehaviorSubject
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        console.log('Respuesta de login:', response); // Para verificar la respuesta completa en consola
        if (response && response.token) {
          this.tokenService.setToken(response.token); // Guarda el token usando `response.token`
          this.setUser(response); // Actualiza el usuario en el BehaviorSubject
        } else {
          console.error('No se recibió un token en la respuesta de login');
        }
      })
    );
  }

  // Método de registro con actualización del BehaviorSubject
  register(user: any): Observable<any> {
    const token = this.tokenService.getToken(); // Obtener el token actual
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.apiUrl}/register`, user, { headers }).pipe(
      tap(response => {
        console.log('Registro exitoso:', response);
        this.setUser(response); // Actualiza el usuario en el BehaviorSubject
      })
    );
  }

  // Obtiene la lista de usuarios (necesita autenticación)
  obtenerUsuarios(): Observable<any> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.apiUrl}/usuarios`, { headers });
  }

  // Elimina un usuario por ID (necesita autenticación)
  eliminarUsuario(id: string): Observable<any> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}/delete`, { headers });
  }
}
