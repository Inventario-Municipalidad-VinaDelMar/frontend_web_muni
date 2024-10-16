import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiasPlanificacion } from '../models/dia-envio.model';

@Injectable({
  providedIn: 'root'
})
export class EnviarService {
  private apiUrl = 'http://34.176.26.41/api/planificacion/setPlanificacion';

  constructor(private http: HttpClient) { }

  setPlanificacion(token: string, diasPlanificacion: DiasPlanificacion): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Enviamos el objeto `diasPlanificacion` directamente
    return this.http.post(this.apiUrl, diasPlanificacion, { headers });
  }
}
