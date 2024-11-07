export interface DetalleEnvio {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFinalizacion: string | null;
  status: string;
  administrador: Persona;
  solicitante: Persona;
  movimientos: Movimiento[];
  entregas: Entrega[];
  cargaInicial: Producto[];
  cargaActual: Producto[];
}

export interface Persona {
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
  id: string;
  comedorSolidario: string;
  comedorSolidarioId: string;
  copiloto: Persona;
  fecha: string;
  hora: string;
  urlActaLegal: string | null;
  productosEntregados: ProductoEntregado[];
}

export interface Producto {
  cantidad: number;
  producto: string;
  productoId: string;
  urlImagen: string;
}

export interface ProductoEntregado {
  cantidad: number;
  producto: string;
  productoId: string;
  urlImagen: string;
}
