import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api'; // Para mostrar mensajes
import { Usuario } from '../../models/usuario.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss'],
  providers: [MessageService], // Proveedor para los mensajes de PrimeNG
})
export class GestionUsuariosComponent {
  usuarios: Usuario[] = []; // Lista de usuarios
  usuarioSeleccionado: Usuario | null = null; // Usuario seleccionado
  mostrarDialogoAgregar: boolean = false; // Controla la visibilidad del diálogo de agregar usuario
  mostrarDialogoDetalles: boolean = false; // Controla la visibilidad del diálogo de detalles de usuario
  nuevoUsuario: Partial<Usuario> = { rut: '', email: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '', roles: [] }; // Nuevo usuario

  constructor() {
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    // Simulación de obtener usuarios desde un servicio
    this.usuarios = [
      {
        id: '1',
        rut: '12345678-9',
        email: 'usuario1@example.com',
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'Gómez',
        roles: ['administrador'],
      },
      {
        id: '2',
        rut: '98765432-1',
        email: 'usuario2@example.com',
        nombre: 'María',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Martínez',
        roles: ['usuario'],
      },
    ];
  }

  // Métodos para el diálogo de agregar usuario
  abrirDialogoAgregar() {
    this.mostrarDialogoAgregar = true;
  }

  cerrarDialogoAgregar() {
    this.mostrarDialogoAgregar = false;
    this.nuevoUsuario = { rut: '', email: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '', roles: [] };
  }

  guardarUsuario() {
    if (this.nuevoUsuario && this.nuevoUsuario.rut && this.nuevoUsuario.nombre) {
      const nuevoId = this.usuarios.length > 0 ? (parseInt(this.usuarios[this.usuarios.length - 1].id, 10) + 1).toString() : '1';
      const usuario: Usuario = {
        id: nuevoId,
        rut: this.nuevoUsuario.rut,
        nombre: this.nuevoUsuario.nombre,
        apellidoPaterno: this.nuevoUsuario.apellidoPaterno || '',
        apellidoMaterno: this.nuevoUsuario.apellidoMaterno || '',
        email: this.nuevoUsuario.email || '',
        roles: this.nuevoUsuario.roles ? this.nuevoUsuario.roles.toString().split(',').map(role => role.trim()) : [],
      };

      this.usuarios.push(usuario);
      this.cerrarDialogoAgregar();
    } else {
      console.error('Faltan campos obligatorios en el nuevo usuario');
    }
  }

  // Métodos para el diálogo de detalles de usuario
  seleccionarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.mostrarDialogoDetalles = true;
  }

  cerrarDialogoDetalles() {
    this.mostrarDialogoDetalles = false;
    this.usuarioSeleccionado = null;
  }
}
