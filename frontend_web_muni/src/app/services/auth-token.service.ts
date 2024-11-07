import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    // Intenta obtener el token de localStorage al iniciar el servicio
    const savedToken = this.getToken();
    if (savedToken) {
      this.setToken(savedToken);
    }
  }

  setToken(token: string) {
    localStorage.setItem('authToken', token);
    this.tokenSubject.next(token); // Emite el valor actualizado del token
    console.log('Token guardado en TokenService:', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable(); // Devuelve el Observable para el token
  }
}
