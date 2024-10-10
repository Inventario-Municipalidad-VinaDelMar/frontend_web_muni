import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketInventarioService } from '../../services/socket-inventario.service';
import { Tanda } from '../../models/tanda.model';

interface Producto {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-planificacion',
  standalone: true,
  templateUrl: './planificacion.component.html',
  styleUrls: ['./planificacion.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class PlanificacionComponent implements OnInit {
  productos: Producto[] = [];
  tandas: Tanda[] = [];
  tandasPorDia: { [key: string]: Tanda[] } = {
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
  };
  tandasFiltradas: Tanda[] = [];
  searchTerm: string = '';

  constructor(private socketService: SocketInventarioService) {}

  ngOnInit() {
    // Paso 1: Obtener todos los productos disponibles desde el backend
    this.socketService.getAllProductos();
    this.socketService.loadAllProductos().subscribe((productos: Producto[]) => {
      this.productos = productos;

      // Paso 2: Para cada producto, obtener sus tandas asociadas
      this.productos.forEach(producto => {
        this.socketService.getTandasByProductoId(producto.id);
        this.socketService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
          // Paso 3: Agregar las tandas obtenidas a la lista global de tandas
          this.tandas = [...this.tandas, ...tandas];
          this.tandasFiltradas = [...this.tandas];  // Actualiza las tandas filtradas
        });
      });
    });
  }

  // Permitir el drop en los contenedores de los días
  drop(event: DragEvent, dia: string) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text');
    const tandaElement = document.getElementById(data ?? '');
  
    // Asegúrate de que el drop ocurra sólo en el contenedor del día
    const diaElement = document.getElementById(dia);
  
    if (tandaElement && diaElement) {
      // Evita que las tandas se superpongan asegurándote de que el drop sea en el contenedor
      diaElement.appendChild(tandaElement);
  
      // Aquí puedes agregar lógica para cambiar el estilo de la tanda cuando está en un día
      tandaElement.classList.add('tanda-en-dia');
      tandaElement.classList.remove('tanda-en-lista'); // O cualquier otra clase para la lista
    }
  
    (event.target as HTMLElement).classList.remove('drag-over');
  }
  
  allowDrop(event: DragEvent) {
    // Evitar que el drop ocurra en otros lugares no deseados
    event.preventDefault();
  }
  
  drag(event: DragEvent) {
    event.dataTransfer?.setData('text', (event.target as HTMLElement).id);
  }
  
  

  dropToMainList(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text');
    const tandaElement = document.getElementById(data ?? '');
  
    if (tandaElement) {
      // Remover la tanda del día actual
      const parentId = tandaElement.parentElement?.id;
      if (parentId && Object.keys(this.tandasPorDia).includes(parentId)) {
        // Filtra la tanda del día
        this.tandasPorDia[parentId] = this.tandasPorDia[parentId].filter(tanda => tanda.id !== data);
      }
  
      // Verifica si la tanda ya está en tandasFiltradas antes de agregarla
      const tanda = this.tandas.find(tanda => tanda.id === data);
      if (tanda && !this.tandasFiltradas.some(t => t.id === tanda.id)) {
        this.tandasFiltradas.push(tanda); // Agregar nuevamente a las tandas filtradas
      }
  
      // Quitar la clase 'tanda-en-dia' cuando la tanda se devuelve a la lista principal
      tandaElement.classList.remove('tanda-en-dia');
  
      // Asegúrate de que el contenedor de productos tenga el ID correcto
      const productosContainer = document.getElementById('productos');
      if (productosContainer) {
        productosContainer.appendChild(tandaElement);
      }
    }
  }
  





  // Filtrar tandas en función del término de búsqueda
  filtrarTandas() {
    this.tandasFiltradas = this.tandas.filter((tanda) =>
      tanda.producto.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  cambiarSemana() {
    alert('Semana cambiada');
  }
}
