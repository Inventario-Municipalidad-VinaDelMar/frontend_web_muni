export interface Solicitante {
  id: string;
  rut: string;
  email: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  imageUrl: string | null;
  isActive: boolean;
  roles: string[];
}

export interface Administrador {
  id: string;
  rut: string;
  email: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  imageUrl: string | null;
  isActive: boolean;
  roles: string[];
}

export interface Solicitud {
  id: string;
  fechaSolicitud: string;
  horaSolicitud: string;
  horaResolucion: string | null;
  status: string;
  isDeleted: boolean;
  solicitante: Solicitante;
  administrador: Administrador;
}

export interface Producto {
  producto: string;
  productoId: string;
  urlImagen: string;
  cantidad: number;
}

export interface Envio {
  id: string;
  fecha: string;  // Fecha de creación del envío
  horaCreacion: string; // Nueva propiedad para almacenar la hora de creación
  horaInicioEnvio: string; // Cambiado para coincidir con el JSON proporcionado
  ultimaActualizacion: string; // Nueva propiedad
  horaFinalizacion: string | null;
  status: string;
  autorizante: string; // Nombre del autorizante en string
  solicitante: string; // Nombre del solicitante en string
  productos: Producto[];
  entregas: any[]; // Para almacenar posibles datos adicionales de entregas
}
