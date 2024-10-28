import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { TokenService } from './auth-token.service';
import { Envio } from '../models/envio.model';
import { DetalleEnvio } from '../models/detalle-envio.model';

@Injectable({
  providedIn: 'root',
})
export class EnviosSocketService {
  private socket: Socket;

  constructor(private tokenService: TokenService) {
    const config: SocketIoConfig = {
      url: 'http://34.176.26.41/logistica/envios',
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
      console.log('Conectado al socket de logística envíos');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del socket de logística envíos');
    });
  }

  loadEnviosByFecha(fecha: string): Observable<Envio[]> {
    const token = this.tokenService.getToken();

    if (!token) {
      console.error('Token no disponible. No se puede enviar el mensaje.');
      return new Observable<Envio[]>(); // Retornar un observable vacío
    }

    const mensaje = {
      fecha: fecha,
      token: token,
    };

    // Emitir el mensaje para solicitar envíos por fecha
    this.socket.emit('getEnviosByFecha', mensaje);

    // Devolver un observable que escucha la respuesta
    return new Observable<Envio[]>((observer) => {
      this.socket.on('loadEnviosByFecha', (data: Envio[]) => {
        console.log('Datos recibidos:', data);
        observer.next(data); // Enviar los datos recibidos al observador
        observer.complete(); // Completar el observable después de recibir los datos
      });

      // Limpiar el listener al completar el observable
      return () => {
        this.socket.off('loadEnviosByFecha');
      };
    });
  }

  getEnvioById(idEnvio: string): Observable<DetalleEnvio> {
    const token = this.tokenService.getToken();

    if (!token) {
      console.error('Token no disponible. No se puede enviar el mensaje.');
      return new Observable<DetalleEnvio>(); // Retornar un observable vacío
    }

    const mensaje = {
      idEnvio: idEnvio,
      token: token,
    };

    this.socket.emit('getEnvioById', mensaje);

    return new Observable<DetalleEnvio>((observer) => {
      const eventoRespuesta = `${idEnvio}-loadEnvioById`;

      this.socket.on(eventoRespuesta, (data: DetalleEnvio) => {
        console.log(`Datos recibidos para ${eventoRespuesta}:`, data);
        observer.next(data);
        observer.complete();
      });

      return () => {
        this.socket.off(eventoRespuesta);
      };
    });
  }

  onLoadEnviosByFecha(): Observable<Envio[]> {
    return new Observable<Envio[]>((observer) => {
      this.socket.on('loadEnviosByFecha', (data: Envio[]) => {
        console.log('Datos recibidos:', data);
        observer.next(data); // Enviar los datos recibidos al observador
      });
      return () => {
        this.socket.off('loadEnviosByFecha');
      };
    });
  }

  disconnect() {
    this.socket.disconnect();
    console.log('Desconectado manualmente del socket de logística envíos');
  }
}
