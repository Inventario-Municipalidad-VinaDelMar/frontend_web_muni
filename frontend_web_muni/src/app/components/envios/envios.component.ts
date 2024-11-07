import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { EnviosSocketService } from '../../services/envios.service';
import { Router } from '@angular/router';
import { Envio } from '../../models/envio.model';

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
export class EnviosComponent implements OnInit {
  selectedDate: Date | null = null;
  enviosList: Envio[] = [];
  envioIds: Set<string> = new Set();

  daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  monthsOfYear = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  constructor(
    private enviosSocketService: EnviosSocketService,
    private router: Router,
    private adapter: DateAdapter<any>
  ) {}

  ngOnInit() {
    this.adapter.setLocale('es-ES'); // Configura la localización en español
    this.adapter.getFirstDayOfWeek = () => 1;
    this.selectedDate = new Date();
    this.selectedDate.setHours(0, 0, 0, 0);
    this.buscarEnvios(); // Cargar envíos para la fecha actual
  }

  // Función para traducir y formatear la fecha en español
  getFormattedDate(date: Date | string): string {
    // Si el parámetro es un string, conviértelo a Date usando los componentes de la fecha
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number); // Asume formato 'YYYY-MM-DD'
      date = new Date(year, month - 1, day); // Crear Date en zona local
    }
  
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
  
    return `${dayName}, ${day} ${monthName} ${year}`;
  }
  

  // Función para capitalizar la primera letra (opcional para mejorar presentación)
  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
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
      error: (error) => console.error('Error al cargar envíos:', error),
    });
  }

  procesarEnvios(data: Envio | Envio[]) {
    if (Array.isArray(data)) {
      data.forEach((envio) => {
        if (!this.envioIds.has(envio.id)) {
          this.enviosList.push(envio);
          this.envioIds.add(envio.id);
        }
      });
    } else {
      if (!this.envioIds.has(data.id)) {
        this.enviosList.push(data);
        this.envioIds.add(data.id);
      }
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  goToDetalle(envioId: string) {
    this.router.navigate(['/detalle-envio', envioId]);
  }

  // Función para formatear la hora en formato de 12 horas con AM/PM
  formatHour(hour: string | null): string {
    if (!hour) {
      return 'No disponible';
    }

    const [hours, minutes] = hour.split(':');
    const hourInt = parseInt(hours, 10);
    const period = hourInt < 12 ? 'AM' : 'PM';
    const hour12 = hourInt % 12 || 12; // Convierte a formato de 12 horas

    return `${hour12}:${minutes} ${period}`;
  }
}
