import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from './services/auth-token.service';
import { PlanificacionSocketService } from './services/Sockets/planificacion.socket.service';
import { SocketInventarioService } from './services/Sockets/socket-inventario.service';
import { AuthService } from './services/Sockets/auth.service';
import { DataLoadService } from './services/data-load.service'; // Importa el nuevo servicio
import { EMPTY, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'frontend_web_muni';
  isSidebarCollapsed = false;
  currentToken: string | null = null;
  user: any = null;

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private inventarioSocketService: SocketInventarioService,
    private planificacionSocketService: PlanificacionSocketService,
    private authService: AuthService,
    private dataLoadService: DataLoadService // Inyecta el servicio de carga de datos
  ) {}

  ngOnInit(): void {
    // Suscríbete al token para asegurarte de que esté disponible antes de conectar el socket
    this.tokenService.getTokenObservable().subscribe(token => {
      if (token) {
        // Inicializa la conexión del socket solo si hay un token
        console.log('Token disponible en AppComponent:', token);
        this.inventarioSocketService.initializeConnection(token);
        this.planificacionSocketService.initializeConnection(token);
      } else {
        console.log('Token no disponible en AppComponent. Esperando...');
      }
    });
  }
  
  
  

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }
}
