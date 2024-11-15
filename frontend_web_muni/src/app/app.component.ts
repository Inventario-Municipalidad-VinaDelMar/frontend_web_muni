import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from './services/auth-token.service';
import { PlanificacionSocketService } from './services/Sockets/planificacion.socket.service';
import { SocketInventarioService } from './services/Sockets/socket-inventario.service';
import { EnviosSocketService } from './services/envios.service'; // Asegúrate de importar EnviosSocketService
import { Subscription } from 'rxjs';

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
    private enviosSocketService: EnviosSocketService // Agrega EnviosSocketService si también es necesario
  ) {}

  ngOnInit(): void {
    // Suscríbete al token para asegurarte de que esté disponible antes de conectar los sockets
    this.tokenService.getTokenObservable().subscribe(token => {
      if (token && token !== this.currentToken) {
        // Solo inicializa las conexiones si el token es nuevo o ha cambiado
        this.currentToken = token;
        console.log('Token disponible en AppComponent:', token);
        
        // Inicia las conexiones de socket
        this.initializeSocketConnections(token);

        // Agrega las suscripciones a los eventos del socket de inventario
        this.listenToInventarioEvents();
      } else if (!token) {
        console.log('Token no disponible en AppComponent. Esperando...');
      }
    });
  }

  // Método para inicializar las conexiones de socket
  private initializeSocketConnections(token: string): void {
    if (!this.inventarioSocketService.isConnected()) {
      this.inventarioSocketService.initializeConnection(token);
    }

    if (!this.planificacionSocketService.isConnected()) {
      this.planificacionSocketService.initializeConnection(token);
    }

    if (!this.enviosSocketService.isConnected()) { // Si necesitas la conexión del socket de envíos
      this.enviosSocketService.initSocketConnection();
    }
  }

  // Método para escuchar los eventos del socket de inventario
  private listenToInventarioEvents(): void {
    // Escucha cuando se crea una nueva tanda
    const newTandaCreatedSub = this.inventarioSocketService.listenNewTandaCreated().subscribe((tanda) => {
      console.log('Nueva tanda creada:', tanda);
      this.handleInventoryUpdate();
    });

    // Escucha cuando se actualiza una tanda existente
    const newTandaUpdateSub = this.inventarioSocketService.listenNewTandaUpdate().subscribe((tanda) => {
      console.log('Tanda actualizada:', tanda);
      this.handleInventoryUpdate();
    });

    // Escucha cambios en el stock de productos
    const stockProductoChangeSub = this.inventarioSocketService.listenStockProductoChange().subscribe((producto) => {
      console.log('Cambio en stock de producto:', producto);
      this.handleInventoryUpdate();
    });

    // Almacena las suscripciones para limpiarlas al destruir el componente
    this.subscriptions.push(newTandaCreatedSub, newTandaUpdateSub, stockProductoChangeSub);
  }

  // Método para manejar la actualización del inventario
  private handleInventoryUpdate(): void {
    console.log('Inventario actualizado');
  }

  // Método para limpiar las suscripciones al destruir el componente
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.inventarioSocketService.disconnectSocket(); // Desconecta el socket si se destruye el AppComponent
    this.planificacionSocketService.disconnectSocket(); // Desconecta el socket de planificación también
    this.enviosSocketService.disconnect(); // Desconecta el socket de envíos si es necesario
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  
}
