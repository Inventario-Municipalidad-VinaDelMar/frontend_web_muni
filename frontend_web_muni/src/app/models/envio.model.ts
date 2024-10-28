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
    fecha: string;
    horaInicio: string;
    horaFinalizacion: string | null;
    status: string;
    solicitud: Solicitud;
    productos: Producto[];
  }
  