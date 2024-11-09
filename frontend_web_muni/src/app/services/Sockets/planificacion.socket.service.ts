import { Observable, Subscription, tap } from "rxjs";
import { SolicitudData } from "../../models/solicitud-data.model";
import { Injectable, OnDestroy } from "@angular/core";
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { TokenService } from "../auth-token.service";
import { SolicitudDialogService } from "../dialog-service.service";
import { EnviarService } from "../enviar.service";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: 'root',
})
export class PlanificacionSocketService implements OnDestroy {
  private socket: Socket;
  private socketConnected = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private tokenService: TokenService,
    private solicitudDialogService: SolicitudDialogService,
    private enviarservice: EnviarService,
    private authService: AuthService,
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

    // Observa el token y conecta el socket cuando cambie
    this.tokenService.getTokenObservable().subscribe(token => {
      if (token) {
        this.initializeConnection(token);
      } else {
        this.disconnectSocket();
      }
    });
  }

  /**
   * Inicializa la conexión del socket si no está ya conectado y hay un token disponible.
   */
  initializeConnection(token: string): void {
    if (!this.socketConnected) {
      console.log('Conectando Socket de Planificación con el token:', token);
      this.connectSocket(token);
    }
  }

  /**
   * Conecta el socket con el token actual.
   */
  private connectSocket(token: string): void {
    if (this.socketConnected) {
      this.socket.disconnect();
    }

    this.socket.ioSocket.auth = { token }; // Configura el token en los parámetros de autenticación
    this.socket.connect();
    this.initSocket();
    this.socketConnected = true;
  }

  /**
   * Desconecta el socket si está conectado.
   */
  disconnectSocket(): void {
    if (this.socketConnected) {
      this.socket.disconnect();
      this.socketConnected = false;
      console.log('Socket de planificación desconectado manualmente');
    }
  }

  /**
   * Inicializa el socket y suscriptores de eventos.
   */
  private initSocket() {
    this.socket.on('connect', () => {
      console.log('Conectado al socket de Planificación');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del socket de Planificación');
      this.socketConnected = false;
    });

    // Escucha si el token ha expirado y reconecta
    this.socket.on('tokenExpired', () => {
      console.log('Token expirado en el socket de Planificación');
      this.reconnectSocket();
    });

    // Suscribirse a eventos del socket
    this.subscribeToSocketEvents();
  }

  /**
   * Intenta reconectar el socket con un token nuevo.
   */
  reconnectSocket() {
    // Refresca el token y reconecta el socket
    this.authService.refreshToken().subscribe(newToken => {
      console.log('Token renovado, reconectando Socket de Planificación');
      this.disconnectSocket(); // Desconecta el socket actual
      this.initializeConnection(newToken); // Reconecta con el nuevo token
    }, error => {
      console.error('Error al renovar el token:', error);
      // Opcional: puedes redirigir al usuario al login si falla la renovación del token
    });
  }

  /**
   * Suscripción a los eventos emitidos por el socket.
   */
  private subscribeToSocketEvents() {
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

  private handleSolicitudData(data: SolicitudData | null | undefined): void {
    console.log('Solicitud recibida:', data);
  
    if (!data) {
      console.error('Error: datos de solicitud nulos o indefinidos.');
      return;
    }
  
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
    this.disconnectSocket();
    console.log('Socket de planificación desconectado y suscripciones limpiadas');
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
