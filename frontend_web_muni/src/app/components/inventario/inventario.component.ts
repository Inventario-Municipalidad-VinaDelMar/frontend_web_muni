import { Component } from '@angular/core';
import { TablaInventarioComponent } from "../tabla-inventario/tabla-inventario.component";

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [TablaInventarioComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent {

}
