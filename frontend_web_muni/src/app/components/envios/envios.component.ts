import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { EnviosSocketService } from '../../services/Sockets/envios.service';
import { Router } from '@angular/router';
import { Envio } from '../../models/envio.model';
import { Subscription } from 'rxjs';

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Este formato se usa para analizar fechas ingresadas por el usuario
  },
  display: {
    dateInput: 'dd/MM/yyyy', // Este formato se usa para mostrar la fecha
    monthYearLabel: 'MMMM yyyy', // Etiqueta de mes y año en el calendario
    dateA11yLabel: 'LL', // Accesibilidad
    monthYearA11yLabel: 'MMMM yyyy', // Accesibilidad
  },
};



@Component({
  selector: 'app-envios',
  standalone: true,
  templateUrl: './envios.component.html',
  styleUrls: ['./envios.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS } // Configura el idioma español en este componente
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule
  ]
})
export class EnviosComponent implements OnInit, OnDestroy {
  selectedDate: Date | null = null;
  enviosList: Envio[] = [];
  envioIds: Set<string> = new Set();
  private subscription: Subscription = new Subscription(); // Inicialización de `subscription`

  daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  monthsOfYear = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  constructor(
    private enviosSocketService: EnviosSocketService,
    private router: Router,
    private adapter: DateAdapter<any>,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.adapter.setLocale('es-ES'); // Configura el idioma a español
    this.setWeekStartMonday();
    this.selectedDate = new Date();
    this.selectedDate.setHours(0, 0, 0, 0);
    this.buscarEnvios();

    // Suscribirse a cambios en tiempo real de los envíos
    this.subscription.add(
      this.enviosSocketService.listenToProductosByFecha().subscribe({
        next: (data: Envio[]) => {
          this.procesarEnvios(data);
          this.cdr.detectChanges(); // Forzar la detección de cambios
        },
        error: (error: any) => console.error('Error al escuchar cambios de envíos:', error),
      })
    );
  }

  getFormattedDate(dateInput: Date | string): string {
    if (!dateInput) return 'Fecha no disponible';
  
    let date: Date;
  
    if (typeof dateInput === 'string') {
      // Divide el string de fecha en partes para evitar problemas de zona horaria
      const [year, month, day] = dateInput.split('T')[0].split('-').map(Number);
      date = new Date(year, month - 1, day); // Crea un objeto Date en la zona horaria local sin ajustes
    } else {
      date = dateInput;
    }
  
    const day = date.getDate().toString().padStart(2, '0'); // Día con 2 dígitos
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes con 2 dígitos
    const year = date.getFullYear(); // Año completo
  
    return `${day}/${month}/${year}`; // Formato deseado
  }
  
  

  setWeekStartMonday() {
    // Configura el inicio de la semana en lunes
    this.adapter.getFirstDayOfWeek = () => 1; // 1 significa lunes
  }

  buscarEnvios() {
    if (this.selectedDate) {
      const fechaSeleccionada = this.formatDate(this.selectedDate);
      this.cargarEnvios(fechaSeleccionada);
    }
  }

  cargarEnvios(fechaSeleccionada: string) {
    this.enviosList = [];
    this.envioIds.clear();
    this.enviosSocketService.loadEnviosByFecha(fechaSeleccionada).subscribe({
      next: (data: Envio[]) => this.procesarEnvios(data),
      error: (error: any) => console.error('Error al cargar envíos:', error),
    });
  }

  procesarEnvios(data: Envio | Envio[]) {
    if (Array.isArray(data)) {
      data.forEach((envio) => {
        if (!this.envioIds.has(envio.id)) {
          this.enviosList.push(envio);
          this.envioIds.add(envio.id);
        } else {
          // Actualizar detalles si el envío ya existe
          const index = this.enviosList.findIndex((e) => e.id === envio.id);
          if (index !== -1) {
            this.enviosList[index] = envio;
          }
        }
      });
    } else {
      if (!this.envioIds.has(data.id)) {
        this.enviosList.push(data);
        this.envioIds.add(data.id);
      } else {
        const index = this.enviosList.findIndex((e) => e.id === data.id);
        if (index !== -1) {
          this.enviosList[index] = data;
        }
      }
    }
  
    // Ordenar los envíos por fecha de creación
    this.enviosList.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return dateB - dateA; // Orden descendente: más recientes primero
    });
  
    this.cdr.detectChanges(); // Actualizar la vista
  }
  

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  goToDetalle(envioId: string) {
    this.router.navigate(['/detalle-envio', envioId]);
  }

  formatHour(hour: string | null): string {
    if (!hour) {
      return 'No disponible';
    }

    const [hours, minutes] = hour.split(':');
    const hourInt = parseInt(hours, 10);
    const period = hourInt < 12 ? 'AM' : 'PM';
    const hour12 = hourInt % 12 || 12;

    return `${hour12}:${minutes} ${period}`;
  }

  formatISOTime(isoDate: string): string {
    if (!isoDate) return 'Hora no disponible';
  
    const date = new Date(isoDate); // Convierte la cadena ISO a un objeto Date
    let hours = date.getHours(); // Obtiene la hora en formato 24 horas
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Minutos con 2 dígitos
    const ampm = hours >= 12 ? 'PM' : 'AM'; // Determina si es AM o PM
  
    return `${hours}:${minutes} ${ampm}`; // Formato deseado
  }
  

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe(); // Liberar suscripción en `ngOnDestroy`
    }
  }

  getStatusClass(status: string): string {
    if (status === 'En envio') {
      return 'status-en-envio';
    } else if (status === 'Finalizado') {
      return 'status-finalizado';
    }
    return ''; // No aplica ninguna clase adicional si es "sin cargar"
  }
  getStatusImage(status: string): string {
    switch (status.toLowerCase()) {
      case 'sin cargar':
        return 'assets/img/cargar.gif';
      case 'cargando':
        return 'assets/img/cargando.gif';
      case 'carga completa':
        return 'assets/img/completa3.gif';
      case 'en envio':
        return 'assets/img/camiones3.gif';
      default:
        return 'assets/img/default.png'; // Imagen por defecto si no hay estado válido
    }
  }
  getTiempoEnEnvio(horaInicio: string): string {
    if (!horaInicio) {
      return 'No disponible';
    }
  
    const inicio = new Date(horaInicio);
    const ahora = new Date();
  
    const diferenciaMs = ahora.getTime() - inicio.getTime();
  
    if (diferenciaMs < 0) {
      return 'Pendiente'; // En caso de que la hora de inicio sea futura
    }
  
    const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const minutos = Math.floor((diferenciaMs % (1000 * 60 * 60)) / (1000 * 60));
  
    return `${horas}h ${minutos}m`;
  }
  
  
}
