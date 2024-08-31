import { Routes } from '@angular/router';
import { PerfilComponent } from './components/perfil/perfil.component';
import { HomeComponent } from './components/home/home.component';
import { GestionUsuariosComponent } from './components/gestion-usuarios/gestion-usuarios.component';
import { BodegaComponent } from './components/bodega/bodega.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { PlanificacionComponent } from './components/planificacion/planificacion.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'perfil', component: PerfilComponent },
    { path: 'gestion-usuarios', component: GestionUsuariosComponent },
    { path: 'bodegas', component: BodegaComponent },
    { path: 'inventario', component: InventarioComponent },
    { path: 'planificacion', component: PlanificacionComponent }
];
