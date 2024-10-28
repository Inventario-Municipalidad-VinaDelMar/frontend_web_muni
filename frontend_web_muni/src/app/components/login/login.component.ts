import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/Sockets/auth.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel'; 

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule, PasswordModule, InputTextModule, ButtonModule,InputTextModule,FloatLabelModule],
  providers: [MessageService]
  })
  export class LoginComponent {
    email: string = '';
    password: string = '';
    errorMessage: string | null = null;
    showPassword: boolean = false; // Propiedad para controlar la visibilidad

  

  
    constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {}
  
    login() {
      this.clearError(); // Limpiar errores antes de iniciar sesión
  
      if (this.isValidEmail(this.email) && this.password) {
        this.authService.login(this.email, this.password).subscribe(
          response => {
            if (response.token) {
              this.authService.setAuthToken(response.token);
              this.authService.setUser(response);
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
      } else {
        this.setError('Por favor, introduce un email válido y una contraseña.');
      }
    }
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword; // Alternar visibilidad
    }
  
    private isValidEmail(email: string): boolean {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    }
  
    private setError(message: string) {
      this.errorMessage = message;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
  
    clearError() {
      this.errorMessage = null;
    }
  
  }