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


@Component({
  standalone:true,
  imports:[CommonModule,CarouselModule,CardModule,PanelModule,ScrollPanelModule ],
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
    console.log('Cargando planificación para la fecha:', fecha);
    this.planificacionSocketService.getPlanificacionIndividual(fecha);

    const planificacionSubscription = this.planificacionSocketService.onLoadPlanificacionData()
      .subscribe(planificacion => {
        this.planningData = planificacion; // Almacena los datos recibidos
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
