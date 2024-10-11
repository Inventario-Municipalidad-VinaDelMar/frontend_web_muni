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
  
    if (tandaElement) {
      const tanda = this.tandas.find(t => t.id === data);
      
      if (tanda) {
        // Agregar la tanda al día correspondiente
        this.tandasPorDia[dia].push(tanda);
        
        // Removerla de la lista de tandas filtradas
        this.tandasFiltradas = this.tandasFiltradas.filter(t => t.id !== tanda.id);
  
        // Cambiar las clases
        tandaElement.classList.add('tanda-en-dia');
        tandaElement.classList.add(`tanda-en-${dia}`);  // Clase específica para el día
        tandaElement.classList.remove('tanda-en-lista');
      }
    }
  }
  
  quitarDeDia(tanda: Tanda, dia: string) {
    // Remover la tanda del día correspondiente
    this.tandasPorDia[dia] = this.tandasPorDia[dia].filter(t => t.id !== tanda.id);
  
    // Agregar la tanda de nuevo a la lista filtrada
    this.tandasFiltradas.push(tanda);
    
    // Opcional: Puedes agregar lógica adicional si necesitas manejar la UI después de quitar
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
      const tanda = this.tandas.find(t => t.id === data);
      
      if (tanda) {
        // Remover la tanda del día correspondiente
        for (let dia in this.tandasPorDia) {
          this.tandasPorDia[dia] = this.tandasPorDia[dia].filter(t => t.id !== tanda.id);
        }
  
        // Añadir la tanda de vuelta a la lista principal
        this.tandasFiltradas.push(tanda);
  
        // Cambiar las clases
        tandaElement.classList.remove('tanda-en-dia');
        tandaElement.classList.add('tanda-en-lista');
  
        // Añadir el elemento de nuevo a la lista principal
        const productosContainer = document.getElementById('productos');
        if (productosContainer) {
          productosContainer.appendChild(tandaElement);
        }
      }
    }
  }
  
  
  





  // Filtrar tandas en función del término de búsqueda
  filtrarTandas() {
    // Obtener las tandas que ya han sido asignadas a los días de la semana
    const tandasEnDias = Object.values(this.tandasPorDia).flat().map(t => t.id);
  
    // Filtrar solo las tandas que no están en los días de la semana
    this.tandasFiltradas = this.tandas
      .filter(tanda => !tandasEnDias.includes(tanda.id))  // Excluir tandas en días
      .filter(tanda => tanda.producto.toLowerCase().includes(this.searchTerm.toLowerCase()));  // Aplicar filtro de búsqueda
  }
  



  cambiarSemana() {
    alert('Semana cambiada');
  }
}
