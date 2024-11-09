// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TokenService } from '../auth-token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://34.176.26.41/api/auth';
  private userKey = 'user';
  private defaultImageUrl = '/assets/img/user.jpeg';

  constructor(private http: HttpClient, private tokenService: TokenService) {}

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
// auth.service.ts
setUser(user: any): void {
  if (!user) {
    console.error('No se puede establecer el usuario porque es null o undefined');
    return;
  }
  
  if (!user.imageUrl) {
    user.imageUrl = this.defaultImageUrl; // Asigna una imagen predeterminada si falta
  }
  localStorage.setItem(this.userKey, JSON.stringify(user)); // Guarda el usuario completo en localStorage
}


  

  // Obtiene el usuario de localStorage y establece la imagen predeterminada si falta
  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    if (user) {
      const parsedUser = JSON.parse(user);
      if (!parsedUser.imageUrl) {
        parsedUser.imageUrl = this.defaultImageUrl; // Asigna user.png si no tiene imagen
      }
      return parsedUser;
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.tokenService.getToken(); // Obtener el token del TokenService
    return !!token; // Retorna true si el token existe y es válido, false si no
  }

  /// auth.service.ts
login(email: string, password: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
    tap(response => {
      console.log('Respuesta de login:', response); // Para verificar la respuesta completa en consola
      if (response && response.token) { // Asegúrate de usar el campo correcto aquí
        this.tokenService.setToken(response.token); // Guarda el token usando `response.token`
        this.setUser(response); // Guarda el usuario completo
      } else {
        console.error('No se recibió un token en la respuesta de login');
      }
    })
  );
}


  
  
}
