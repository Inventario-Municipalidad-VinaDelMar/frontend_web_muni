export interface Detalle {
    productoId: string;
    cantidadPlanificada: number;
  }
  
  export interface DiaPlanificacion {
    fecha: string;
    detalles: Detalle[];
  }
  
  export interface DiasPlanificacion {
    dias: DiaPlanificacion[];
  }
  