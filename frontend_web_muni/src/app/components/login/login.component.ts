import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/Sockets/auth.service';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule],
  providers: [MessageService]
})
export class LoginComponent {
  email: string = ''; 
  password: string = ''; 
  errorMessage: string | null = null; 
  show: boolean = false;

  constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {}

  login() {
    console.log('Intentando iniciar sesión con:', this.email, this.password);

    this.authService.login(this.email, this.password).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        if (response.token) {
          this.authService.setAuthToken(response.token); 
          this.router.navigate(['/home']);
        } else {
          this.setError('No se recibió un token. Verifica tus credenciales.');
        }
      },
      error => {
        this.setError('Email o contraseña incorrectos');
        console.error('Error al iniciar sesión:', error);
      }
    );
  }

  private setError(message: string) {
    this.errorMessage = message; 
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  clearError() {
    this.errorMessage = null; 
  }

  togglePasswordVisibility() {
    this.show = !this.show;
  }
}
