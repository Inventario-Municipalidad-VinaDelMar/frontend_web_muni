import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../services/Sockets/auth.service';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  imports: [CardModule, CommonModule, ButtonModule, FormsModule,ToastModule,    DialogModule],
  providers: [MessageService],
})
export class PerfilComponent implements OnInit, OnDestroy {
  usuario: any = {}; // Información del usuario
  usuarioEditable = {
    email: '',            // string opcional
    password: '',         // string opcional con restricciones
    rut: '',              // string opcional con formato RUT
    nombre: '',           // string opcional con mínimo de 3 caracteres
    apellidoPaterno: '',  // string opcional con mínimo de 3 caracteres
    apellidoMaterno: '',  // string opcional con mínimo de 3 caracteres
    roles: [] as string[] // array opcional de strings
  };
  mostrarDialogoEditarPerfil: boolean = false; // Controla la visibilidad del diálogo
  mostrarContrasena: boolean = false; 
  private userSubscription: Subscription | undefined; // Suscripción para el observable de usuario

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private messageService: MessageService, 
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribirse al observable de usuario para obtener actualizaciones en tiempo real
    this.userSubscription = this.authService.getUserObservable().subscribe(
      (user) => {
        this.usuario = user;
      }
    );
  }

  ngOnDestroy() {
    // Cancelar la suscripción cuando se destruya el componente
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
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
  const user = this.authService.getUser();
  if (!user) {
    console.error('Usuario no encontrado');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Usuario no encontrado' });
    return;
  }

  const url = `http://34.176.26.41/api/auth/${user.id}/update`;
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.error('Token no encontrado');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Token no encontrado' });
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const datosActualizables = {
    email: this.usuarioEditable.email,
    password: this.usuarioEditable.password,
    rut: this.usuarioEditable.rut,
    nombre: this.usuarioEditable.nombre,
    apellidoPaterno: this.usuarioEditable.apellidoPaterno,
    apellidoMaterno: this.usuarioEditable.apellidoMaterno,
    roles: this.usuarioEditable.roles
  };

  this.http.patch(url, datosActualizables, { headers })
    .subscribe(
      (response: any) => {
        console.log('Perfil actualizado exitosamente', response);
        this.authService.setUser(response); // Actualiza el usuario en el AuthService para reflejar los cambios
        this.cerrarDialogoEditarPerfil();
        
        // Mostrar toast de éxito
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado correctamente' });
      },
      error => {
        console.error('Error al actualizar el perfil', error);
        
        // Mostrar toast de error
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el perfil' });
      }
    );
}


  logout(): void {
    console.log('Cerrar sesión');
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }

  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }
}
