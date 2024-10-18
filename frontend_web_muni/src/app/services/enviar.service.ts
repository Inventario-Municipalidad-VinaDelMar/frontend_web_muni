import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiasPlanificacion } from '../models/dia-envio.model';

@Injectable({
  providedIn: 'root'
})
export class EnviarService {
  private apiUrlSetPlanificacion = 'http://34.176.26.41/api/planificacion/setPlanificacion';
  private apiUrlAuthorizeSolicitud = 'http://34.176.26.41/api/planificacion/autorizeSolicitudEnvioPlanificacion';

  constructor(private http: HttpClient) { }

  // Método para establecer la planificación
  setPlanificacion(token: string, diasPlanificacion: DiasPlanificacion): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post(this.apiUrlSetPlanificacion, diasPlanificacion, { headers });
  }

  // Nuevo método para autorizar la solicitud
  authorizeSolicitud(token: string, idSolicitud: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      aceptada: true,
      idSolicitud: idSolicitud
    };

    return this.http.post(this.apiUrlAuthorizeSolicitud, body, { headers });
  }
}
