import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://34.176.26.41/api/auth'; 
  private userKey = 'user';
  private defaultImageUrl = '/assets/img/user.jpeg'; // Imagen por defecto

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  setAuthToken(token: string): void {
    this.tokenService.setToken(token);
  }

  setUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    if (user) {
      const parsedUser = JSON.parse(user);

      // Verificar si no tiene imageUrl o es null/undefined
      if (!parsedUser.imageUrl) {
        parsedUser.imageUrl = this.defaultImageUrl; // Asignar imagen por defecto
      }

      return parsedUser;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.tokenService.getToken() !== null;
  }
}
