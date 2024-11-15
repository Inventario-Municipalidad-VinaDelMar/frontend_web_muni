export interface DetalleEnvio {
  id: string;
  fecha: string;
  horaCreacion: string;
  horaInicioEnvio: string | null;
  horaFinalizacion: string | null;
  ultimaActualizacion: string;
  status: string;
  autorizante: string;
  solicitante: string;
  movimientos: Movimiento[];
  entregas: Entrega[];
  cargaInicial: Producto[];
  cargaActual: Producto[];
  incidentes: Incidente[];
  administrador?: Persona; // Agregando administrador como opcional
}

export interface Persona {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}


export interface Movimiento {
  id: string;
  cantidadRetirada: number;
  producto: string;
  productoId: string;
  fecha: string;
  hora: string;
  user: string;
}

export interface Entrega {
  id: string;
  fecha: string;
  hora: string;
  url_acta_legal: string | null;
  comedorSolidario: string;
  comedorDireccion: string;
  realizador: string;
  realizadorId: string;
  productosEntregados: number; // Cantidad de productos entregados en esta entrega
}

export interface Producto {
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
  evidenciaFotograficaUrl?: string;
  productosAfectados?: ProductoAfectado[];
}

export interface ProductoAfectado {
  cantidad: number;
  producto: string;
  productoId: string;
  urlImagen?: string;
}

export interface Entrega {
  id: string;
  fecha: string;
  hora: string;
  url_acta_legal: string | null;
  comedorSolidario: string;
  comedorDireccion: string;
  realizador: string;
  realizadorId: string;
  productosEntregados: number; // Ajuste para interpretar como cantidad total en lugar de lista
}


export interface ProductoEntregado {
  cantidad: number;
  producto: string;
  productoId: string;
  urlImagen?: string;
}
