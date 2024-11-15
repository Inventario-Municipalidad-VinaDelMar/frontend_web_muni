import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api'; // Para mostrar mensajes
import { Usuario } from '../../models/usuario.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // <-- Importa ReactiveFormsModule
import { AuthService } from '../../services/Sockets/auth.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule,FormsModule,DialogModule,MultiSelectModule,ReactiveFormsModule,PasswordModule,ConfirmDialogModule,HttpClientModule, ],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss'],
  providers: [MessageService,ConfirmationService], // Proveedor para los mensajes de PrimeNG
})
export class GestionUsuariosComponent {
  usuarios: Usuario[] = []; // Lista de usuarios
  usuarioSeleccionado: Usuario | null = null; // Usuario seleccionado
  mostrarDialogoAgregar: boolean = false; // Controla la visibilidad del diálogo de agregar usuario
  mostrarDialogoDetalles: boolean = false; // Controla la visibilidad del diálogo de detalles de usuario
  nuevoUsuario: Partial<Usuario> = { rut: '', email: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '', roles: [] }; // Nuevo usuario
  usuarioEditable: Usuario = {
    id: '',
    rut: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    roles: [],
    password:'',
  };
  rolesOptions = [
    { label: 'Bodeguero', value: 'bodeguero' },
    { label: 'Administrador', value: 'administrador' }
  ];
  
