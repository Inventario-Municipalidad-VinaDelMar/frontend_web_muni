import { Routes } from '@angular/router';
import { PerfilComponent } from './components/perfil/perfil.component';
import { HomeComponent } from './components/home/home.component';
import { GestionUsuariosComponent } from './components/gestion-usuarios/gestion-usuarios.component';
import { BodegaComponent } from './components/bodega/bodega.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { PlanificacionComponent } from './components/planificacion/planificacion.component';
import { LoginComponent } from './components/login/login.component';
// Cambiar la importación de AuthGuard a authGuard
import { authGuard } from './guards/auth.guard';
import { EnviosComponent } from './components/envios/envios.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent }, // Ruta pública
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
  { path: 'gestion-usuarios', component: GestionUsuariosComponent, canActivate: [authGuard] },
  { path: 'bodegas', component: BodegaComponent, canActivate: [authGuard] },
  { path: 'inventario', component: InventarioComponent, canActivate: [authGuard] },
  { path: 'planificacion', component: PlanificacionComponent, canActivate: [authGuard] },
  { path: 'envios', component: EnviosComponent, canActivate: [authGuard] },
  {
    path: 'detalle-envio/:id',
    loadComponent: () => import('./components/detalle-tarjetas/detalle-tarjetas.component').then(c => c.DetalleTarjetasComponent)
  }

];

