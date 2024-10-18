export interface Usuario {
    id: string; // ID del usuario
    rut: string; // RUT del usuario
    email: string; // Correo electrónico
    nombre: string; // Nombre
    apellidoPaterno: string; // Apellido paterno
    apellidoMaterno: string; // Apellido materno
    imageUrl?: string | null; // URL de la imagen (opcional)
    roles: string[]; // Lista de roles
  }
  