import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PlanificacionSocketService } from './app/services/Sockets/planificacion.socket.service';
import { EnviosSocketService } from './app/services/Sockets/envios.service';
import { SocketInventarioService } from './app/services/Sockets/socket-inventario.service';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Actualiza el config asegurando que HttpClient y todos los servicios estén incluidos
const config = {
  ...appConfig,
  providers: [
    ...appConfig.providers || [],
    provideHttpClient(),
    provideAnimations(),
    PlanificacionSocketService,
    EnviosSocketService,
    SocketInventarioService, provideCharts(withDefaultRegisterables()), provideAnimationsAsync() // Añade también el servicio de inventario
  ],
};

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
