import { Component } from '@angular/core'; // Asegúrate de importar tu modelo de usuario
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Usuario } from '../../usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  imports: [CardModule,CommonModule],
})
export class PerfilComponent {
  usuario: Usuario = { // Proporciona un valor por defecto
    id: '',
    rut: '',
    email: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    imageUrl: null,
    roles: []
  };

  constructor() {
    this.cargarUsuario();
  }

  cargarUsuario() {
    const usuarioJson = localStorage.getItem('authUser');
    if (usuarioJson) {
      this.usuario = JSON.parse(usuarioJson);
    } else {
      console.error('No se encontró información del usuario en localStorage');
    }
  }
}
