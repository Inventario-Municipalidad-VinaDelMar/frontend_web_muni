import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Importar Router
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from './services/auth-token.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend_web_muni';
  isSidebarCollapsed = false; // Estado del sidebar
  currentToken: string | null = null; // Almacenar el token actual

  constructor(private router: Router, private tokenService: TokenService,) { // Inyectar el Router y TokenService
    // Suscribirse al tokenObservable para recibir actualizaciones del token
    this.tokenService.getTokenObservable().subscribe(token => {
      this.currentToken = token; // Actualizar el token actual
      console.log('Token actualizado en AppComponent:', this.currentToken);
      
      // Aquí puedes manejar la lógica de redirección si el token es null
      if (!this.currentToken) {
        this.router.navigate(['/login']); // Redirigir a la página de login si no hay token
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed; // Cambiar el estado del sidebar
  }

  // Método para verificar si la ruta actual es '/login'
  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }
}
