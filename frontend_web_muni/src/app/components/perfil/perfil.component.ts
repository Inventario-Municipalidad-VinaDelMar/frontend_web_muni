import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../services/Sockets/auth.service';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  imports: [CardModule, CommonModule, ButtonModule],
})
export class PerfilComponent {
  usuario: any = {}; // Se puede declarar como un objeto sin definir detalles específicos

  constructor(private authService: AuthService, private router: Router) {
    this.cargarUsuario();
  }

  cargarUsuario() {
    const usuarioGuardado = this.authService.getUser();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    } else {
      console.error('No se encontró información del usuario.');
    }
  }

  logout(): void {
    console.log('Cerrar sesión');
    localStorage.removeItem('authToken'); // Eliminar el token de autenticación
    this.router.navigate(['/login']); // Redirigir a la página de login
  }
}
