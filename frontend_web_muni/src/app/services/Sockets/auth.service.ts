import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://34.176.26.41/api/auth'; 

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  setAuthToken(token: string): void {
    this.tokenService.setToken(token);
  }

  isAuthenticated(): boolean {
    return this.tokenService.getToken() !== null;
  }
}
