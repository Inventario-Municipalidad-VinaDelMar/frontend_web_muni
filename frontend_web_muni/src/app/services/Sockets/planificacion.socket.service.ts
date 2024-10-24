import { Observable, Subscription, tap } from "rxjs";
import { SolicitudData } from "../../models/solicitud-data.model";
import { Injectable, OnDestroy } from "@angular/core";
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { TokenService } from "../auth-token.service";
import { SolicitudDialogService } from "../dialog-service.service";
import { EnviarService } from "../enviar.service";

@Injectable({
  providedIn: 'root',
})
export class PlanificacionSocketService implements OnDestroy {
  private socket: Socket;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private tokenService: TokenService,
    private solicitudDialogService: SolicitudDialogService,
    private enviarservice: EnviarService
  ) {
    const config: SocketIoConfig = {
      url: 'http://34.176.26.41/planificacion',
      options: {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      },
    };

    this.socket = new Socket(config);
    this.initSocket();
  }

  initSocket() {
    this.socket.on('connect', () => {
      console.log('Conectado al socket de Planificación');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del socket de Planificación');
    });

    // Suscribirse a eventos del socket
    this.subscribeToSocketEvents();
  }

  subscribeToSocketEvents() {
    // Suscribirse a 'loadAdminPlanificacionManage'
    this.subscriptions.add(
      this.onLoadPlanificacion().pipe(
        tap((data) => console.log('Datos de planificación recibidos:', data))
      ).subscribe()
    );

    // Suscribirse a 'loadPlanificacion'
    this.subscriptions.add(
      this.onLoadPlanificacionData().pipe(
        tap((data) => console.log('Datos de planificación cargados:', data))
      ).subscribe()
    );

    // Suscribirse a 'loadSolicitud' para mostrar diálogos de confirmación
    this.subscriptions.add(
      this.onLoadSolicitudData().subscribe({
        next: (data) => this.handleSolicitudData(data),
        error: (err) =>
          console.error('Error en la suscripción a loadSolicitud:', err),
      })
    );
  }

  /**a
   * Función para manejar los datos de la solicitud recibida.
   * @param data Datos de la solicitud
   */
  // Suponiendo que manejas el evento de 'loadSolicitud' en tu servicio
private handleSolicitudData(data: SolicitudData) {
  console.log('Solicitud recibida:', data);

  if (data.status === 'Pendiente') {
    const ref = this.solicitudDialogService.showSolicitudDialog(data);
    ref.subscribe((confirmed) => {
      console.log(confirmed ? 'Aceptado' : 'Rechazado');

      const token = this.tokenService.getToken();
      if (token) {
        const body = {
          aceptada: confirmed,
          idSolicitud: data.id,
        };

        this.enviarservice.authorizeSolicitud(token, body).subscribe(
          (res) => {
            console.log('Solicitud autorizada:', res);
          },
          (error) => {
            console.error('Error al autorizar la solicitud:', error);
          }
        );
      } else {
        console.error('Token no disponible. No se puede autorizar la solicitud.');
      }
    });
  } else {
    // Si el estado no es "Pendiente", asegurarse de cerrar el diálogo si está abierto
    this.solicitudDialogService.handleUpdatedSolicitud(data);
  }
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
