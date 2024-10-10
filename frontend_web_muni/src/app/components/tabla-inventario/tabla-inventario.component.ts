import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { SocketInventarioService } from '../../services/socket-inventario.service';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { Tanda } from '../../models/tanda.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription, timer } from 'rxjs';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-tabla-inventario',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './tabla-inventario.component.html',
  standalone: true,
  providers: [SocketInventarioService, MessageService],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    SliderModule,
    FormsModule,
    ProgressSpinnerModule,
  ]
})
export class TablaInventarioComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];  // Cambiado de categorias a productos
  productos2: Producto[] = [];
  expandedRows: { [key: string]: boolean } = {};
  filterNombre: string = '';
  filterCantidadTotal: number | null = null;
  filterProductosPorVencer: number | null = null;
  isLoading: boolean = true; // Estado para mostrar la carga
  hasError: boolean = false;  // Estado para indicar si hay un error

  private subscriptions: Subscription = new Subscription();

  constructor(private socketService: SocketInventarioService, private messageService: MessageService) {}

  ngOnInit() {
    const startTime = new Date().getTime();

  this.socketService.onConnect().subscribe(() => {
    console.log('Socket conectado');
  });

  this.socketService.onDisconnect().subscribe(() => {
    console.log('Socket desconectado');
  });


    // Lógica para mostrar error si no hay respuesta después de 10 segundos
    setTimeout(() => {
      if (this.isLoading) {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 10000); // Tiempo límite de 10 segundos

    // Tiempo mínimo de 2 segundos de carga antes de mostrar los productos
    setTimeout(() => {
      this.socketService.getAllProductos();
      this.socketService.loadAllProductos().subscribe((productos: Producto[]) => {
        const elapsedTime = new Date().getTime() - startTime;

        // Si los datos llegan dentro del límite de tiempo
        if (elapsedTime <= 10000) {
          console.log('Productos recibidos:', productos);
          this.productos = productos;
          this.productos2 = productos;
          this.isLoading = false;
          this.hasError = false;

          productos.forEach(producto => {
            // Emitir la solicitud para obtener tandas por productoId
            this.socketService.getTandasByProductoId(producto.id);
         
            // Escuchar la respuesta con las tandas para ese producto
            this.socketService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
              console.log('Tandas recibidas para producto:', producto.id, tandas);
         
              // Actualizar el producto con las tandas recibidas
              this.productos = this.productos.map(prod => {
                if (prod.id === producto.id) {
                  return { ...prod, tandas: tandas };
                }
                return prod;
              });
         
              // Actualizar la segunda lista (productos2) para reflejar los cambios
              this.productos2 = [...this.productos];
            });
          });
        }
      }, (error) => {
        // Manejo de error de la llamada al servicio
        console.log('Error al cargar productos:', error);
        this.hasError = true;
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El servicio no está disponible. Intente más tarde.' });
      });
    }, 2000); // Tiempo mínimo de carga inicial (2 segundos)
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  expandAll() {
    this.expandedRows = this.productos.reduce((acc, producto) => {
      acc[producto.id] = true;
      return acc;
    }, {} as { [key: string]: boolean });
  }

  collapseAll() {
    this.expandedRows = {};
  }

  calcularCantidadTotal(producto: Producto): number {
    return (producto.tandas || []).reduce((total: number, tanda: Tanda) => total + tanda.cantidadActual, 0);
  }

  calcularFechaProxima(producto: Producto): string {
    if (!producto.tandas || producto.tandas.length === 0) {
      return 'N/A';
    }

    const fechas = producto.tandas.map(tanda => new Date(tanda.fechaVencimiento));
    const fechaProxima = fechas.reduce((min, fecha) => fecha < min ? fecha : min);

    return fechaProxima.toISOString().split('T')[0];
  }

  calcularCantidadPorVencer(producto: Producto): number {
    const dosSemanas = 14;
    const hoy = new Date();
    return (producto.tandas || []).filter(tanda => {
      const fechaVencimiento = new Date(tanda.fechaVencimiento);
      const diffDias = (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
      return diffDias <= dosSemanas;
    }).length;
  }

  onFilter() {
    this.productos2 = this.productos.filter(producto => {
      const cantidadTotal = this.calcularCantidadTotal(producto);
      const productosPorVencer = this.calcularCantidadPorVencer(producto);

      return (this.filterNombre ? producto.nombre.toLowerCase().includes(this.filterNombre.toLowerCase()) : true) &&
             (this.filterCantidadTotal !== null ? cantidadTotal === this.filterCantidadTotal : true) &&
             (this.filterProductosPorVencer !== null ? productosPorVencer === this.filterProductosPorVencer : true);
    });
  }
}
