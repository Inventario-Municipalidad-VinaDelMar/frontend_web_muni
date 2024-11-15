import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EnviosSocketService } from '../../services/envios.service';
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
            if (envio) {  // Verificación de existencia
                this.envioData = {
                    id: envio.id ?? '', // Asegura que `id` tenga un valor predeterminado
                    fecha: envio.fecha ?? '',
                    horaCreacion: envio.horaCreacion ?? '',
                    horaInicioEnvio: envio.horaInicioEnvio ?? null,
                    horaFinalizacion: envio.horaFinalizacion ?? null,
                    ultimaActualizacion: envio.ultimaActualizacion ?? '',
                    status: envio.status ?? '',
                    autorizante: envio.autorizante ?? '',
                    solicitante: envio.solicitante ?? '',
                    movimientos: envio.movimientos || [], // Asegura que haya una lista vacía
                    cargaInicial: envio.cargaInicial || [],
                    cargaActual: envio.cargaActual || [],
                    incidentes: envio.incidentes || [],
                    entregas: envio.entregas || [] // Añade `entregas` con un valor predeterminado de array vacío
                };
                console.log('Datos del envío inicial cargados:', this.envioData); // Verificar datos recibidos
            } else {
                console.warn('No se recibió ningún envío.');
            }
        },
        error: (err) => console.error('Error al cargar los datos del envío:', err)
    });
    this.subscriptions.add(envioSubscription);
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

  formatHoraConMilisegundos(hora: string | undefined | null): string {
    if (!hora) return 'No disponible';
  
    // Convertir el string de hora a objeto Date, ignorando los milisegundos
    const [horaParte, milisegundos] = hora.split('.'); // Separar milisegundos si existen
    const date = new Date(`1970-01-01T${horaParte}Z`); // Ignorar la fecha real, centrarse en la hora
    
    let horas = date.getHours();
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const segundos = date.getSeconds().toString().padStart(2, '0');
  
    // Determinar si es AM o PM
    const periodo = horas >= 12 ? 'PM' : 'AM';
  
    // Convertir al formato de 12 horas
    const horasFormateadas = horas.toString().padStart(2, '0');
  
    return `${horasFormateadas}:${minutos} ${periodo}`;
  }
  
  

  escucharActualizacionesEnvio(): void {
    const actualizacionSubscription = this.enviosSocketService.listenToEnvioUpdates(this.envioId).subscribe({
        next: (envioActualizado) => {
            console.log('Actualización en tiempo real recibida en el componente:', envioActualizado);
            this.envioData = envioActualizado;
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
}
