import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { InjectionToken } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { routes } from './app.routes';  // Asegúrate de usar la ruta correcta
import { TokenService } from './services/auth-token.service';

// Define un InjectionToken para la configuración de SocketIo
export const SOCKET_IO_CONFIG_INVENTARIO = new InjectionToken<SocketIoConfig>('SocketIoConfigInventario');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    { 
      provide: SOCKET_IO_CONFIG_INVENTARIO, 
      useFactory: (tokenService: TokenService) => {
        const token = tokenService.getToken();
        return {
          url: 'http://34.176.26.41/inventario',
          options: {
            extraHeaders: {
              authentication: token || ''  // Usar el token almacenado
            }
          }
        };
      },
      deps: [TokenService]
    },
    {
      provide: Socket,
      useFactory: (config: SocketIoConfig) => new Socket(config),
      deps: [SOCKET_IO_CONFIG_INVENTARIO]
    }
  ],
};
