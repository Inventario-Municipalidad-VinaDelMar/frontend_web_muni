import { Injectable, OnDestroy } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable, Subscription, tap } from 'rxjs';
import { TokenService } from './auth-token.service';
import { SolicitudDialogService } from './dialog-service.service';
import { EnviarService } from './enviar.service';

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

  constructor(
    private tokenService: TokenService,
    private solicitudDialogService: SolicitudDialogService,
    private enviarservice:EnviarService,
   ) {
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
      this.socket.fromEvent<SolicitudData>('loadSolicitud').pipe(
        tap(data => {
          console.log('Solicitud recibida:', data);
          // Solo mostrar el diálogo si el estado es "Pendiente"
          if (data.status === 'Pendiente') {
            const ref = this.solicitudDialogService.showSolicitudDialog(data);
            ref.subscribe(confirmed => {
              console.log(confirmed ? 'Aceptado' : 'Rechazado');
              
              const token = this.tokenService.getToken(); // Obtiene el token
              
              if (token) { // Verifica que el token no sea nulo
                console.log("id solicitud " + data.id);
                
                // Define el cuerpo con 'aceptada' en función de la confirmación del usuario
                const body = {
                  aceptada: confirmed, // Si confirmado es true, envía true; si es false, envía false
                  idSolicitud: data.id // Asegúrate de que 'id' está disponible en 'data'
                };
                
                // Llama al servicio para autorizar la solicitud
                console.log("body ", body);
                this.enviarservice.authorizeSolicitud(token, body).subscribe(
                  (res) => {
                    console.log('Solicitud autorizada:', res);
                    // Aquí puedes cerrar el diálogo o realizar alguna otra acción
                  },
                  (error) => {
                    console.error('Error al autorizar la solicitud:', error);
                    console.error('Cuerpo del error:', error.error); // Imprime el cuerpo de la respuesta de error
                    console.error('Estado:', error.status);
                    console.error('Texto del estado:', error.statusText);
                  }
                );
              } else {
                console.error('Token no disponible. No se puede autorizar la solicitud.');
              }
            });
          } else {
            console.log('Solicitud omitida, status no es "Pendiente"');
          }
        })
      ).subscribe({
        next: () => console.log('Suscripción a loadSolicitud activa'), // Log adicional
        error: (err) => console.error('Error en la suscripción a loadSolicitud:', err)
      })
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