  usuarioForm!: FormGroup;
  editarUsuarioForm!: FormGroup;
  mostrarDialogoEditar: boolean = false;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private http: HttpClient,
    
  ) {
    this.obtenerUsuarios();
  }

  ngOnInit(): void {
    // Configuración del formulario y validaciones
    this.usuarioForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern(/^\d{7,8}-[0-9kK]$/)]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(3)]],
      apellidoMaterno: ['', Validators.minLength(3)],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      roles: [[], Validators.required]
    });
    this.editarUsuarioForm = this.fb.group({
      rut: [this.usuarioEditable?.rut, [Validators.required, Validators.pattern(/^\d{7,8}-[0-9kK]$/)]],
      nombre: [this.usuarioEditable?.nombre, [Validators.required, Validators.minLength(3)]],
      apellidoPaterno: [this.usuarioEditable?.apellidoPaterno, [Validators.required, Validators.minLength(3)]],
      apellidoMaterno: [this.usuarioEditable?.apellidoMaterno, Validators.minLength(3)],
      email: [this.usuarioEditable?.email, [Validators.required, Validators.email]],
      roles: [this.usuarioEditable?.roles, Validators.required]
    });
    
  }


  obtenerUsuarios() {
    this.authService.obtenerUsuarios().subscribe(
      (data) => {
        this.usuarios = data; // Asigna los usuarios obtenidos de la API
      },
      (error) => {
        console.error('Error al obtener usuarios:', error);
      }
    );
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
    if (this.nuevoUsuario && this.nuevoUsuario.rut && this.nuevoUsuario.nombre && this.nuevoUsuario.email && this.nuevoUsuario.password) {
      // Validación de roles
      if (!this.nuevoUsuario.roles || this.nuevoUsuario.roles.length === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar al menos un rol' });
        return;
      }
      // Crear el payload del usuario
      const userPayload = {
        email: this.nuevoUsuario.email,
        password: this.nuevoUsuario.password,
        rut: this.nuevoUsuario.rut,
        nombre: this.nuevoUsuario.nombre,
        apellidoPaterno: this.nuevoUsuario.apellidoPaterno ?? '',
        apellidoMaterno: this.nuevoUsuario.apellidoMaterno ?? '',
        roles: this.nuevoUsuario.roles,
      };
  
      this.authService.register(userPayload).subscribe(
        (response) => {
          const usuario: Usuario = {
            id: response.id || (this.usuarios.length + 1).toString(),
            ...userPayload,
          };
          this.usuarios.push(usuario);
          
          // Mostrar mensaje de éxito en PrimeNG y alerta de Windows
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario registrado correctamente' });
          alert('Se ha creado un nuevo usuario.');
          
          this.cerrarDialogoAgregar();
        },
        (error) => {
          const errorMessage = error.error?.message || 'Error desconocido al registrar el usuario';
          this.messageService.add({ severity: 'error', summary: 'Error en el registro', detail: errorMessage });
          console.error('Error al registrar el usuario:', error);
        }
      );
    } else {
      console.error('Faltan campos obligatorios en el nuevo usuario');
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Faltan campos obligatorios' });
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


  abrirDialogoEditar(usuario: Usuario) {
    this.usuarioEditable = { ...usuario }; // Clonar el usuario para editarlo sin modificar el original
    this.mostrarDialogoEditar = true;
  }
  
  cerrarDialogoEditar() {
    this.mostrarDialogoEditar = false;
  }
  
  guardarCambiosUsuario() {
    const url = `http://34.176.26.41/api/auth/${this.usuarioEditable.id}/update`;
    const token = localStorage.getItem('authToken'); // Obtiene el token del local storage
  
    if (!token) {
      console.error('Token no encontrado');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Token no encontrado' });
      return;
    }
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    // Seleccionar solo las propiedades permitidas en lugar de eliminar las no permitidas
    const datosActualizables = {
      email: this.usuarioEditable.email,
      password: this.usuarioEditable.password,
      rut: this.usuarioEditable.rut,
      nombre: this.usuarioEditable.nombre,
      apellidoPaterno: this.usuarioEditable.apellidoPaterno,
      apellidoMaterno: this.usuarioEditable.apellidoMaterno,
      roles: this.usuarioEditable.roles
    };
  
    // Realizar el PATCH con los datos del usuario editable
    this.http.patch(url, datosActualizables, { headers })
      .subscribe(
        (response: any) => {
          console.log('Usuario actualizado exitosamente', response);
          
          // Actualiza el usuario en la lista local para reflejar los cambios
          const index = this.usuarios.findIndex(usuario => usuario.id === this.usuarioEditable.id);
          if (index !== -1) {
            this.usuarios[index] = { ...this.usuarioEditable }; // Actualiza el usuario en la lista
          }
  
          // Mostrar toast de éxito
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente' });
  
          // Cierra el diálogo después de guardar
          this.mostrarDialogoEditar = false;
        },
        error => {
          console.error('Error al actualizar el usuario', error);
  
          // Mostrar toast de error
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario' });
        }
      );
  }
  
  
  eliminarUsuario(id: string): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este usuario?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      rejectButtonStyleClass: 'p-button-danger p-button-outlined p-button-rounded',
      accept: () => {
        // Llama al servicio para eliminar el usuario en el servidor
        this.authService.eliminarUsuario(id).subscribe(
          () => {
            // Si la eliminación es exitosa, elimina al usuario del array local
            this.usuarios = this.usuarios.filter((usuario) => usuario.id !== id);
            console.log('Usuario eliminado:', id);
  
            // Muestra una alerta confirmando que el usuario ha sido eliminado
            alert('El usuario ha sido eliminado exitosamente.');
          },
          (error) => {
            console.error('Error al eliminar el usuario:', error);
          }
        );
      },
      reject: () => {
        console.log('Eliminación cancelada');
      }
    });
  }
  

  

  passwordValidator(control: any): { [key: string]: boolean } | null {
    const value = control.value;
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
      return { passwordStrength: true };
    }
    return null;
  }

  getRutErrorMessage() {
    const rutControl = this.usuarioForm.get('rut');
    if (rutControl?.hasError('required')) {
      return 'El RUT es obligatorio';
    } else if (rutControl?.hasError('pattern')) {
      return 'Formato de RUT inválido (Ej: 12345678-9)';
    }
    return '';
  }

  getEmailErrorMessage() {
    const emailControl = this.usuarioForm.get('email');
    const emailValue = emailControl?.value;
  
    if (emailControl?.hasError('required')) {
      return 'El email es obligatorio';
    } else if (emailControl?.hasError('email')) {
      return 'Debe ingresar un email válido';
    } else if (this.usuarios.some((usuario) => usuario.email === emailValue)) {
      return 'Este correo ya está registrado';
    }
    
    return '';
  }
  
  getNombreErrorMessage() {
    const nombreControl = this.usuarioForm.get('nombre');
    if (nombreControl?.hasError('required')) {
      return 'El nombre es obligatorio';
    } else if (nombreControl?.hasError('minlength')) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    return '';
  }
  getApellidoPaternoErrorMessage() {
    const apellidoControl = this.usuarioForm.get('apellidoPaterno');
    if (apellidoControl?.hasError('required')) {
      return 'El apellido paterno es obligatorio';
    } else if (apellidoControl?.hasError('minlength')) {
      return 'El apellido paterno debe tener al menos 3 caracteres';
    }
    return '';
  }
  getApellidoMaternoErrorMessage() {
    const apellidoMaternoControl = this.usuarioForm.get('apellidoMaterno');
    if (apellidoMaternoControl?.hasError('minlength')) {
      return `El apellido materno debe tener al menos ${apellidoMaternoControl.errors?.['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  onSubmit() {
    if (this.usuarioForm.valid) {
      // Verificar si el apellido materno está vacío y asignarle "N/A" si es necesario
      const nuevoUsuario = { ...this.usuarioForm.value }; // Clona el objeto del formulario
      if (!nuevoUsuario.apellidoMaterno) {
        nuevoUsuario.apellidoMaterno = 'N/A'; // Usar "N/A" para cumplir con la longitud mínima
      }
  
      this.authService.register(nuevoUsuario).subscribe(
        response => {
          this.usuarios.push(response);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario registrado correctamente' });
          this.cerrarDialogoAgregar();
        },
        error => {
          const errorMessage = error.error?.message || 'Error desconocido al registrar el usuario';
          this.messageService.add({ severity: 'error', summary: 'Error en el registro', detail: errorMessage });
          console.error('Error al registrar el usuario:', error);
        }
      );
    } else {
      this.usuarioForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error en el formulario', detail: 'Por favor, complete todos los campos correctamente' });
    }
  }
  
  
}
