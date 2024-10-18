import { Injectable, OnDestroy } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable, Subscription, tap } from 'rxjs';
import { TokenService } from './auth-token.service';

interface SolicitudData {
  solicitante: {
    id: string;
    rut: string;
    email: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    imageUrl: string | null;
    isActive: boolean;
    roles: string[];
  };
  horaResolucion: string | null;
  id: string;
  fechaSolicitud: string;
  horaSolicitud: string;
  status: string;
  administrador: string | null;
  envioAsociado: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PlanificacionIndividualSocketService implements OnDestroy {
  private socketPlanificacion: Socket;
  private subscriptions: Subscription = new Subscription();

  constructor(private tokenService: TokenService) {
    const configPlanificacion: SocketIoConfig = {
      url: 'http://34.176.26.41/planificacion',
      options: {},
    };

    this.socketPlanificacion = new Socket(configPlanificacion);
    this.initSocket();
  }

  private initSocket() {
    this.socketPlanificacion.on('connect', () => {
      console.log('Conectado al socket de Planificación individual');
    });

    this.socketPlanificacion.on('disconnect', () => {
      console.log('Desconectado del socket de Planificación individual');
    });

    this.subscriptions.add(
      this.socketPlanificacion.fromEvent<any>('loadPlanificacion').pipe(
        tap(data => console.log('Datos de planificación recibidos:', data))
      ).subscribe()
    );

    this.subscriptions.add(
      this.socketPlanificacion.fromEvent<SolicitudData>('loadSolicitud').pipe(
        tap(data => console.log('Solicitud recibida:', data))
      ).subscribe()
    );
  }

  getPlanificacion(fecha: string): void {
    const token = this.tokenService.getToken();
    const mensaje = {
      fecha: fecha,
      token: token
    };

    console.log('Solicitud de planificación con fecha y token:', mensaje);
    this.socketPlanificacion.emit('getPlanificacion', mensaje);
  }

  disconnectSocket() {
    this.socketPlanificacion.disconnect();
    console.log('Socket de planificación desconectado');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.disconnectSocket();
  }
}
