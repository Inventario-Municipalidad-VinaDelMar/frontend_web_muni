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


  daysOfWeek: { day: string, date: string, isToday: boolean, active: boolean }[] = [];


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
    console.log("Fecha recibida:", fecha);
  
    // Descomposición manual de la fecha para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-').map(Number);
    let date = new Date(year, month - 1, day); // Restamos 1 al mes porque los meses en JavaScript van de 0 a 11
    const dayOfWeek = date.getDay();
    console.log("Día de la semana (0 = Domingo, 6 = Sábado):", dayOfWeek);
  
    // Si es sábado (6), avanza 2 días para obtener el lunes
    // Si es domingo (0), avanza 1 día para obtener el lunes
    if (dayOfWeek === 6) {
      date.setDate(date.getDate() + 2);
      console.log("Es sábado, ajustando la fecha al lunes:", date);
    } else if (dayOfWeek === 0) {
      date.setDate(date.getDate() + 1);
      console.log("Es domingo, ajustando la fecha al lunes:", date);
    } else {
      console.log("Es día de semana, no se requiere ajuste.");
    }
  
    // Convertir la fecha al formato "yyyy-MM-dd" para el socket
    const adjustedDate = date.toISOString().split('T')[0];
    console.log("Fecha ajustada para enviar al socket:", adjustedDate);
  
    // Ahora llama al servicio del socket con la fecha ajustada
    this.planificacionSocketService.getPlanificacionIndividual(adjustedDate);
    console.log("Llamada al socket realizada con la fecha:", adjustedDate);
  
    const planificacionSubscription = this.planificacionSocketService.onLoadPlanificacionData()
      .subscribe(planificacion => {
        this.planningData = planificacion; // Almacena los datos recibidos
        console.log("Datos recibidos del socket:", planificacion);
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
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    this.daysOfWeek = days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      
      return {
        day,
        date: formatDate(date, 'yyyy-MM-dd', 'en-US'), // Almacena la fecha en formato ISO
        isToday: today.toDateString() === date.toDateString(),
        active: today.toDateString() === date.toDateString()
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
