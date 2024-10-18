import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Importar provideHttpClient

// Actualiza tu appConfig para incluir HttpClient
const config = {
  ...appConfig,
  providers: [
    ...appConfig.providers || [], // Asegúrate de mantener los proveedores existentes
    provideHttpClient(), provideAnimationsAsync(), // Proveer HttpClient aquí
  ],
};

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
