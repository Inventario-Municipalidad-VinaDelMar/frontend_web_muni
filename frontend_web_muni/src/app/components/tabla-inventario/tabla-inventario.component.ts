import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table'; // Importación del módulo de tabla
import { ButtonModule } from 'primeng/button'; // Importación del módulo de botón
import { TagModule } from 'primeng/tag'; // Importación del módulo de etiquetas
import { ToastModule } from 'primeng/toast'; // Importación del módulo de notificaciones
import { InventarioService } from '../../services/inventario.service'; // Importa tu servicio

// Definición de interfaces para tipos de datos
interface Tanda {
  id: string;
  cantidadIngresada: number;
  cantidadActual: number;
  fechaLlegada: string;
  fechaVencimiento: string;
  producto: string;
  bodega: string;
  ubicacion: string;
}

interface Categoria {
  id: number;
  nombre: string;
  urlImagen: string;
  tandas: Tanda[];
}

@Component({
  selector: 'app-tabla-inventario',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './tabla-inventario.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule, // Asegúrate de importar los módulos de PrimeNG aquí
    ButtonModule,
    TagModule,
    ToastModule
  ]
})
export class TablaInventarioComponent implements OnInit {
  categorias: Categoria[] = [];
  expandedRows = {};

  constructor(private inventarioService: InventarioService) {}

  ngOnInit() {
    this.inventarioService.getCategorias().subscribe(data => {
      // Ordenar las tandas por fecha de vencimiento
      data.forEach((categoria: Categoria) => {
        categoria.tandas.sort((a: Tanda, b: Tanda) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
      });
  
      // Ordenar las categorías por nombre alfabéticamente
      this.categorias = data.sort((a: Categoria, b: Categoria) => a.nombre.localeCompare(b.nombre));
    });
  }

  expandAll() {
    this.expandedRows = this.categorias.reduce((acc, categoria) => {
      acc[categoria.id] = true;
      return acc;
    }, {} as { [key: number]: boolean });
  }

  collapseAll() {
    this.expandedRows = {};
  }

  onNewTandaCreated(tanda: Tanda) {
    this.inventarioService.addTandaToCategoria(tanda);
  }

  onNewTandaUpdate(tanda: Tanda) {
    this.inventarioService.updateTanda(tanda);
  }

  calcularCantidadTotal(categoria: Categoria): number {
    return categoria.tandas.reduce((total: number, tanda: Tanda) => total + tanda.cantidadActual, 0);
  }
  calcularFechaProxima(categoria: Categoria): string {
    if (categoria.tandas.length === 0) {
      return 'N/A'; // Devuelve "N/A" si no hay tandas en la categoría
    }
    
    const fechas = categoria.tandas.map(tanda => new Date(tanda.fechaVencimiento));
    const fechaProxima = fechas.reduce((min, fecha) => fecha < min ? fecha : min);
    
    return fechaProxima.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }
  calcularCantidadPorVencer(categoria: Categoria): number {
    const dosSemanas = 14; // Número de días para 2 semanas
    const hoy = new Date();
    return categoria.tandas.filter(tanda => {
      const fechaVencimiento = new Date(tanda.fechaVencimiento);
      const diffDias = (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
      return diffDias <= dosSemanas;
    }).length;
  }
  
}
