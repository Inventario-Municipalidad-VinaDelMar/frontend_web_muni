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
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { Tanda } from '../../models/tanda.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription } from 'rxjs';
import { Producto } from '../../models/producto.model';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';

@Component({
  selector: 'app-tabla-inventario',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './tabla-inventario.component.html',
  standalone: true,
  styleUrls: ['./tabla-inventario.component.scss'],
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
  productos: Producto[] = [];
  productos2: Producto[] = [];
  expandedRows: { [key: string]: boolean } = {};
  filterNombre: string = '';
  filterCantidadTotal: number | null = null;
  filterProductosPorVencer: number | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  private subscriptions: Subscription = new Subscription();
  contadorVencidos: number = 0;
  contadorPorVencerEtapa1: number = 0;
  contadorPorVencerEtapa2: number = 0;
  contadorSeguro: number = 0;
  

  constructor(
    private socketService: SocketInventarioService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    const startTime = new Date().getTime();
    this.socketService.onConnect().subscribe(() => console.log('Socket conectado'));
    this.socketService.onDisconnect().subscribe(() => console.log('Socket desconectado'));
  
    setTimeout(() => {
      if (this.isLoading) {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 10000);
  
    setTimeout(() => {
      this.socketService.getAllProductos();
      this.subscriptions.add(
        this.socketService.loadAllProductos().subscribe((productos: Producto[]) => {
          if ((new Date().getTime() - startTime) <= 10000) {
            this.productos = productos;
            this.productos2 = productos;
            this.isLoading = false;
            this.hasError = false;
  
            // Cargar todas las tandas para cada producto y esperar a que se complete
            let tandasCargadas = 0;
            productos.forEach(producto => {
              this.socketService.getTandasByProductoId(producto.id);
              const tandaSubscription = this.socketService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
                this.productos = this.productos.map(prod => prod.id === producto.id ? { ...prod, tandas: tandas } : prod);
                this.productos2 = [...this.productos];
                tandaSubscription.unsubscribe();
  
                // Verificar que todas las tandas se han cargado antes de actualizar alertas
                tandasCargadas++;
                if (tandasCargadas === productos.length) {
                  this.actualizarAlertas(); // Llamar a actualizar alertas una vez que todas las tandas están cargadas
                }
              });
              this.subscriptions.add(tandaSubscription);
            });
          }
        }, () => {
          this.hasError = true;
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El servicio no está disponible. Intente más tarde.' });
        })
      );
    }, 1000);
  }
  

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Calcular la cantidad total de productos
  calcularCantidadTotal(producto: Producto): number {
    return (producto.tandas || []).reduce((total, tanda) => total + tanda.cantidadActual, 0);
  }

  // Calcular la cantidad de productos próximos a vencer
  calcularCantidadPorVencer(producto: Producto): number {
    const hoy = new Date();
    return (producto.tandas || []).filter(tanda => {
      const fechaVencimiento = new Date(tanda.fechaVencimiento);
      return (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24) <= 7;
    }).length;
  }

  toggleExpansion(productId: string): void {
    this.expandedRows[productId] = !this.expandedRows[productId];
  }

  // Obtener la fecha de vencimiento más próxima
  calcularFechaProxima(producto: Producto): string {
    if (!producto.tandas || producto.tandas.length === 0) {
      return 'N/A';
    }
    const fechas = producto.tandas.map(tanda => new Date(tanda.fechaVencimiento));
    const fechaProxima = fechas.reduce((min, fecha) => fecha < min ? fecha : min);
    return fechaProxima.toISOString().split('T')[0];
  }

  // Calcular el estado de vencimiento para contabilización
  calcularEstadoVencimiento(tanda: Tanda): string {
    const hoy = new Date();
    if (!tanda.fechaVencimiento) {
      return 'sinVencimiento';
    }
    const fechaVencimiento = new Date(tanda.fechaVencimiento);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (diffDays < 0) {
      return 'vencido';
    } else if (diffDays <= 2) {
      return 'porVencerEtapa1';
    } else if (diffDays <= 7) {
      return 'porVencerEtapa2';
    } else {
      return 'seguro';
    }
  }

  // Contabilizar alertas y actualizar los contadores de estados
  actualizarAlertas() {
    // Reiniciar contadores antes de contar
    this.contadorVencidos = 0;
    this.contadorPorVencerEtapa1 = 0;
    this.contadorPorVencerEtapa2 = 0;
    this.contadorSeguro = 0;
  
    this.productos.forEach(producto => {
      producto.tandas?.forEach(tanda => {
        const estado = this.calcularEstadoVencimiento(tanda);
        
        switch (estado) {
          case 'vencido':
            this.contadorVencidos++;
            break;
          case 'porVencerEtapa1':
            this.contadorPorVencerEtapa1++;
            break;
          case 'porVencerEtapa2':
            this.contadorPorVencerEtapa2++;
            break;
          case 'seguro':
            this.contadorSeguro++;
            break;
        }
      });
    });
  
    // Imprimir contadores en consola para verificar si están correctos
    console.log(`Vencidos: ${this.contadorVencidos}, Por Vencer (1-2 días): ${this.contadorPorVencerEtapa1}, Por Vencer (3-7 días): ${this.contadorPorVencerEtapa2}, Seguros: ${this.contadorSeguro}`);
  }
  

  // Filtro para productos
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
