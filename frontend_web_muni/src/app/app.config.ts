import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { InjectionToken } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { routes } from './app.routes';

// Define un InjectionToken para la configuración de SocketIo
export const SOCKET_IO_CONFIG = new InjectionToken<SocketIoConfig>('SocketIoConfig');

// Define la configuración del WebSocket
const config: SocketIoConfig = {
   url: 'http://34.176.26.41/inventario',
    options: {
      extraHeaders:{
        authentication:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhlODYwYTYxLTViZmMtNGEyYi1hMWEyLTU5OTc5YzFkOTAzZiIsImlhdCI6MTcyODYxMjIwOCwiZXhwIjoxNzI4NjE5NDA4fQ.p04fVlVm41R1qQSqxtqoalg9hISLdy2asW5vZ89oFW4'
      }

    } };

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    { 
      provide: SOCKET_IO_CONFIG, 
      useValue: config 
    },
    {
      provide: Socket,
      useFactory: (config: SocketIoConfig) => new Socket(config),
      deps: [SOCKET_IO_CONFIG]
    }
  ],
};
