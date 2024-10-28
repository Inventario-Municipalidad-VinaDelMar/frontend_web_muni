import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api'; // Para mostrar mensajes
import { TableModule } from 'primeng/table'; // Para usar p-table
import { PanelModule } from 'primeng/panel'; // Para usar p-panel
import { CardModule } from 'primeng/card'; // Para usar p-card
import { AuthService } from '../../services/Sockets/auth.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../models/usuario.model';


import { DividerModule } from 'primeng/divider'; // Para agregar separador

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [TableModule, PanelModule, CardModule,CommonModule,ButtonModule,DialogModule,FormsModule,DividerModule ],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss'],
  providers: [MessageService], // Proveedor para los mensajes de PrimeNG
})

export class GestionUsuariosComponent {
  usuarios: Usuario[] = []; // Lista de usuarios
  usuarioSeleccionado: Usuario | null = null; // Usuario seleccionado
  mostrarDialogoAgregar: boolean = false; // Controla la visibilidad del diálogo
  nuevoUsuario: Usuario = { id: '', rut: '', email: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '', roles: [] }; // Nuevo usuario

  constructor() {
    // Inicializa la lista de usuarios
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
        roles: ['administrador']
      },
      {
        id: '2',
        rut: '98765432-1',
        email: 'usuario2@example.com',
        nombre: 'María',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Martínez',
        roles: ['usuario']
      }
    ];
  }

  mostrarDetalles() {
    // Método para mostrar detalles del usuario seleccionado
    console.log(this.usuarioSeleccionado);
  }

  abrirDialogoAgregar() {
    this.mostrarDialogoAgregar = true; // Muestra el diálogo para agregar un nuevo usuario
  }

  cerrarDialogoAgregar() {
    this.mostrarDialogoAgregar = false; // Oculta el diálogo
    this.nuevoUsuario = { id: '', rut: '', email: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '', roles: [] }; // Reinicia el nuevo usuario
  }

  guardarUsuario() {
    // Método para guardar el nuevo usuario (simulación)
    this.usuarios.push({ ...this.nuevoUsuario, id: (this.usuarios.length + 1).toString() });
    this.cerrarDialogoAgregar(); // Cierra el diálogo después de guardar
  }

  abrirDialogoEditar(usuario: Usuario) {
    // Método para abrir el diálogo de edición (a implementar)
    console.log('Editar usuario:', usuario);
  }
}
