import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Producto } from '../../models/producto.model';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { PlanificacionSocketService } from '../../services/Sockets/planificacion.socket.service';
import { AuthService } from '../../services/Sockets/auth.service';
import { Tanda } from '../../models/tanda.model';
import { CommonModule, formatDate } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DashboardComponent } from "../dashboard/dashboard.component";


@Component({
  standalone:true,
  imports: [CommonModule, CarouselModule, CardModule, PanelModule, ScrollPanelModule, DashboardComponent],
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  greetingMessage: string = '';
  userAuthenticated: boolean = false;
  userImageUrl: string = '';


  daysOfWeek: { 
    day: string; 
    date: string; 
    isToday: boolean; 
    active: boolean; 
    planificacion: any | null; // Agregamos planificacion
  }[] = [];
  


  productos: Producto[] = [];
  productoReciente: Producto | null = null; // Producto más reciente
  tandasRecientes: Tanda[] = []; // Las 5 tandas más recientes


  private subscriptions: Subscription[] = [];
  planningData: any = null;
  selectedDate: string = '';
  selectedDayName: string = 'Hoy'; 
  private planningTimeout: any; 
  

  constructor(
    private router: Router,
    private authService: AuthService,
    private socketInventarioService: SocketInventarioService,
    private planificacionSocketService: PlanificacionSocketService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.selectedDate = formatDate(today, 'yyyy-MM-dd', 'en-US');
    this.selectedDayName = 'Hoy';
    this.loadPlanificacion(this.selectedDate);

    this.setUserGreeting();
    this.calculateWeekDates();
    this.loadTandasRecientes();
    this.calculateWeekDates();
  }
  translateMonth(month: string | null | undefined): string {
    if (!month) return ''; // Maneja casos donde month es null o undefined
    const monthTranslations: { [key: string]: string } = {
      'January': 'Enero',
      'February': 'Febrero',
      'March': 'Marzo',
      'April': 'Abril',
      'May': 'Mayo',
      'June': 'Junio',
      'July': 'Julio',
      'August': 'Agosto',
      'September': 'Septiembre',
      'October': 'Octubre',
      'November': 'Noviembre',
      'December': 'Diciembre'
    };
    return monthTranslations[month] || month;
  }
  
  translateDay(day: string | null | undefined): string {
    if (!day) return ''; // Maneja casos donde day es null o undefined
    const dayTranslations: { [key: string]: string } = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo'
    };
    return dayTranslations[day] || day;
  }
  
  

  setUserGreeting(): void {
    const user = this.authService.getUser();
    this.userAuthenticated = !!user;
    const hour = new Date().getHours();
    const greetingBase = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

    this.greetingMessage = user ? `${greetingBase}, ${user.nombre}!` : `${greetingBase}, visitante!`;
    this.userImageUrl = user?.imagen || '/assets/img/user.jpeg';
  }

  loadTandasRecientes(): void {
    // 1. Obtiene todos los productos
    this.socketInventarioService.getAllProductos();
    const productosSubscription = this.socketInventarioService.loadAllProductos().subscribe((productos: Producto[]) => {
      // 2. Itera sobre cada producto para obtener sus tandas
      productos.forEach(producto => {
        this.socketInventarioService.getTandasByProductoId(producto.id);

        // 3. Suscribirse para recibir las tandas del producto
        const tandaSubscription = this.socketInventarioService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
          // Agrega las tandas obtenidas a la lista de tandas recientes
          this.tandasRecientes.push(...tandas);

          // Ordena y limita a las 5 tandas más recientes
          this.tandasRecientes = this.tandasRecientes
            .sort((a, b) => new Date(b.fechaLlegada).getTime() - new Date(a.fechaLlegada).getTime())
            .slice(0, 5);
        });

        this.subscriptions.push(tandaSubscription);
      });
    });

    this.subscriptions.push(productosSubscription);
  }

  loadPlanificacion(fecha: string): void {
    this.planificacionSocketService.getPlanificacionIndividual(fecha);
  
    const planificacionSubscription = this.planificacionSocketService.onLoadPlanificacionData()
      .subscribe(planificacion => {
        const dayIndex = this.daysOfWeek.findIndex(day => day.date === fecha);
  
        if (dayIndex !== -1) {
          this.daysOfWeek[dayIndex].planificacion = planificacion || { detalles: [] };
        }
  
        // Actualiza la planificación del día seleccionado
        if (this.selectedDate === fecha) {
          this.planningData = planificacion || { detalles: [] };
        }
      });
  
    this.subscriptions.push(planificacionSubscription);
  }
  
  

  onSelectDate(day: any): void {
    if (this.planningTimeout) {
      clearTimeout(this.planningTimeout);
    }
  
    // Utiliza la fecha ya en formato "yyyy-MM-dd" sin necesidad de formatearla
    this.selectedDate = day.date;
    this.selectedDayName = day.day;
  
    this.planningTimeout = setTimeout(() => {
      this.loadPlanificacion(this.selectedDate);
    }, 0);
  }
  
  

  calculateWeekDates(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1)); // Ajusta al lunes
  
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  
    // Crea los días con una estructura predeterminada
    this.daysOfWeek = days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
  
      return {
        day, // Nombre del día
        date: formatDate(date, 'yyyy-MM-dd', 'en-US'), // Fecha en formato ISO
        isToday: today.toDateString() === date.toDateString(),
        active: today.toDateString() === date.toDateString(),
        planificacion: null // Predeterminado sin planificación
      };
    });
  }
  
  redirectToPlanificacion(): void {
    this.router.navigate(['/planificacion']);
  }
  

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }


  
}
