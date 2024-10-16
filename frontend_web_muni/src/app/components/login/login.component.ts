import { Component } from '@angular/core';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api'; // Importa el MessageService

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule],
  providers: [MessageService] // Proveedor del MessageService
})
export class LoginComponent {
  email: string = ''; 
  password: string = ''; 

  constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {}

  login() {
    console.log('Intentando iniciar sesión con:', this.email, this.password);

    this.authService.login(this.email, this.password).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        if (response.token) {
          this.authService.setAuthToken(response.token); // Solo se guarda en memoria, no en localStorage
          this.router.navigate(['/home']); // Redirige a la página de inicio
        } else {
          this.showError('No se recibió un token. Verifica tus credenciales.'); // Muestra un mensaje de error
        }
      },
      error => {
        this.showError('Email o contraseña incorrectos'); // Muestra un mensaje de error
        console.error('Error al iniciar sesión:', error);
      }
    );
  }

  private showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}
