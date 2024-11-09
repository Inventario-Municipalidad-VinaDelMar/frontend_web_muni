import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EnviosSocketService } from '../../services/envios.service';
import { DetalleEnvio } from '../../models/detalle-envio.model';
import { Location } from '@angular/common';

// Importaciones de PrimeNG
import { FieldsetModule } from 'primeng/fieldset';
import { CarouselModule } from 'primeng/carousel';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { Envio } from '../../models/envio.model';
import { DialogModule } from 'primeng/dialog';
import { AccordionModule } from 'primeng/accordion';


@Component({
  selector: 'app-detalle-tarjetas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, 
    CardModule,
    PanelModule,
    CarouselModule,
    FieldsetModule,
    DialogModule,
    AccordionModule,
  ],
  templateUrl: './detalle-tarjetas.component.html',
  styleUrls: ['./detalle-tarjetas.component.scss']
})
export class DetalleTarjetasComponent implements OnInit {
  envioId: string = '';
  envioData: DetalleEnvio | null = null;
  fechaSeleccionada: string = '';
  envioData2: Envio = {
    id: '',
    fecha: '',
    horaCreacion: '',
    horaInicioEnvio: '',
    ultimaActualizacion: '',
    horaFinalizacion: null,
    status: '',
    autorizante: '',
    solicitante: '',
    productos: [],
    entregas: [],
    incidentes: [] // Inicializar incidentes como un arreglo vacío
  };
  isModalOpen = false;
  modalImageUrl: string | null = null;

  openModal(imageUrl: string): void {
    this.isModalOpen = true;
    this.modalImageUrl = imageUrl;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalImageUrl = null;
  }
  

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private enviosSocketService: EnviosSocketService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.envioId = params['id'];
      // Primero, obtenemos el detalle del envío inicial
      this.enviosSocketService.getEnvioById(this.envioId).subscribe({
        next: (envio) => {
          this.envioData = envio;
          console.log('Datos del envío inicial:', envio);
  
          // Luego, cargamos los envíos por la fecha actual
          const fechaActual = envio.fecha;
          this.cargarEnviosPorFecha(fechaActual);
        },
        error: (err) => {
          console.error('Error al cargar los datos del envío:', err);
        }
      });
    });
  }
  
  // Método para cargar envíos por fecha y comparar
  cargarEnviosPorFecha(fecha: string): void {
    this.enviosSocketService.loadEnviosByFecha(fecha).subscribe({
      next: (envios: Envio[]) => {
        // Filtra los envíos que coinciden con el ID de detalleEnvio
        const envioCoincidente = envios.find(envio => envio.id === this.envioData?.id);
  
        if (envioCoincidente) {
          this.envioData2 = envioCoincidente; // Almacena el envío coincidente
          console.log('Datos del envío para la fecha coincidente:', this.envioData2);
        } else {
          console.warn('No se encontró un envío que coincida con el ID del detalleEnvio en la fecha especificada');
        }
      },
      error: (error) => {
        console.error('Error al cargar los envíos por fecha:', error);
      }
    });
  }
  
  getDiferenciaProductos() {
    if (!this.envioData?.cargaInicial || !this.envioData?.cargaActual) {
      return [];
    }
  
    const diferencias = this.envioData.cargaInicial.map((productoInicial: any) => {
      const productoActual = this.envioData?.cargaActual.find((p: any) => p.productoId === productoInicial.productoId);
      const cantidadActual = productoActual ? productoActual.cantidad : 0;
      const diferencia = productoInicial.cantidad - cantidadActual;
  
      return {
        ...productoInicial,
        cantidadInicial: productoInicial.cantidad,
        cantidadActual: cantidadActual,
        diferencia: diferencia
      };
    });
  
    return diferencias;
  }
  

  
  

  formatHora(hora: string | null): string {
    if (!hora) {
      return 'No disponible';
    }
  
    const [hours, minutes] = hora.split(':');
    const hourInt = parseInt(hours, 10);
  
    const period = hourInt >= 12 ? 'PM' : 'AM';
    const hour12 = hourInt % 12 || 12;
  
    return `${hour12}:${minutes} ${period}`;
  }
  

  volver(): void {
    this.location.back();
  }
}
