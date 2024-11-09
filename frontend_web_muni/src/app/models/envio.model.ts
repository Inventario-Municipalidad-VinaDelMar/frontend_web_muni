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
export interface ProductoAfectado {
  cantidad: number;
  producto: string;
  productoId: string;
  urlImagen: string;
}

export interface Incidente {
  id: string;
  fecha: string;
  hora: string;
  descripcion: string;
  type: string;
  evidenciaFotograficaUrl: string;
  productosAfectados: ProductoAfectado[];
}

export interface Envio {
  id: string;
  fecha: string;
  horaCreacion: string;
  horaInicioEnvio: string;
  ultimaActualizacion: string;
  horaFinalizacion: string | null;
  status: string;
  autorizante: string;
  solicitante: string;
  productos: Producto[];
  entregas: any[];
  incidentes: Incidente[]; // Asegúrate de que esté siempre definido como un arreglo, no como undefined
}

