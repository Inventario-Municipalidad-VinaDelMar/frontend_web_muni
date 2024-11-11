import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable, BehaviorSubject } from 'rxjs';
import { TokenService } from './auth-token.service';
import { Envio } from '../models/envio.model';
import { DetalleEnvio } from '../models/detalle-envio.model';

@Injectable({
  providedIn: 'root',
})
export class EnviosSocketService {
  private socket: Socket | null = null;
  private socketConnected = false;
  private isInitialized = false; // Flag para asegurar que solo se inicialice una vez
  private enviosSubject = new BehaviorSubject<Envio[]>([]);
  envios$ = this.enviosSubject.asObservable();

  constructor(private tokenService: TokenService) {
    this.initializeSocket();
  }

  initSocketConnection(): void {
    this.initializeSocket();
  }

  isConnected(): boolean {
    return this.socketConnected;
  }

  private initializeSocket() {
    if (this.isInitialized) {
      console.log('El socket ya ha sido inicializado.');
      return;
    }

    const config: SocketIoConfig = {
      url: 'http://34.176.26.41/logistica/envios',
      options: {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      },
    };

    this.socket = new Socket(config);

    this.socket.on('connect', () => {
      console.log('Conectado al socket de logística envíos');
      this.socketConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del socket de logística envíos');
      this.socketConnected = false;
    });

    this.isInitialized = true;
  }

   loadEnviosByFecha(fecha: string): Observable<Envio[]> {
    const token = this.tokenService.getToken();
    if (!token) {
      console.error('Token no disponible. No se puede enviar el mensaje.');
      return new Observable<Envio[]>(); // Retorna un observable vacío si no hay token
    }

    const mensaje = {
      fecha: fecha,
      token: token,
    };

    console.log('Emitir mensaje al socket con fecha:', mensaje);

    if (this.socket) {
      this.socket.emit('getEnviosByFecha', mensaje);
    } else {
      console.error('Socket no inicializado.');
    }

    // Escucha el evento 'loadEnviosByFecha' y devuelve un Observable de los datos
    return new Observable<Envio[]>((observer) => {
      if (this.socket) {
        this.socket.on('loadEnviosByFecha', (data: Envio[]) => {
          console.log('Productos recibidos para la fecha:', data);
          observer.next(data);
        });
      }

      return () => {
        if (this.socket) {
          this.socket.off('loadEnviosByFecha');
          console.log('Listener "loadEnviosByFecha" eliminado.');
        }
      };
    });
  }

  // Método para escuchar el evento de productos por fecha usando BehaviorSubject
listenToProductosByFecha(): Observable<Envio[]> {
  return this.envios$; // Devuelve el observable de enviosSubject para que otros componentes puedan suscribirse
}


  // Método adicional para obtener envío por ID
  getEnvioById(idEnvio: string): Observable<DetalleEnvio> {
    const token = this.tokenService.getToken();
    if (!token) {
      console.error('Token no disponible. No se puede enviar el mensaje.');
      return new Observable<DetalleEnvio>();
    }

    const mensaje = {
      idEnvio: idEnvio,
      token: token,
    };

    if (this.socket) {
      this.socket.emit('getEnvioById', mensaje);
    } else {
      console.error('Socket no inicializado.');
    }

    return new Observable<DetalleEnvio>((observer) => {
      const eventoRespuesta = `${idEnvio}-loadEnvioById`;

      if (this.socket) {
        this.socket.off(eventoRespuesta); // Asegura que no haya listeners duplicados
        this.socket.on(eventoRespuesta, (data: DetalleEnvio) => {
          console.log(`Datos recibidos para ${eventoRespuesta}:`, data);
          observer.next(data);
          observer.complete();
        });
      }

      return () => {
        if (this.socket) {
          this.socket.off(eventoRespuesta);
          console.log(`Listener "${eventoRespuesta}" eliminado.`);
        }
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socketConnected = false;
      this.isInitialized = false;
      console.log('Desconectado manualmente del socket de logística envíos');
      this.socket = null;
    }
  }
}
