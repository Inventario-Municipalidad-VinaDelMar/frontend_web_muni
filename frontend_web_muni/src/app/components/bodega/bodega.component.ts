import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bodega',
  standalone: true,
  imports: [CommonModule, CardModule, CarouselModule, PanelModule, ScrollPanelModule,DialogModule,FormsModule ],
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


  bodegaNueva: any = { nombre: '', direccion: '', nombreEncargado: '' };
  bodegaEditable: any = {};

  // Control de visibilidad de dialogs
  mostrarDialogoCrearBodega: boolean = false;
  mostrarDialogoEditarBodega: boolean = false;
  mostrarDialogoEliminarBodega: boolean = false;

  // Variables para controlar visibilidad de dialogs de ubicación
  mostrarDialogoCrearUbicacion: boolean = false;
  mostrarDialogoEditarUbicacion: boolean = false;
  mostrarDialogoEliminarUbicacion: boolean = false;

  // Variables para las ubicaciones
  nuevaUbicacion: string = '';
  ubicacionEditable: string = '';
  ubicacionSeleccionadaParaEliminar: string | null = null;

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

  filtrarTandasPorUbicacion(productoId: string) {
    return this.tandasPorProducto[productoId]?.filter(
      (tanda) =>
        tanda.bodega === this.bodegaSeleccionada?.nombre &&
        tanda.ubicacion === this.ubicacionSeleccionada
    );
  }
  

  
  seleccionarUbicacion(ubicacion: string) {
    this.ubicacionSeleccionada = ubicacion;
    this.productosEnUbicacion = this.productos.filter((producto) =>
      this.filtrarTandasPorBodega(producto.id)?.some(
        (tanda) => tanda.ubicacion === ubicacion
      )
    );
    console.log('Productos en ubicación seleccionada:', this.productosEnUbicacion);
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

  // Función para crear una nueva bodega
  crearBodega() {
    const nuevaBodega = {
      ...this.bodegaNueva,
      id: this.generarId(),
      isDeleted: false
    };
    this.bodegas.push(nuevaBodega);
    console.log('Bodega creada:', nuevaBodega);
    this.mostrarDialogoCrearBodega = false;
    this.bodegaNueva = { nombre: '', direccion: '', nombreEncargado: '' };
  }

  // Abrir dialogo de edición con datos de la bodega seleccionada
  abrirDialogoEditarBodega(bodega: any) {
    this.bodegaEditable = { ...bodega };
    this.mostrarDialogoEditarBodega = true;
  }

  // Guardar cambios de la bodega editada
  guardarCambiosBodega() {
    const index = this.bodegas.findIndex(b => b.id === this.bodegaEditable.id);
    if (index !== -1) {
      this.bodegas[index] = { ...this.bodegaEditable };
      console.log('Bodega actualizada:', this.bodegas[index]);
    }
    this.mostrarDialogoEditarBodega = false;
  }

  // Abrir dialogo de confirmación para eliminar
  abrirDialogoEliminarBodega(bodega: any) {
    this.bodegaSeleccionada = bodega;
    this.mostrarDialogoEliminarBodega = true;
  }

  // Eliminar bodega seleccionada
  eliminarBodega() {
    const index = this.bodegas.findIndex(b => b.id === this.bodegaSeleccionada.id);
    if (index !== -1) {
      this.bodegas[index].isDeleted = true;
      console.log('Bodega eliminada (marcada como isDeleted):', this.bodegas[index]);
    }
    this.mostrarDialogoEliminarBodega = false;
  }

  // Generar un ID único para nuevas bodegas
  generarId() {
    return Math.random().toString(36).substr(2, 9);
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

  // Convertir ubicacionesUnicas (Set) a array para usar en la plantilla
  getUbicacionesArray() {
    return Array.from(this.ubicacionesUnicas);
  }

  // Crear nueva ubicación
  crearUbicacion() {
    if (this.nuevaUbicacion && !this.ubicacionesUnicas.has(this.nuevaUbicacion)) {
      this.ubicacionesUnicas.add(this.nuevaUbicacion);
      console.log('Ubicación creada:', this.nuevaUbicacion);
    }
    this.mostrarDialogoCrearUbicacion = false;
    this.nuevaUbicacion = '';
  }

  // Abrir dialog para editar ubicación
  abrirDialogoEditarUbicacion(ubicacion: string) {
    this.ubicacionEditable = ubicacion;
    this.mostrarDialogoEditarUbicacion = true;
  }

  // Guardar cambios de la ubicación editada
  guardarCambiosUbicacion() {
    if (this.ubicacionesUnicas.has(this.ubicacionEditable)) {
      this.ubicacionesUnicas.delete(this.ubicacionEditable);
      this.ubicacionesUnicas.add(this.ubicacionEditable);
      console.log('Ubicación actualizada:', this.ubicacionEditable);
    }
    this.mostrarDialogoEditarUbicacion = false;
    this.ubicacionEditable = '';
  }

  // Abrir dialog para confirmar eliminación de ubicación
  abrirDialogoEliminarUbicacion(ubicacion: string) {
    this.ubicacionSeleccionadaParaEliminar = ubicacion;
    this.mostrarDialogoEliminarUbicacion = true;
  }

  // Eliminar ubicación
  eliminarUbicacion() {
    if (this.ubicacionesUnicas.has(this.ubicacionSeleccionadaParaEliminar!)) {
      this.ubicacionesUnicas.delete(this.ubicacionSeleccionadaParaEliminar!);
      console.log('Ubicación eliminada:', this.ubicacionSeleccionadaParaEliminar);
    }
    this.mostrarDialogoEliminarUbicacion = false;
    this.ubicacionSeleccionadaParaEliminar = null;
  }
}
