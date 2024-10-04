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
import { Categoria } from '../../models/categoria.model';
import { Tanda } from '../../models/tanda.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription, timer } from 'rxjs';

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
  categorias: Categoria[] = [];
  categorias2: Categoria[] = [];
  expandedRows: { [key: string]: boolean } = {};
  filterCategory: string = '';
  filterCantidadTotal: number | null = null;
  filterProductosPorVencer: number | null = null;
  isLoading: boolean = true; // Estado para mostrar la carga
  hasError: boolean = false;  // Estado para indicar si hay un error

  private subscriptions: Subscription = new Subscription();

  constructor(private socketService: SocketInventarioService, private messageService: MessageService) {}

  ngOnInit() {
    const startTime = new Date().getTime();

    // Lógica para mostrar error si no hay respuesta después de 10 segundos
    setTimeout(() => {
      if (this.isLoading) {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 10000); // Tiempo límite de 10 segundos

    // Tiempo mínimo de 2 segundos de carga antes de mostrar los productos
    setTimeout(() => {
      this.socketService.getAllCategorias();
      this.socketService.onLoadAllCategorias().subscribe((categorias: Categoria[]) => {
        const elapsedTime = new Date().getTime() - startTime;

        // Si los datos llegan dentro del límite de tiempo
        if (elapsedTime <= 10000) {
          this.categorias = categorias;
          this.categorias2 = categorias;
          this.isLoading = false;
          this.hasError = false;

          categorias.forEach(categoria => {
            this.socketService.getTandasByCategoriaId(categoria.id);
            this.socketService.onLoadTandasByCategoriaId(categoria.id).subscribe((tandas: Tanda[]) => {
              this.categorias = this.categorias.map(cat => {
                if (cat.id === categoria.id) {
                  return { ...cat, tandas: tandas };
                }
                return cat;
              });

              this.categorias2 = [...this.categorias];
            });
          });
        }
      }, () => {
        // Manejo de error de la llamada al servicio
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
    this.expandedRows = this.categorias.reduce((acc, categoria) => {
      acc[categoria.id] = true;
      return acc;
    }, {} as { [key: string]: boolean });
  }

  collapseAll() {
    this.expandedRows = {};
  }

  calcularCantidadTotal(categoria: Categoria): number {
    return (categoria.tandas || []).reduce((total: number, tanda: Tanda) => total + tanda.cantidadActual, 0);
  }

  calcularFechaProxima(categoria: Categoria): string {
    if (!categoria.tandas || categoria.tandas.length === 0) {
      return 'N/A';
    }

    const fechas = categoria.tandas.map(tanda => new Date(tanda.fechaVencimiento));
    const fechaProxima = fechas.reduce((min, fecha) => fecha < min ? fecha : min);

    return fechaProxima.toISOString().split('T')[0];
  }

  calcularCantidadPorVencer(categoria: Categoria): number {
    const dosSemanas = 14;
    const hoy = new Date();
    return (categoria.tandas || []).filter(tanda => {
      const fechaVencimiento = new Date(tanda.fechaVencimiento);
      const diffDias = (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
      return diffDias <= dosSemanas;
    }).length;
  }

  onFilter() {
    this.categorias2 = this.categorias.filter(categoria => {
      const cantidadTotal = this.calcularCantidadTotal(categoria);
      const productosPorVencer = this.calcularCantidadPorVencer(categoria);

      return (this.filterCategory ? categoria.nombre.toLowerCase().includes(this.filterCategory.toLowerCase()) : true) &&
             (this.filterCantidadTotal !== null ? cantidadTotal === this.filterCantidadTotal : true) &&
             (this.filterProductosPorVencer !== null ? productosPorVencer === this.filterProductosPorVencer : true);
    });
  }
}
