import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table'; // Importación del módulo de tabla
import { ButtonModule } from 'primeng/button'; // Importación del módulo de botón
import { TagModule } from 'primeng/tag'; // Importación del módulo de etiquetas
import { ToastModule } from 'primeng/toast'; // Importación del módulo de notificaciones
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { SocketInventarioService } from '../../services/socket-inventario.service';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';
import { Tanda } from '../../models/tanda.model';

// Definición de interfaces para tipos de datos



@Component({
  selector: 'app-tabla-inventario',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './tabla-inventario.component.html',
  standalone: true,
  providers: [SocketInventarioService, MessageService], // Agregar MessageService
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
  ]
})

export class TablaInventarioComponent implements OnInit {
  categorias: Categoria[] = [];
  categorias2: Categoria[] = [];
  expandedRows = {};
  filterCategory: string = '';
  filterCantidadTotal: number | null = null;
  filterProductosPorVencer: number | null = null;

  constructor(private socketService: SocketInventarioService) {}

  ngOnInit() {
    this.socketService.onConnect().subscribe(() => {
      console.log('Conexión: Conectado al servidor WebSocket');
    });
  
    this.socketService.onDisconnect().subscribe(() => {
      console.log('Desconexión: Desconectado del servidor WebSocket');
    });
  
    // Obtener todas las categorías
    this.socketService.getAllCategorias();
  
    this.socketService.onLoadAllCategorias().subscribe((categorias: Categoria[]) => {
      console.log('Categorías recibidas:', categorias);
      this.categorias = categorias;
      this.categorias2 = categorias; // Inicializar también el filtro
  
      // Obtener tandas para cada categoría
      this.categorias.forEach(categoria => {
        console.log(categoria.id);
  
        // Solicitar tandas por categoría
        this.socketService.getTandasByCategoriaId(categoria.id);
  
        // Escuchar tandas por categoría
        this.socketService.onLoadTandasByCategoriaId(categoria.id).subscribe((tandas: Tanda[]) => {
          console.log(`Tandas recibidas para la categoría ${categoria.id}:`, tandas);
  
          // Actualizar las tandas de la categoría actual
          this.categorias = this.categorias.map(cat => {
            if (cat.id === categoria.id) {
              return {
                ...cat,
                tandas: tandas // Asignar las tandas a la categoría correcta
              };
            }
            return cat;
          });
  
          // Refrescar la lista filtrada
          this.categorias2 = [...this.categorias];
        });
      });
    });
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

    return fechaProxima.toISOString().split('T')[0]; // Formato YYYY-MM-DD
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