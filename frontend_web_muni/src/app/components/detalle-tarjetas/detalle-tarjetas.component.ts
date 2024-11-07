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

@Component({
  selector: 'app-detalle-tarjetas',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, PanelModule, CarouselModule, FieldsetModule],
  templateUrl: './detalle-tarjetas.component.html',
  styleUrls: ['./detalle-tarjetas.component.scss']
})
export class DetalleTarjetasComponent implements OnInit {
  envioId: string = '';
  envioData: DetalleEnvio | null = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private enviosSocketService: EnviosSocketService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.envioId = params['id'];
      this.enviosSocketService.getEnvioById(this.envioId).subscribe({
        next: (envio) => {
          this.envioData = envio;
          console.log('Datos del envío:', envio);
        },
        error: (err) => {
          console.error('Error al cargar los datos del envío:', err);
        }
      });
    });
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
