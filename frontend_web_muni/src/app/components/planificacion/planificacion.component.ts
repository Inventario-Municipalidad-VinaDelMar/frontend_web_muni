import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';


interface Producto {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-planificacion',
  standalone: true,
  templateUrl: './planificacion.component.html',
  styleUrls: ['./planificacion.component.scss'],
  imports:[CommonModule,FormsModule]
})
export class PlanificacionComponent {
  // Lista inicial de productos
  productos: Producto[] = [
    { id: 'producto-1', nombre: 'Producto 1' },
    { id: 'producto-2', nombre: 'Producto 2' },
    { id: 'producto-3', nombre: 'Producto 3' },
    { id: 'producto-4', nombre: 'Producto 4' },
    { id: 'producto-5', nombre: 'Producto 5' },
    { id: 'producto-6', nombre: 'Producto 6' },
    { id: 'producto-7', nombre: 'Producto 7' },
    { id: 'producto-8', nombre: 'Producto 8' },
    { id: 'producto-9', nombre: 'Producto 9' },
    { id: 'producto-10', nombre: 'Producto 10' },
    { id: 'producto-11', nombre: 'Producto 11' },
    { id: 'producto-12', nombre: 'Producto 12' },
    { id: 'producto-13', nombre: 'Producto 13' },
    { id: 'producto-14', nombre: 'Producto 14' },
    { id: 'producto-15', nombre: 'Producto 15' },
    { id: 'producto-16', nombre: 'Producto 16' },
    { id: 'producto-17', nombre: 'Producto 17' },
    { id: 'producto-18', nombre: 'Producto 18' },
    { id: 'producto-19', nombre: 'Producto 19' },
    { id: 'producto-20', nombre: 'Producto 20' },
  ];
  productosPorDia: { [key: string]: Producto[] } = {
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
  };
  productosFiltrados: Producto[] = [...this.productos];

  searchTerm: string = '';
  // Función para permitir el drop en los contenedores de los días
  allowDrop(event: DragEvent) {
    event.preventDefault();
    const target = event.target as HTMLElement;
    target.classList.add('drag-over');
  }

  // Función que se llama cuando se inicia el arrastre de un producto
  drag(event: DragEvent) {
    if (event.target) {
      event.dataTransfer?.setData('text', (event.target as HTMLElement).id);
    }
  }

  // Función que se llama al soltar un producto en un día
  drop(event: DragEvent, dia: string) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text');
    const producto = document.getElementById(data ?? '');
    if (producto) {
      (event.target as HTMLElement).appendChild(producto);
    }
    (event.target as HTMLElement).classList.remove('drag-over');
  }
  dropToMainList(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text');
    const producto = document.getElementById(data ?? '');

    if (producto) {
      const parentId = producto.parentElement?.id;
      if (parentId && parentId !== 'productos') {
        // Remueve de la lista del día si está en alguno
        this.productosPorDia[parentId] = this.productosPorDia[parentId].filter(p => p.id !== data);
        this.productos.push({ id: data ?? '', nombre: producto.textContent ?? '' });
        document.getElementById('productos')?.appendChild(producto);
      }
    }
  }
  filtrarProductos() {
    this.productosFiltrados = this.productos.filter((producto) =>
      producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  cambiarSemana() {
    alert('Semana cambiada');
  }
}
