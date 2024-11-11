import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../services/Sockets/auth.service';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  imports: [CardModule, CommonModule, ButtonModule,FormsModule,DialogModule],
})
export class PerfilComponent {
  usuario: any = {}; // Información del usuario
  usuarioEditable: any = {}; // Información temporal para editar
  mostrarDialogoEditarPerfil: boolean = false; // Controla la visibilidad del diálogo

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

  abrirDialogoEditarPerfil() {
    this.usuarioEditable = { ...this.usuario }; // Clona los datos del usuario actual
    this.mostrarDialogoEditarPerfil = true;
  }

  cerrarDialogoEditarPerfil() {
    this.mostrarDialogoEditarPerfil = false;
  }

  guardarCambiosPerfil() {
    this.usuario = { ...this.usuarioEditable }; // Guarda los cambios
    this.mostrarDialogoEditarPerfil = false;
  }

  logout(): void {
    console.log('Cerrar sesión');
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}