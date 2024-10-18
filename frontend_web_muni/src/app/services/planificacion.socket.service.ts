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
export class PlanificacionSocketService implements OnDestroy {
  private socket: Socket;
  private subscriptions: Subscription = new Subscription();

  constructor(private tokenService: TokenService) {
    const config: SocketIoConfig = {
      url: 'http://34.176.26.41/planificacion',
      options: {},
    };

    this.socket = new Socket(config);
    this.initSocket();
  }

  private initSocket() {
    this.socket.on('connect', () => {
      console.log('Conectado al socket de Planificación');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del socket de Planificación');
    });

    // Suscripciones a eventos comunes
    this.subscriptions.add(
      this.socket.fromEvent<any>('loadAdminPlanificacionManage').pipe(
        tap(data => console.log('Datos de planificación recibidos:', data))
      ).subscribe()
    );

    this.subscriptions.add(
      this.socket.fromEvent<any>('loadPlanificacion').pipe(
        tap(data => console.log('Datos de planificación cargados:', data))
      ).subscribe()
    );

    this.subscriptions.add(
      this.socket.fromEvent<SolicitudData>('loadSolicitud').pipe(
        tap(data => console.log('Datos de solicitud cargados:', data))
      ).subscribe()
    );

    // Eventos específicos de planificación individual
    this.subscriptions.add(
      this.socket.fromEvent<any>('loadPlanificacionIndividual').pipe(
        tap(data => console.log('Datos de planificación individual recibidos:', data))
      ).subscribe()
    );
  }

  getPlanificacion(lunes: string, viernes: string): void {
    const token = this.tokenService.getToken();
    const mensaje = {
      inicio: lunes,
      fin: viernes,
      token: token,
    };
    console.log(mensaje);

    this.socket.emit('adminPlanificacionManage', mensaje);
  }

  getPlanificacionIndividual(fecha: string): void {
    const token = this.tokenService.getToken();
    const mensaje = {
      fecha: fecha,
      token: token,
    };
    this.socket.emit('getPlanificacion', mensaje);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.socket.disconnect();
    console.log('Socket de planificación desconectado');
  }

  onLoadPlanificacion(): Observable<any> {
    return this.socket.fromEvent('loadAdminPlanificacionManage');
  }

  onLoadPlanificacionData(): Observable<any> {
    return this.socket.fromEvent('loadPlanificacion');
  }

  onLoadSolicitudData(): Observable<SolicitudData> {
    return this.socket.fromEvent<SolicitudData>('loadSolicitud').pipe(
      tap((data) => console.log('Solicitud recibida:', data))
    );
  }
}
