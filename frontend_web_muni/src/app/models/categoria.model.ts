import { Tanda } from "./tanda.model";

export interface Categoria {
    id: string;
    nombre: string;
    urlImagen: string;
    tandas: Tanda[];
    cantidadTotal?: number; // Propiedad opcional
    productosPorVencer?: number; // Propiedad opcional
    stock?:number;
  }
