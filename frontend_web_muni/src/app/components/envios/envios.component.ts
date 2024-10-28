import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { EnviosSocketService } from '../../services/envios.service';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { Envio } from '../../models/envio.model';

@Component({
  selector: 'app-envios',
  standalone: true,
  templateUrl: './envios.component.html',
  styleUrls: ['./envios.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    TableModule
  ]
})
export class EnviosComponent implements OnInit {
  selectedDate: Date | null = null; // Guardamos la fecha seleccionada
  enviosList: Envio[] = []; // Almacena la lista de envíos recibidos
  envioIds: Set<string> = new Set();

  constructor(private enviosSocketService: EnviosSocketService, private router: Router) {
    // Suscribirse a los envíos recibidos desde el socket
    this.enviosSocketService.onLoadEnviosByFecha().subscribe((data: Envio | Envio[]) => {
      this.procesarEnvios(data);
    });
  }

  ngOnInit() {
    // Establecemos la fecha actual como la fecha seleccionada
    this.selectedDate = new Date();
    
    // Asegurarse de que la hora sea medianoche
    this.selectedDate.setHours(0, 0, 0, 0);
  
    // Cargar envíos de hoy inmediatamente al iniciar
    this.cargarEnvios(this.formatDate(this.selectedDate));
  }

  // Método para cargar los envíos de una fecha específica
  cargarEnvios(fechaSeleccionada: string) {
    // Limpiar la lista actual de envíos y los IDs
    this.enviosList = [];
    this.envioIds.clear();

    // Llamar al servicio para cargar los envíos de la fecha seleccionada
    this.enviosSocketService.loadEnviosByFecha(fechaSeleccionada).subscribe({
      next: (data: Envio[]) => {
        this.procesarEnvios(data);
        console.log("Envíos cargados para la fecha:", fechaSeleccionada);
      },
      error: (error) => {
        console.error("Error al cargar envíos:", error);
      }
    });
  }

  // Este método se llama cuando se selecciona una nueva fecha
  onDateChange(selectedDate: Date) {
    // Establecer la nueva fecha seleccionada
    this.selectedDate = selectedDate;

    // Formateamos la nueva fecha seleccionada y cargamos los envíos
    const fechaSeleccionada = this.formatDate(selectedDate);
    this.cargarEnvios(fechaSeleccionada);
  }

  // Procesar envíos recibidos y agregarlos a la lista
  procesarEnvios(data: Envio | Envio[]) {
    if (Array.isArray(data)) {
      data.forEach(envio => {
        if (!this.envioIds.has(envio.id)) {
          this.enviosList.push(envio);
          this.envioIds.add(envio.id); // Agrega el ID al Set para evitar duplicados
        }
      });
    } else {
      if (!this.envioIds.has(data.id)) {
        this.enviosList.push(data);
        this.envioIds.add(data.id);
      }
    }

    console.log("Envíos recibidos:", this.enviosList);
  }

  // Formatear la fecha a 'YYYY-MM-DD'
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Devuelve 'YYYY-MM-DD'
  }

  goToDetalle(envioId: string) {
    this.router.navigate(['/detalle-envio', envioId]);
  }
}
