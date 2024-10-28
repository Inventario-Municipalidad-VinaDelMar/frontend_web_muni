// detalleEnvio.model.ts
export interface DetalleEnvio {
    id: string;
    fecha: string;
    horaInicio: string;
    horaFinalizacion: string | null;
    status: string;
    administrador: Administrador;
    solicitante: Solicitante;
    movimientos: Movimiento[];
    entregas: Entrega[];
    cargaInicial: Producto[];
    cargaActual: Producto[];
  }
  
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
  
  export interface Movimiento {
    id: string;
    cantidadRetirada: number;
    producto: string;
    productoId: string;
    fecha: string;
    hora: string;
  }
  
  export interface Entrega {
    // Definir campos en caso de que haya detalles específicos para las entregas.
    // Si no hay información de campos adicionales, podemos definir como una interfaz vacía.
  }
  
  export interface Producto {
    producto: string;
    productoId: string;
    urlImagen: string;
    cantidad: number;
  }
  