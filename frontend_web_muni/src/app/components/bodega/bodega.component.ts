import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@Component({
  selector: 'app-bodega',
  standalone: true,
  imports: [CommonModule, CardModule, CarouselModule, PanelModule, ScrollPanelModule],
  templateUrl: './bodega.component.html',
  styleUrls: ['./bodega.component.scss']
})
export class BodegaComponent implements OnInit {
  bodegas: any[] = [];
  productos: any[] = [];
  tandasPorProducto: { [productoId: string]: any[] } = {};
  bodegaSeleccionada: any = null;
  ubicacionesUnicas: Set<string> = new Set();
  productosEnUbicacion: any[] = [];
  ubicacionSeleccionada: string | null = null;
  hayProductosEnBodegaSeleccionada: boolean = true;
  mostrarMensajeSinProductos: boolean = false; // Nueva variable para el retraso en mostrar el mensaje

  constructor(private bodegaService: SocketInventarioService) {}

  ngOnInit() {
    this.bodegas = [
      {
        nombre: 'Bodega B',
        direccion: 'La Florida',
        nombreEncargado: 'Maria López',
        id: 'b1a276f1-21f3-42d3-91a7-48b23a4b67c1',
        isDeleted: false
      }
    ];
    this.actualizarEstadoProductosEnBodega();
    // Cargar las bodegas al inicializar el componente
    this.bodegaService.getAllBodegas();
    this.bodegaService.loadAllBodegas().subscribe((data: any) => {
      this.bodegas = [...this.bodegas, ...data];
      this.bodegas.sort((a, b) => a.nombre.localeCompare(b.nombre));
  
      if (this.bodegas.length > 0) {
        this.bodegaSeleccionada = this.bodegas[0];
        this.actualizarUbicacionesUnicas();
        this.actualizarEstadoProductosEnBodega();
      }
    });

    // Cargar todos los productos y sus tandas
    this.bodegaService.getAllProductos();
    this.bodegaService.loadAllProductos().subscribe((data: any) => {
      this.productos = data;

      this.productos.forEach((producto) => {
        this.obtenerTandasPorProducto(producto.id);
      });
      this.actualizarEstadoProductosEnBodega();
    });
  }

  seleccionarBodega(index: number) {
    this.bodegaSeleccionada = this.bodegas[index];
    this.actualizarUbicacionesUnicas();
    this.productosEnUbicacion = [];
    this.ubicacionSeleccionada = null;
    this.actualizarEstadoProductosEnBodega();
  }

  obtenerTandasPorProducto(productoId: string) {
    this.bodegaService.getTandasByProductoId(productoId);
    this.bodegaService.onLoadTandasByProductoId(productoId).subscribe((tandas) => {
      this.tandasPorProducto[productoId] = tandas;
      this.actualizarUbicacionesUnicas();
      this.actualizarEstadoProductosEnBodega();
    });
  }

  filtrarTandasPorBodega(productoId: string) {
    return this.tandasPorProducto[productoId]?.filter(
      (tanda) => tanda.bodega === this.bodegaSeleccionada?.nombre
    );
  }

  actualizarUbicacionesUnicas() {
    this.ubicacionesUnicas.clear();
    for (const productoId in this.tandasPorProducto) {
      const tandas = this.filtrarTandasPorBodega(productoId);
      tandas?.forEach((tanda) => {
        if (tanda.bodega === this.bodegaSeleccionada?.nombre) {
          this.ubicacionesUnicas.add(tanda.ubicacion);
        }
      });
    }
  }
  
  seleccionarUbicacion(ubicacion: string) {
    this.ubicacionSeleccionada = ubicacion;
    this.productosEnUbicacion = this.productos.filter((producto) =>
      this.filtrarTandasPorBodega(producto.id)?.some(
        (tanda) => tanda.ubicacion === ubicacion
      )
    );
  }

  actualizarEstadoProductosEnBodega() {
    this.hayProductosEnBodegaSeleccionada = this.productos.some(
      producto => this.filtrarTandasPorBodega(producto.id)?.length > 0
    );
    
    if (!this.hayProductosEnBodegaSeleccionada) {
      this.mostrarMensajeSinProductos = false; // Ocultar el mensaje inicialmente
      setTimeout(() => {
        this.mostrarMensajeSinProductos = true; // Mostrar después de 1 segundo
      }, 1000);
    } else {
      this.mostrarMensajeSinProductos = false; // Ocultar el mensaje si hay productos
    }
  }
}
