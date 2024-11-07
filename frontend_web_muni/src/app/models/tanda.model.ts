export interface Tanda {
    id: string;
    productoId:string;
    cantidadIngresada: number;
    cantidadActual: number;
    fechaLlegada: string;
    fechaVencimiento: string;
    producto: string;
    bodega: string;
    ubicacion: string;
    esMerma:boolean;
  }