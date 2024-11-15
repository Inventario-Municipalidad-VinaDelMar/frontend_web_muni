import { Tanda } from "./tanda.model";

export interface Producto {
    isDeleted: any;
    id: string;
    nombre: string;
    barcode: null;
    descripcion: string;
    urlImagen: string;
    stock?:number;
    tandas?: Tanda[];
    cantidadPlanificada?:number;
}
