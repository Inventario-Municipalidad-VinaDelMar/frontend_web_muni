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
import { Subscription, timer } from 'rxjs';
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

            productos.forEach(producto => {
              this.socketService.getTandasByProductoId(producto.id);
              const tandaSubscription = this.socketService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
                this.productos = this.productos.map(prod => prod.id === producto.id ? { ...prod, tandas: tandas } : prod);
                this.productos2 = [...this.productos];
                tandaSubscription.unsubscribe();
              });
              this.subscriptions.add(tandaSubscription);
            });

            this.actualizarAlertas();
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

  calcularCantidadTotal(producto: Producto): number {
    return (producto.tandas || []).reduce((total, tanda) => total + tanda.cantidadActual, 0);
  }

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

  calcularFechaProxima(producto: Producto): string {
    if (!producto.tandas || producto.tandas.length === 0) {
      return 'N/A'; // Si no hay tandas, retornamos "N/A"
    }
  
    const fechas = producto.tandas.map(tanda => new Date(tanda.fechaVencimiento));
    const fechaProxima = fechas.reduce((min, fecha) => fecha < min ? fecha : min);
  
    return fechaProxima.toISOString().split('T')[0]; // Convertimos a formato de fecha legible
  }
  

  calcularEstadoVencimiento(tanda: Tanda): string {
    const hoy = new Date();
    
    // Verifica si la fecha de vencimiento no está definida
    if (!tanda.fechaVencimiento) {
        return 'sinVencimiento'; // Devuelve un estado específico para productos sin vencimiento
    }
    
    const fechaVencimiento = new Date(tanda.fechaVencimiento);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)); // Convertimos a días

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


  mostrarAlertaVencimiento(tanda: Tanda) {
    const estado = this.calcularEstadoVencimiento(tanda);
    if (estado === 'vencido') {
      this.messageService.add({ severity: 'error', summary: 'Producto Vencido', detail: `Un producto ha vencido.` });
    } else if (estado === 'porVencer') {
      this.messageService.add({ severity: 'warn', summary: 'Producto por Vencer', detail: `Un producto vence en menos de un mes.` });
    }
  }
  

  actualizarAlertas() {
    this.productos.forEach(producto => {
      producto.tandas?.forEach(tanda => this.mostrarAlertaVencimiento(tanda));
    });
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
