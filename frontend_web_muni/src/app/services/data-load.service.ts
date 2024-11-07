// data-load.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './Sockets/auth.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataLoadService {
  constructor(private authService: AuthService) {}

  loadUserData(): Observable<any> {
    if (this.authService.isAuthenticated()) {
      // Llama a los servicios necesarios para obtener datos del usuario
      return of(this.authService.getUser()); // Ejemplo, retorna los datos del usuario
    } else {
      return of(null);
    }
  }
}
