import { Component, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlanificacionSocketService } from '../../services/Sockets/planificacion.socket.service';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { EnviosSocketService } from '../../services/Sockets/envios.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;
  activeCategory: string = 'home';

  constructor(
    private router: Router,
    private planificacionSocketService: PlanificacionSocketService,
    private inventarioSocketService: SocketInventarioService, // Inyecta otros servicios de sockets aquí
    private enviosSocketService: EnviosSocketService
  ) {}

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setActiveCategoryByRoute(event.urlAfterRedirects);
      }
    });
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  setActiveCategory(category: string): void {
    this.activeCategory = category;
    this.navigateToCategory(category);
  }

  isActive(category: string): boolean {
    return this.activeCategory === category;
  }

  setActiveCategoryByRoute(route: string): void {
    let category: string | null = null;
    if (route.includes('/planificacion')) {
      category = 'planificación';
    } else if (route.includes('/perfil')) {
      category = 'perfil';
    } else if (route.includes('/gestion-usuarios')) {
      category = 'gestión de usuarios';
    } else if (route.includes('/bodegas')) {
      category = 'bodegas';
    } else if (route.includes('/inventario')) {
      category = 'inventario';
    } else if (route.includes('/envios')) {
      category = 'envios';
    } else if (route === '/') {
      category = 'home';
    }

    if (category) {
      this.activeCategory = category;
    }
  }

  clearActiveClasses(): void {
    this.activeCategory = '';
  }

  navigateToCategory(category: string): void {
    switch (category) {
      case 'home':
        this.router.navigate(['/']);
        break;
      case 'perfil':
        this.router.navigate(['/perfil']);
        break;
      case 'gestión de usuarios':
        this.router.navigate(['/gestion-usuarios']);
        break;
      case 'bodegas':
        this.router.navigate(['/bodegas']);
        break;
      case 'inventario':
        this.router.navigate(['/inventario']);
        break;
      case 'planificación':
        this.router.navigate(['/planificacion']);
        break;
      case 'envios':
        this.router.navigate(['/envios']).then(() => {
          window.location.reload(); // Recarga la página al navegar a envios
        });
        break;
      case 'cerrar sesión':
        this.logout();
        break;
      default:
        break;
    }
  }

  logout(): void {
    console.log('Cerrar sesión');
    
    // Desconectar todos los sockets
    this.planificacionSocketService.disconnectSocket();
    this.inventarioSocketService.disconnectSocket(); // Llama a los métodos de desconexión de otros servicios de sockets
    this.enviosSocketService.disconnect();
    
    localStorage.removeItem('authToken'); // Eliminar el token de autenticación
    this.router.navigate(['/login']); // Redirigir a la página de login
  }

  
}
