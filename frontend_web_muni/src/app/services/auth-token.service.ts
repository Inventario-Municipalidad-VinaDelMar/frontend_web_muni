import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenKey: string = 'authToken'; 
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.tokenSubject.next(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getTokenObservable() {
    return this.tokenSubject.asObservable();
  }
}
