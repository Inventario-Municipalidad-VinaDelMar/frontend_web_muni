import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EnviosSocketService } from '../../services/envios.service';
import { Envio } from '../../models/envio.model';
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
  imports: [CommonModule, RouterModule, CardModule, PanelModule,CarouselModule,FieldsetModule],
  templateUrl: './detalle-tarjetas.component.html',
  styleUrls: ['./detalle-tarjetas.component.scss']
})
export class DetalleTarjetasComponent implements OnInit {
  envioId: string = ''; // El ID del envío
  envioData: DetalleEnvio | null = null; // Datos del envío específico
  

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private enviosSocketService: EnviosSocketService // Inyecta el servicio de envíos
  ) {}

  ngOnInit() {
    // Captura el ID del envío desde la URL
    this.route.params.subscribe(params => {
      this.envioId = params['id']; // Asigna el ID de la URL a `envioId`

      // Llama al servicio para obtener los datos del envío usando `getEnvioById`
      this.enviosSocketService.getEnvioById(this.envioId).subscribe(envio => {
        this.envioData = envio; // Asigna los datos del envío al componente
        console.log('Datos del envío:', envio);
      }, error => {
        console.error('Error al cargar los datos del envío:', error);
      });
    });
  }
  volver() {
    this.location.back();
  }
}
