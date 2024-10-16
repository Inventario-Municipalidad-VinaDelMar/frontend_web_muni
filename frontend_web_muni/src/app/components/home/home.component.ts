import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button'; 
import { Subscription } from 'rxjs';
import { Producto } from '../../models/producto.model';  // Cambio de Categoria a Producto
import { SocketInventarioService } from '../../services/socket-inventario.service';
import { Tanda } from '../../models/tanda.model';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider'; // Para p-divider
import { BadgeModule } from 'primeng/badge'; // Para p-badge
import { TableModule} from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, CardModule, DividerModule, BadgeModule, DialogModule],

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  daysOfWeek: { day: string, date: string, isToday: boolean, active: boolean }[] = [];
  productos: Producto[] = [];  // Cambio de categorias a productos
  isLoading = true;
  tandasRecientes: Tanda[] = []; 
  private subscriptions: Subscription[] = [];

  timeoutId: any;

  constructor(private router: Router, private socketService: SocketInventarioService) {}

  ngOnInit(): void {
    this.calculateWeekDates();
    this.loadProductos();  // Cambio de loadCategorias a loadProductos
  }

  calculateWeekDates(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    this.daysOfWeek = days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        date: date.toLocaleDateString('es-ES'),
        isToday: dayOfWeek - 1 === index,
        active: dayOfWeek - 1 === index
      };
    });
  }

  // Método para cargar productos y sus tandas
  loadProductos(): void {
    const startTime = new Date().getTime();
    this.socketService.getAllProductos();

    const productosSubscription = this.socketService.loadAllProductos().subscribe((productos: Producto[]) => {
      this.productos = productos;

      const elapsedTime = new Date().getTime() - startTime;
      const minimumTime = 1000; 
      const remainingTime = minimumTime - elapsedTime;

      if (remainingTime > 0) {
        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      } else {
        this.isLoading = false;
      }

      // Cargar las tandas para cada producto
      productos.forEach(producto => {
        this.socketService.getTandasByProductoId(producto.id);
        const tandasSubscription = this.socketService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
          // Filtrar y agregar tandas al arreglo de tandasRecientes
          const filteredTandas = tandas.filter(tanda => {
            const fechaLlegada = new Date(tanda.fechaLlegada);
            const today = new Date();
            const daysDiff = Math.floor((today.getTime() - fechaLlegada.getTime()) / (1000 * 3600 * 24));
            return daysDiff <= 21; 
          });

          this.tandasRecientes.push(...filteredTandas); // Agregar las tandas filtradas al arreglo

          // Actualizar el producto con las tandas
          this.productos = this.productos.map(prod => {
            if (prod.id === producto.id) {
              return { ...prod, tandas: filteredTandas };
            }
            return prod;
          });

          // Ordenar todas las tandasRecientes por fechaLlegada (más recientes primero)
          this.tandasRecientes = this.tandasRecientes.sort((a, b) => {
            return new Date(b.fechaLlegada).getTime() - new Date(a.fechaLlegada).getTime();
          });
        });

        this.subscriptions.push(tandasSubscription);
      });

      this.subscriptions.push(productosSubscription);
    });
  }

  // Método para establecer el día seleccionado como activo
  setActive(day: { day: string, date: string, isToday: boolean, active: boolean }): void {
    clearTimeout(this.timeoutId);
    this.daysOfWeek.forEach(d => d.active = false);
    day.active = true;
    this.resetToTodayAfterTimeout();
  }

  // Método para regresar al día de hoy automáticamente
  resetToTodayAfterTimeout(): void {
    this.timeoutId = setTimeout(() => {
      this.daysOfWeek.forEach(day => {
        day.active = day.isToday;
      });
    }, 5000); // 5000 milisegundos = 5 segundos
  }

  // Redirigir a otra ruta (planificación) al hacer clic
  redirectToPlanificacion(): void {
    this.router.navigate(['/planificacion']);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones para evitar fugas de memoria
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
  isNewTanda(fechaLlegada: string): boolean {
    const fecha = new Date(fechaLlegada);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
    return diferenciaDias <= 7; // Consideramos nuevas las tandas de los últimos 7 días
  }
  
}
