export interface DetalleEnvio {
  id: string;
  fecha: string;
  horaInicioEnvio: string; // Cambia esto de `horaInicio` a `horaInicioEnvio`
  horaFinalizacion: string | null;
  status: string;
  administrador: Persona;
  solicitante: Persona;
  movimientos: Movimiento[];
  entregas: Entrega[];
  cargaInicial: Producto[];
  cargaActual: Producto[];
  incidente: Incidente[];
}
export interface Delivery {
  date: string;
  products: { name: string; quantity: number }[];
  comedor: string;
}


export interface Incidente {
  id: string;
  descripcion: string;
  fecha: string;
  // Otros campos de incidente
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
