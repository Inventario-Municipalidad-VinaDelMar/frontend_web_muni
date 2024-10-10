import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button'; 
import { Subscription } from 'rxjs';
import { Categoria } from '../../models/categoria.model';
import { SocketInventarioService } from '../../services/socket-inventario.service';
import { Tanda } from '../../models/tanda.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  daysOfWeek: { day: string, date: string, isToday: boolean, active: boolean }[] = [];
  categorias: Categoria[] = [];
  isLoading = true; // Cambia esto para gestionar la carga
  private subscriptions: Subscription[] = []; // Para almacenar las suscripciones

  timeoutId: any; // Variable para almacenar el temporizador

  constructor(private router: Router, private socketService: SocketInventarioService) {}

  ngOnInit(): void {
    this.calculateWeekDates();
    this.loadCategorias();
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

  // Método para cargar categorías y sus tandas
  loadCategorias(): void {
    const startTime = new Date().getTime();
    this.socketService.getAllProductos();
  
    const categoriasSubscription = this.socketService.loadAllProductos().subscribe((categorias: Categoria[]) => {
      this.categorias = categorias;
  
      const elapsedTime = new Date().getTime() - startTime;
      const minimumTime = 1000; // Tiempo mínimo de 3 segundos
      const remainingTime = minimumTime - elapsedTime;
  
      if (remainingTime > 0) {
        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      } else {
        this.isLoading = false;
      }
  
      // Cargar las tandas para cada categoría
      categorias.forEach(categoria => {
        this.socketService.getTandasByProductoId(categoria.id);
        const tandasSubscription = this.socketService.onLoadTandasByProductoId(categoria.id).subscribe((tandas: Tanda[]) => {
          // Filtrar tandas de los últimos 21 días
          const filteredTandas = tandas.filter(tanda => {
            const fechaLlegada = new Date(tanda.fechaLlegada);
            const today = new Date();
            const daysDiff = Math.floor((today.getTime() - fechaLlegada.getTime()) / (1000 * 3600 * 24));
            return daysDiff <= 21; // Mantener tandas de los últimos 21 días
          });
  
          // Ordenar las tandas filtradas por fechaLlegada y hora (más recientes primero)
          const sortedTandas = filteredTandas.sort((a, b) => {
            const fechaA = new Date(a.fechaLlegada).getTime();
            const fechaB = new Date(b.fechaLlegada).getTime();
            return fechaB - fechaA; // Ordenar por fecha y hora
          });
  
          // Actualizar la categoría con las tandas ordenadas
          this.categorias = this.categorias.map(cat => {
            if (cat.id === categoria.id) {
              return { ...cat, tandas: sortedTandas };
            }
            return cat;
          });
        });
  
        // Almacenar la suscripción
        this.subscriptions.push(tandasSubscription);
      });
  
      // Almacenar la suscripción
      this.subscriptions.push(categoriasSubscription);
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
}
