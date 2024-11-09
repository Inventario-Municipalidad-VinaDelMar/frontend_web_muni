import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from './services/auth-token.service';
import { PlanificacionSocketService } from './services/Sockets/planificacion.socket.service';
import { SocketInventarioService } from './services/Sockets/socket-inventario.service';
import { EMPTY, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend_web_muni';
  isSidebarCollapsed = false;
  currentToken: string | null = null;
  user: any = null;
  private subscriptions: Subscription[] = []; // Array para manejar las suscripciones

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private inventarioSocketService: SocketInventarioService,
    private planificacionSocketService: PlanificacionSocketService,
  ) {}

  ngOnInit(): void {
    // Suscríbete al token para asegurarte de que esté disponible antes de conectar el socket
    this.tokenService.getTokenObservable().subscribe(token => {
      if (token) {
        console.log('Token disponible en AppComponent:', token);
        this.inventarioSocketService.initializeConnection(token);
        this.planificacionSocketService.initializeConnection(token);
        
        // Agrega las suscripciones a los eventos del socket de inventario
        this.listenToInventarioEvents();
      } else {
        console.log('Token no disponible en AppComponent. Esperando...');
      }
    });
  }

  // Método para escuchar los eventos del socket de inventario
  private listenToInventarioEvents(): void {
    // Escucha cuando se crea una nueva tanda
    const newTandaCreatedSub = this.inventarioSocketService.listenNewTandaCreated().subscribe((tanda) => {
      console.log('Nueva tanda creada:', tanda);
      // Acción cuando se detecta una nueva tanda creada
      this.handleInventoryUpdate();
    });

    // Escucha cuando se actualiza una tanda existente
    const newTandaUpdateSub = this.inventarioSocketService.listenNewTandaUpdate().subscribe((tanda) => {
      console.log('Tanda actualizada:', tanda);
      // Acción cuando se detecta una actualización en una tanda
      this.handleInventoryUpdate();
    });

    // Escucha cambios en el stock de productos
    const stockProductoChangeSub = this.inventarioSocketService.listenStockProductoChange().subscribe((producto) => {
      console.log('Cambio en stock de producto:', producto);
      // Acción cuando hay un cambio en el stock de productos
      this.handleInventoryUpdate();
    });

    // Almacena las suscripciones para limpiarlas al destruir el componente
    this.subscriptions.push(newTandaCreatedSub, newTandaUpdateSub, stockProductoChangeSub);
  }

  // Método para manejar la actualización del inventario
  private handleInventoryUpdate(): void {
    // Aquí puedes realizar la acción deseada cuando se detecte un cambio en el inventario
    // Por ejemplo, puedes refrescar la vista o actualizar un estado compartido
    console.log('Inventario actualizado');
  }

  // Método para limpiar las suscripciones al destruir el componente
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }
}
