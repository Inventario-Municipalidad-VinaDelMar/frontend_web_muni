import { Component, OnInit } from '@angular/core'; 
import { Observable } from 'rxjs';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bodega',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bodega.component.html',
  styleUrls: ['./bodega.component.scss'] // Corrige styleUrl a styleUrls
})
export class BodegaComponent implements OnInit {
  bodegas: any[] = []; // Array para almacenar las bodegas
  ubicaciones: any[] = []; // Para almacenar la lista de ubicaciones
  productos: any[] = []; // Para almacenar la lista de productos
  categorias: any[] = [];

  constructor(private bodegaService: SocketInventarioService) {}

  ngOnInit() {
    // Llamar a getAllBodegas para solicitar las bodegas
    this.bodegaService.getAllBodegas();
    
    // Suscribirse a loadAllBodegas para recibir los datos
    this.bodegaService.loadAllBodegas().subscribe((data: any) => {
      this.bodegas = data; // Asigna los datos recibidos a la propiedad bodegas
      console.log(this.bodegas); // Opcional: ver en consola
    });
  }
}

