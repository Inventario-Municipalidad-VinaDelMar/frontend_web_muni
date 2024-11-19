import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EnviosSocketService } from '../../services/Sockets/envios.service';
import { DetalleEnvio, Movimiento, Entrega, Producto, Incidente } from '../../models/detalle-envio.model';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

// PrimeNG imports
import { FieldsetModule } from 'primeng/fieldset';
import { CarouselModule } from 'primeng/carousel';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
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
export class DetalleTarjetasComponent implements OnInit, OnDestroy {
  envioId: string = '';
  envioData: DetalleEnvio | null = null;
  isModalOpen = false;
  modalImageUrl: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private enviosSocketService: EnviosSocketService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.envioId = params['id'];
      this.cargarEnvioInicial();
      this.escucharActualizacionesEnvio();
    });
  }

  cargarEnvioInicial(): void {
    const envioSubscription = this.enviosSocketService.getEnvioById(this.envioId).subscribe({
      next: (envio) => {
        if (envio) {
          this.envioData = {
            id: envio.id ?? '',
            fecha: envio.fecha ?? '',
            horaCreacion: envio.horaCreacion ?? '',
            horaInicioEnvio: envio.horaInicioEnvio ?? null,
            horaFinalizacion: envio.horaFinalizacion ?? null,
            ultimaActualizacion: envio.ultimaActualizacion ?? '',
            status: envio.status ?? '',
            autorizante: envio.autorizante ?? '',
            solicitante: envio.solicitante ?? '',
            movimientos: this.ordenarPorFecha(envio.movimientos || []), // Ordenar movimientos
            cargaInicial: envio.cargaInicial || [],
            cargaActual: envio.cargaActual || [],
            incidentes: this.ordenarPorFecha(envio.incidentes || []), // Ordenar incidentes
            entregas: this.ordenarPorFecha(envio.entregas || []) // Ordenar entregas
          };
          console.log('Datos del envío inicial cargados:', this.envioData);
        } else {
          console.warn('No se recibió ningún envío.');
        }
      },
      error: (err) => console.error('Error al cargar los datos del envío:', err)
    });
    this.subscriptions.add(envioSubscription);
  }
  ordenarPorFecha(lista: any[]): any[] {
    return lista.sort((a, b) => {
      const fechaA = new Date(a.fecha + 'T' + (a.hora || '00:00:00')).getTime();
      const fechaB = new Date(b.fecha + 'T' + (b.hora || '00:00:00')).getTime();
      return fechaB - fechaA; // Orden descendente: más recientes primero
    });
  }
    
  
  getDiferenciaProductos() {
    if (!this.envioData?.cargaInicial || !this.envioData?.cargaActual) return [];

    return this.envioData.cargaInicial.map((productoInicial) => {
      const productoActual = this.envioData?.cargaActual.find(p => p.productoId === productoInicial.productoId);
      const cantidadActual = productoActual ? productoActual.cantidad : 0;
      return {
        ...productoInicial,
        cantidadInicial: productoInicial.cantidad,
        cantidadActual: cantidadActual,
        diferencia: productoInicial.cantidad - cantidadActual
      };
    });
  }
  formatFechaCompleta(fecha: string | undefined | null): string {
    if (!fecha) return 'No disponible';
  
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // Los meses son 0 indexados
    const anio = date.getFullYear();
    
    let horas = date.getHours();
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const segundos = date.getSeconds().toString().padStart(2, '0');
  
    // Determinar si es AM o PM
    const periodo = horas >= 12 ? 'PM' : 'AM';
  
    // Convertir al formato de 12 horas si es necesario
    const horasFormateadas = horas.toString().padStart(2, '0');
  
    return `${horasFormateadas}:${minutos} ${periodo}`;
  }

  formatTime(timeString: string): string {
    // Divide la cadena en horas, minutos y segundos si no es un Date válido
    const [hours, minutes] = timeString.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
        return 'Hora inválida'; // Manejo de errores si el formato es incorrecto
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours

    const minutesStr = minutes < 10 ? `0${minutes}` : minutes; // Asegura 2 dígitos para minutos

    return `${hours12}:${minutesStr} ${ampm}`;
}


escucharActualizacionesEnvio(): void {
  const actualizacionSubscription = this.enviosSocketService.listenToEnvioUpdates(this.envioId).subscribe({
    next: (envioActualizado) => {
      console.log('Actualización en tiempo real recibida:', envioActualizado);
      this.envioData = {
        ...envioActualizado,
        movimientos: this.ordenarPorFecha(envioActualizado.movimientos || []),
        incidentes: this.ordenarPorFecha(envioActualizado.incidentes || []),
        entregas: this.ordenarPorFecha(envioActualizado.entregas || [])
      };
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error al recibir actualizaciones en tiempo real:', err)
  });
  this.subscriptions.add(actualizacionSubscription);
}



  volver(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openModal(imageUrl: string): void {
    this.isModalOpen = true;
    this.modalImageUrl = imageUrl;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalImageUrl = null;
  }

  getTiempoEnEnvio(horaInicio: string | null): string {
    if (!horaInicio) {
      return 'No disponible'; // Si no hay hora de inicio, muestra "No disponible"
    }
  
    const horaInicioDate = new Date(horaInicio);
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - horaInicioDate.getTime();
  
    if (diferenciaMs < 0) {
      return 'No disponible'; // Si la fecha de inicio es futura, devuelve "No disponible"
    }
  
    // Convierte la diferencia de milisegundos a horas, minutos y segundos
    const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const minutos = Math.floor((diferenciaMs % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferenciaMs % (1000 * 60)) / 1000);
  
    // Formatea la duración en un string legible
    return `${horas}h ${minutos}m ${segundos}s`;
  }
  
}
