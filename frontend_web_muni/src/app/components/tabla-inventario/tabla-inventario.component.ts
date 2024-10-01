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
import { Subscription } from 'rxjs';

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
  isLoading: boolean = true;
  
  private subscriptions: Subscription = new Subscription(); // Para manejar la limpieza de eventos

  constructor(private socketService: SocketInventarioService) {}

  ngOnInit() {
    const startTime = new Date().getTime();
  
    this.socketService.getAllCategorias();
  
    this.socketService.onLoadAllCategorias().subscribe((categorias: Categoria[]) => {
      this.categorias = categorias;
      this.categorias2 = categorias;
  
      const elapsedTime = new Date().getTime() - startTime;
      const minimumTime = 3000; // Tiempo mínimo de 3 segundos
      const remainingTime = minimumTime - elapsedTime;
  
      if (remainingTime > 0) {
        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      } else {
        this.isLoading = false;
      }
  
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
    });
  }
  

  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // Limpieza de eventos suscritos
    console.log("se fue de la pagina");
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
