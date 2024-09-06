import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private categorias = [
    {
      id: 1,
      nombre: 'Fideos',
      urlImagen: 'https://ejemplo.com/imagenes/fideos.jpg',
      tandas: [
        {
          id: 'ea12b9ed-fa83-433d-a150-e85b0e79cb56',
          cantidadIngresada: 500,
          cantidadActual: 500,
          fechaLlegada: '2024-08-29',
          fechaVencimiento: '2027-03-10',
          producto: 'Arroz Largo Fino',
          bodega: 'Bodega A',
          ubicacion: 'Rack Rojo, Piso 3'
        },
        {
          id: 'd1c5e5a4-547c-40bb-83fc-25c1d8aefdb7',
          cantidadIngresada: 300,
          cantidadActual: 300,
          fechaLlegada: '2024-07-15',
          fechaVencimiento: '2025-12-31',
          producto: 'Spaghetti',
          bodega: 'Bodega B',
          ubicacion: 'Rack Azul, Piso 2'
        }
      ]
    },
    {
      id: 2,
      nombre: 'Lácteos',
      urlImagen: 'https://ejemplo.com/imagenes/lacteos.jpg',
      tandas: [
        {
          id: 'b21f8b8e-45e3-4e9f-a9c4-f2d567bdef3a',
          cantidadIngresada: 1000,
          cantidadActual: 950,
          fechaLlegada: '2024-09-01',
          fechaVencimiento: '2025-02-15',
          producto: 'Leche Entera',
          bodega: 'Bodega A',
          ubicacion: 'Rack Verde, Piso 1'
        },
        {
          id: 'c1e8df30-55fc-4e5d-a1a5-7c291b04d91b',
          cantidadIngresada: 200,
          cantidadActual: 180,
          fechaLlegada: '2024-06-20',
          fechaVencimiento: '2024-12-20',
          producto: 'Yogur Natural',
          bodega: 'Bodega C',
          ubicacion: 'Rack Naranja, Piso 2'
        }
      ]
    },
    {
      id: 3,
      nombre: 'Carnes',
      urlImagen: 'https://ejemplo.com/imagenes/carnes.jpg',
      tandas: [
        {
          id: '3c1d2e4f-7a65-44e8-a0f5-5c7f5f9c9a6b',
          cantidadIngresada: 400,
          cantidadActual: 350,
          fechaLlegada: '2024-08-10',
          fechaVencimiento: '2024-10-10',
          producto: 'Pollo Entero',
          bodega: 'Bodega D',
          ubicacion: 'Rack Rojo, Piso 1'
        },
        {
          id: '8d3f6c9e-2c3d-4cfd-a6c8-5dcbf0e3f0a2',
          cantidadIngresada: 250,
          cantidadActual: 230,
          fechaLlegada: '2024-09-05',
          fechaVencimiento: '2024-11-05',
          producto: 'Carne de Res',
          bodega: 'Bodega E',
          ubicacion: 'Rack Azul, Piso 2'
        }
      ]
    },
    {
      id: 4,
      nombre: 'Bebidas',
      urlImagen: 'https://ejemplo.com/imagenes/bebidas.jpg',
      tandas: [
        {
          id: '4e3f7d6a-9f2c-4e8d-a9b7-6d8f0e3c9f6b',
          cantidadIngresada: 600,
          cantidadActual: 580,
          fechaLlegada: '2024-07-30',
          fechaVencimiento: '2025-01-30',
          producto: 'Agua Mineral',
          bodega: 'Bodega F',
          ubicacion: 'Rack Verde, Piso 1'
        },
        {
          id: '2f9e7a4d-8a6e-4e6b-b5b6-7f9e3c5a6b7a',
          cantidadIngresada: 300,
          cantidadActual: 280,
          fechaLlegada: '2024-08-15',
          fechaVencimiento: '2024-12-15',
          producto: 'Jugo de Naranja',
          bodega: 'Bodega G',
          ubicacion: 'Rack Naranja, Piso 2'
        }
      ]
    },
    {
      id: 5,
      nombre: 'Panadería',
      urlImagen: 'https://ejemplo.com/imagenes/panaderia.jpg',
      tandas: [
        {
          id: '9e4f8d6a-1a2b-4c3d-a9e8-7d8e9f5c0e7b',
          cantidadIngresada: 500,
          cantidadActual: 450,
          fechaLlegada: '2024-09-10',
          fechaVencimiento: '2024-09-20',
          producto: 'Pan Baguette',
          bodega: 'Bodega H',
          ubicacion: 'Rack Rojo, Piso 1'
        },
        {
          id: '7f8e9c6d-5a6b-4e7d-a9f7-6f8e9d5b0c8e',
          cantidadIngresada: 400,
          cantidadActual: 350,
          fechaLlegada: '2024-09-12',
          fechaVencimiento: '2024-09-22',
          producto: 'Croissant',
          bodega: 'Bodega I',
          ubicacion: 'Rack Azul, Piso 2'
        }
      ]
    },
    {
      id: 6,
      nombre: 'Frutas',
      urlImagen: 'https://ejemplo.com/imagenes/frutas.jpg',
      tandas: [
        {
          id: '6f9e7c5d-8b4c-4e2d-b6f7-9e8d4c6a2b7e',
          cantidadIngresada: 800,
          cantidadActual: 750,
          fechaLlegada: '2024-09-05',
          fechaVencimiento: '2024-09-15',
          producto: 'Manzanas',
          bodega: 'Bodega J',
          ubicacion: 'Rack Verde, Piso 1'
        },
        {
          id: '4b7d8e9a-2c4d-4e6f-b5a6-9e8f5c7a1b2c',
          cantidadIngresada: 500,
          cantidadActual: 480,
          fechaLlegada: '2024-09-07',
          fechaVencimiento: '2024-09-17',
          producto: 'Plátanos',
          bodega: 'Bodega K',
          ubicacion: 'Rack Naranja, Piso 2'
        }
      ]
    },
    {
      id: 7,
      nombre: 'Verduras',
      urlImagen: 'https://ejemplo.com/imagenes/verduras.jpg',
      tandas: [
        {
          id: '5d8e9c6b-7f4e-4a2d-b9e6-8f7d5c3a4e7b',
          cantidadIngresada: 1000,
          cantidadActual: 950,
          fechaLlegada: '2024-08-25',
          fechaVencimiento: '2024-09-05',
          producto: 'Zanahorias',
          bodega: 'Bodega L',
          ubicacion: 'Rack Rojo, Piso 1'
        },
        {
          id: '2b6d7e9c-5f4b-4e8d-a9e7-6d8c9f5a1b2c',
          cantidadIngresada: 700,
          cantidadActual: 680,
          fechaLlegada: '2024-08-27',
          fechaVencimiento: '2024-09-07',
          producto: 'Lechuga',
          bodega: 'Bodega M',
          ubicacion: 'Rack Azul, Piso 2'
        }
      ]
    },
    {
      id: 8,
      nombre: 'Cereales',
      urlImagen: 'https://ejemplo.com/imagenes/cereales.jpg',
      tandas: [
        {
          id: '7c5d8e9b-4f3e-4a2b-b7e6-9f8d4c6a1b2c',
          cantidadIngresada: 1200,
          cantidadActual: 1150,
          fechaLlegada: '2024-08-15',
          fechaVencimiento: '2025-01-15',
          producto: 'Avena',
          bodega: 'Bodega N',
          ubicacion: 'Rack Verde, Piso 1'
        },
        {
          id: '3b6f7d8e-9c4a-4e2d-a9e5-7c8d5b3a1f2e',
          cantidadIngresada: 800,
          cantidadActual: 750,
          fechaLlegada: '2024-08-18',
          fechaVencimiento: '2025-01-18',
          producto: 'Cereal Integral',
          bodega: 'Bodega O',
          ubicacion: 'Rack Naranja, Piso 2'
        }
      ]
    },
    {
      id: 9,
      nombre: 'Snacks',
      urlImagen: 'https://ejemplo.com/imagenes/snacks.jpg',
      tandas: [
        {
          id: '9f8e7d6b-5c4a-4e2b-a9f6-7e8d5c3a2b7e',
          cantidadIngresada: 600,
          cantidadActual: 580,
          fechaLlegada: '2024-08-20',
          fechaVencimiento: '2025-02-20',
          producto: 'Papas Fritas',
          bodega: 'Bodega P',
          ubicacion: 'Rack Rojo, Piso 1'
        },
        {
          id: '8c6d5e7b-4f3e-4a9b-a7c5-9f8d4b3a2e6c',
          cantidadIngresada: 400,
          cantidadActual: 380,
          fechaLlegada: '2024-08-22',
          fechaVencimiento: '2025-02-22',
          producto: 'Chocolates',
          bodega: 'Bodega Q',
          ubicacion: 'Rack Azul, Piso 2'
        }
      ]
    },
    {
      id: 10,
      nombre: 'Enlatados',
      urlImagen: 'https://ejemplo.com/imagenes/enlatados.jpg',
      tandas: [
        {
          id: '6d7f8e9b-4c3e-4a1b-a7e8-9f8d6c2b1e2f',
          cantidadIngresada: 900,
          cantidadActual: 880,
          fechaLlegada: '2024-07-25',
          fechaVencimiento: '2025-07-25',
          producto: 'Atún en Lata',
          bodega: 'Bodega R',
          ubicacion: 'Rack Verde, Piso 1'
        },
        {
          id: '3f8d7e9b-4c5a-4e2b-a7e9-6f8d5c2b1e3f',
          cantidadIngresada: 700,
          cantidadActual: 680,
          fechaLlegada: '2024-07-28',
          fechaVencimiento: '2025-07-28',
          producto: 'Frijoles en Lata',
          bodega: 'Bodega S',
          ubicacion: 'Rack Naranja, Piso 2'
        }
      ]
    }
  ];


  private categoriasSubject = new BehaviorSubject<any[]>(this.categorias);

  constructor() { }

  getCategorias(): Observable<any[]> {
    return this.categoriasSubject.asObservable();
  }

  addTandaToCategoria(tanda: any): Observable<void> {
    const categoria = this.categorias.find(c => c.id === tanda.categoria);
    if (categoria) {
      categoria.tandas.push(tanda);
      this.categoriasSubject.next(this.categorias);
    }
    return of();  // Retorna un Observable vacío
  }

  updateTanda(tanda: any): Observable<void> {
    const categoria = this.categorias.find(c => c.id === tanda.categoria);
    if (categoria) {
      const tandaToUpdate = categoria.tandas.find(t => t.id === tanda.id);
      if (tandaToUpdate) {
        Object.assign(tandaToUpdate, tanda);
        this.categoriasSubject.next(this.categorias);
      }
    }
    return of();  // Retorna un Observable vacío
  }
}