import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { EnviosSocketService } from '../../services/envios.service';
import { Router } from '@angular/router';
import { Envio } from '../../models/envio.model';
import { Subscription } from 'rxjs';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-envios',
  standalone: true,
  templateUrl: './envios.component.html',
  styleUrls: ['./envios.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS } // Configura el idioma español en este componente
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

  getFormattedDate(date: Date | string): string {
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }

    const dayName = this.daysOfWeek[date.getDay()];
    const day = date.getDate();
    const monthName = this.monthsOfYear[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
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
    this.cdr.detectChanges(); // Forzar la detección de cambios para cada actualización
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
  
  
}
