import { Tanda } from "./tanda.model";

export interface Producto {
    id: string;
    nombre: string;
    barcode: null;
    descripcion: string;
    urlImagen: string;
    stock?:number;
    tandas?: Tanda[];
}
