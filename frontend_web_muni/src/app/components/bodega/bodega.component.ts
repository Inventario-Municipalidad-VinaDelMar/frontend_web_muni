import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bodega',
  standalone: true,
  imports: [CommonModule, CardModule, CarouselModule, PanelModule, ScrollPanelModule,DialogModule,FormsModule,ToastModule,],
  templateUrl: './bodega.component.html',
  styleUrls: ['./bodega.component.scss'],
  providers: [MessageService] 
})
export class BodegaComponent implements OnInit {
  bodegas: any[] = [];
  productos: any[] = [];
  tandasPorProducto: { [productoId: string]: any[] } = {};
  bodegaSeleccionada: any = null;
  ubicacionesUnicas: Set<string> = new Set();
  productosEnUbicacion: any[] = [];
  ubicacionSeleccionada: string | null = null;
  hayProductosEnBodegaSeleccionada: boolean = true;
  mostrarMensajeSinProductos: boolean = false; // Nueva variable para el retraso en mostrar el mensaje


  bodegaNueva: any = { nombre: '', direccion: '', nombreEncargado: '' };
  bodegaEditable: any = {};

  // Control de visibilidad de dialogs
  mostrarDialogoCrearBodega: boolean = false;
  mostrarDialogoEditarBodega: boolean = false;
  mostrarDialogoEliminarBodega: boolean = false;

  // Variables para controlar visibilidad de dialogs de ubicación
  mostrarDialogoCrearUbicacion: boolean = false;
  mostrarDialogoEditarUbicacion: boolean = false;
  mostrarDialogoEliminarUbicacion: boolean = false;

  // Variables para las ubicaciones
  nuevaUbicacion: string = '';
  ubicacionEditable: string = '';
  ubicacionEditableId: string = '';
  ubicacionSeleccionadaParaEliminar: string | null = null;
  bodegaIdSeleccionada: string | null = null;

  public todasLasUbicaciones: any[] = [];

  public ubicacionSeleccionadaId: string | null = null;
  private ubicacionesSubscription: Subscription | undefined; 

  constructor(
    private bodegaService: SocketInventarioService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private messageService: MessageService, 
  ) {}

  ngOnInit() {
    this.actualizarEstadoProductosEnBodega();
    
    // Cargar las bodegas al inicializar el componente
    this.bodegaService.getAllBodegas();
    this.bodegaService.loadAllBodegas().subscribe((data: any) => {
      // Filtrar solo las bodegas que no están eliminadas (isDeleted: false)
      this.bodegas = data.filter((bodega: any) => !bodega.isDeleted);
      
      // Ordenar las bodegas por nombre
      this.bodegas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
      if (this.bodegas.length > 0) {
        this.bodegaSeleccionada = this.bodegas[0];
        this.actualizarUbicacionesUnicas();
        this.actualizarEstadoProductosEnBodega();
      }
    });
    
    // Cargar todos los productos y sus tandas
    this.bodegaService.getAllProductos();
    this.bodegaService.loadAllProductos().subscribe((data: any) => {
      this.productos = data;
    
      this.productos.forEach((producto) => {
        this.obtenerTandasPorProducto(producto.id);
      });
      this.actualizarEstadoProductosEnBodega();
    });
    
    // Suscribirse a eventos de actualización en tiempo real
    this.subscribeToRealTimeUpdates();
  }
  

  seleccionarBodega(index: number) {
    this.bodegaSeleccionada = this.bodegas[index];
    this.actualizarUbicacionesUnicas();
    this.productosEnUbicacion = [];
    this.ubicacionSeleccionada = null;
   
   
    this.actualizarEstadoProductosEnBodega();
  }
  

  obtenerTandasPorProducto(productoId: string) {
    this.bodegaService.getTandasByProductoId(productoId);
    this.bodegaService.onLoadTandasByProductoId(productoId).subscribe((tandas) => {
      this.tandasPorProducto[productoId] = tandas;
      this.actualizarUbicacionesUnicas();
      this.actualizarEstadoProductosEnBodega();
    });
  }

  filtrarTandasPorBodega(productoId: string) {
    return this.tandasPorProducto[productoId]?.filter(
      (tanda) => tanda.bodega === this.bodegaSeleccionada?.nombre
    );
  }

  filtrarTandasPorUbicacion(productoId: string) {
    return this.tandasPorProducto[productoId]?.filter(
      (tanda) =>
        tanda.bodega === this.bodegaSeleccionada?.nombre &&
        tanda.ubicacion === this.ubicacionSeleccionada
    );
  }
  

  
  seleccionarUbicacion(ubicacion: string) {
    this.ubicacionSeleccionada = ubicacion;
    this.productosEnUbicacion = this.productos.filter((producto) =>
      this.filtrarTandasPorBodega(producto.id)?.some(
        (tanda) => tanda.ubicacion === ubicacion
      )
    );
    console.log('Productos en ubicación seleccionada:', this.productosEnUbicacion);
  }

  actualizarEstadoProductosEnBodega() {
    this.hayProductosEnBodegaSeleccionada = this.productos.some(
      producto => this.filtrarTandasPorBodega(producto.id)?.length > 0
    );
    
    if (!this.hayProductosEnBodegaSeleccionada) {
      this.mostrarMensajeSinProductos = false; // Ocultar el mensaje inicialmente
      setTimeout(() => {
        this.mostrarMensajeSinProductos = true; // Mostrar después de 1 segundo
      }, 1000);
    } else {
      this.mostrarMensajeSinProductos = false; // Ocultar el mensaje si hay productos
    }
  }

  // Función para crear una nueva bodega
  crearBodega() {
    const nuevaBodega = {
      nombre: this.quitarTildes(this.bodegaNueva.nombre),
      direccion: this.quitarTildes(this.bodegaNueva.direccion),
      nombreEncargado: this.quitarTildes(this.bodegaNueva.nombreEncargado)
    };
  
    this.http.post('http://34.176.26.41/api/inventario/bodegas', nuevaBodega)
      .subscribe({
        next: (response) => {
          console.log('Bodega creada:', response);
          
          // Mostrar mensaje de éxito usando MessageService
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Bodega creada correctamente'
          });
  
          // Cerrar el diálogo
          this.mostrarDialogoCrearBodega = false;
  
          // Limpiar los campos de la nueva bodega
          this.bodegaNueva = { nombre: '', direccion: '', nombreEncargado: '' };
        },
        error: (error) => {
          console.error('Error al crear la bodega:', error);
          
          // Mostrar mensaje de error usando MessageService
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la bodega'
          });
        }
      });
  }
  

  // Abrir dialogo de edición con datos de la bodega seleccionada
  abrirDialogoEditarBodega(bodega: any) {
    this.bodegaEditable = { ...bodega };
    this.mostrarDialogoEditarBodega = true;
  }

  // Guardar cambios de la bodega editada
  quitarTildes(texto: string): string {
    const acentos: Record<string, string> = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'ñ': 'n', 'Ñ': 'N'
    };
  
    return texto.replace(/[áéíóúÁÉÍÓÚñÑ]/g, (letra) => acentos[letra as keyof typeof acentos] || letra);
  }
  
  guardarCambiosBodega() {
    const idBodega = this.bodegaEditable.id;
    const url = `http://34.176.26.41/api/inventario/bodegas/${idBodega}/update`;

    // Función para reemplazar campos vacíos por "N/A"
    const reemplazarPorNA = (campo: string): string => campo.trim() === '' ? 'N/A' : campo;

    // Aplicar la función para quitar tildes y reemplazar vacíos por "N/A"
    const datosActualizados = {
      nombre: this.quitarTildes(reemplazarPorNA(this.bodegaEditable.nombre)),
      direccion: this.quitarTildes(reemplazarPorNA(this.bodegaEditable.direccion)),
      nombreEncargado: this.quitarTildes(reemplazarPorNA(this.bodegaEditable.nombreEncargado))
    };

    this.http.patch(url, datosActualizados, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    })
    .subscribe({
      next: (response) => {
        console.log('Bodega actualizada en el servidor:', response);
        
        // Actualizar la lista local de bodegas
        const index = this.bodegas.findIndex(b => b.id === idBodega);
        if (index !== -1) {
          this.bodegas[index] = { ...this.bodegaEditable };
        }
        
        // Mostrar mensaje de éxito usando MessageService
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Bodega editada correctamente'
        });

        // Cerrar el diálogo
        this.mostrarDialogoEditarBodega = false;
      },
      error: (error) => {
        console.error('Error al actualizar la bodega:', error);
        
        // Mostrar mensaje de error usando MessageService
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo editar la bodega'
        });
      }
    });
  }
  
  
  

  // Abrir dialogo de confirmación para eliminar
  abrirDialogoEliminarBodega(bodega: any) {
    this.bodegaSeleccionada = bodega;
    this.mostrarDialogoEliminarBodega = true;
  }

  // Eliminar bodega seleccionada
  eliminarBodega() {
    const bodegaId = this.bodegaSeleccionada.id; // Suponiendo que esta es la bodega seleccionada

    this.http.delete(`http://34.176.26.41/api/inventario/bodegas/${bodegaId}/delete`).subscribe({
      next: (response) => {
        console.log('Bodega eliminada:', response);

        // Eliminar la bodega de la lista local
        const index = this.bodegas.findIndex(b => b.id === bodegaId);
        if (index !== -1) {
          this.bodegas.splice(index, 1);  // Eliminar de la lista local
          console.log('Bodega eliminada (de la lista):', this.bodegas);
        }

        // Mostrar mensaje de éxito usando MessageService
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Bodega eliminada correctamente' });

        // Cerrar el diálogo de eliminación
        this.mostrarDialogoEliminarBodega = false;
      },
      error: (error) => {
        console.error('Error al eliminar la bodega:', error);

        // Mostrar mensaje de error usando MessageService
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la bodega' });

        // Cerrar el diálogo de eliminación
        this.mostrarDialogoEliminarBodega = false;
      }
    });
  }

  // Generar un ID único para nuevas bodegas
  generarId() {
    return Math.random().toString(36).substr(2, 9);
  }

  actualizarUbicacionesUnicas() {
    if (this.bodegaSeleccionada) {
      this.bodegaService.getUbicacionesByBodega(this.bodegaSeleccionada.id);
  
      this.ubicacionesSubscription = this.bodegaService
        .loadUbicacionesByBodega(this.bodegaSeleccionada.id)
        .subscribe({
          next: (ubicaciones) => {
            console.log('Datos de ubicaciones recibidos:', ubicaciones);
  
            // Asigna las ubicaciones directamente a todasLasUbicaciones
            this.todasLasUbicaciones = ubicaciones;
  
            this.cdr.detectChanges(); // Forzar la actualización de la vista aquí
          },
          error: (error) => {
            console.error('Error al cargar ubicaciones:', error);
          },
        });
    }
  }
  
  

  // Convertir ubicacionesUnicas (Set) a array para usar en la plantilla
  getUbicacionesArray() {
    return this.todasLasUbicaciones;
  }


  // Crear nueva ubicación
  crearUbicacion() {
    if (this.nuevaUbicacion && !this.ubicacionesUnicas.has(this.nuevaUbicacion) && this.bodegaSeleccionada) {
      // Preparar el objeto de datos para el POST
      const ubicacionData = {
        idBodega: this.bodegaSeleccionada.id, // Obtiene el ID de la bodega seleccionada
        descripcion: this.nuevaUbicacion       // Descripción de la nueva ubicación
      };
  
      // Enviar el POST al servidor
      this.http.post('http://34.176.26.41/api/inventario/ubicaciones', ubicacionData)
        .subscribe({
          next: (response) => {
            console.log('Ubicación creada en el servidor:', response);
  
            // Mostrar mensaje de éxito usando MessageService
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ubicación creada correctamente'
            });
  
            // Limpiar el formulario
            this.mostrarDialogoCrearUbicacion = false;
            this.nuevaUbicacion = '';
          },
          error: (error) => {
            console.error('Error al crear la ubicación:', error);
  
            // Mostrar mensaje de error usando MessageService
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo crear la ubicación'
            });
          }
        });
    } else {
      console.log('La ubicación ya existe, es inválida o no hay una bodega seleccionada.');
      
      // Mostrar mensaje de advertencia si la ubicación no es válida
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La ubicación ya existe, es inválida o no hay una bodega seleccionada.'
      });

      // Cerrar el diálogo y limpiar el campo de la nueva ubicación
      this.mostrarDialogoCrearUbicacion = false;
      this.nuevaUbicacion = '';
    }
  }
  

  // Abrir dialog para editar ubicación
  abrirDialogoEditarUbicacion(id: string, descripcion: string) {
    this.ubicacionEditableId = id;
    this.ubicacionEditable = descripcion;
    this.mostrarDialogoEditarUbicacion = true;
  }

  // Guardar cambios de la ubicación editada
  guardarCambiosUbicacion(id: string) {
    // Construye la URL con el ID de la ubicación
    const url = `http://34.176.26.41/api/inventario/ubicaciones/${id}/update`;
  
    // Define el payload para el PATCH
    const payload = { descripcion: this.ubicacionEditable };
  
    // Realiza la solicitud PATCH
    this.http.patch(url, payload).subscribe(
      (response: any) => {
        console.log('Ubicación actualizada en el servidor:', response);
  
        // Encuentra y actualiza la ubicación en la lista local
        const ubicacionIndex = this.getUbicacionesArray().findIndex(u => u.id === id);
        if (ubicacionIndex !== -1) {
          this.getUbicacionesArray()[ubicacionIndex].descripcion = this.ubicacionEditable;
        }
  
        // Cierra el diálogo de edición y limpia el campo de edición
        this.mostrarDialogoEditarUbicacion = false;
        this.ubicacionEditable = '';
      },
      (error) => {
        console.error('Error al actualizar la ubicación:', error);
        // No limpiar el campo de edición si ocurre un error
      }
    );
  }
  

  // Abrir dialog para confirmar eliminación de ubicación
  abrirDialogoEliminarUbicacion(id: string) {
    this.ubicacionSeleccionadaId = id;
    this.mostrarDialogoEliminarUbicacion = true;
  }

  // Eliminar ubicación
  eliminarUbicacion() {
    if (this.ubicacionSeleccionadaId) {
      const url = `http://34.176.26.41/api/inventario/ubicaciones/${this.ubicacionSeleccionadaId}/delete`;
      console.log('Eliminando ubicación con ID:', this.ubicacionSeleccionadaId);
  
      this.http.delete(url).subscribe({
        next: () => {
          console.log('Ubicación eliminada con éxito');
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'La ubicación ha sido eliminada correctamente'
          });
          
          // Actualizar lista de ubicaciones y forzar detección de cambios
          this.actualizarUbicacionesUnicas();
          this.cdr.detectChanges(); // Forzar la actualización de la vista
          this.mostrarDialogoEliminarUbicacion = false;
        },
        error: err => {
          console.error('Error al eliminar la ubicación:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la ubicación'
          });
          this.mostrarDialogoEliminarUbicacion = false;
        }
      });
    } else {
      console.warn('No se ha seleccionado ninguna ubicación para eliminar.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se ha seleccionado ninguna ubicación para eliminar'
      });
      this.mostrarDialogoEliminarUbicacion = false;
    }
  }
  


  private subscribeToRealTimeUpdates() {
    // Suscribirse a la creación de nuevas tandas
    this.bodegaService.listenNewTandaCreated().subscribe(tanda => this.updateProductoTanda(tanda));
  
    // Suscribirse a las actualizaciones de tandas existentes
    this.bodegaService.listenNewTandaUpdate().subscribe(tanda => this.updateProductoTanda(tanda));
  
    // Suscribirse a los cambios de stock de productos
    this.bodegaService.listenStockProductoChange().subscribe(change => this.updateStockProducto(change));
  }
  private updateProductoTanda(tanda: any) {
    const productoId = tanda.productoId;
  
    // Actualizar la tanda en tandasPorProducto
    this.tandasPorProducto[productoId] = (this.tandasPorProducto[productoId] || [])
      .filter((t: any) => t.id !== tanda.id)
      .concat(tanda);
  
    // Refrescar la lista de ubicaciones y el estado de los productos en bodega
    this.actualizarUbicacionesUnicas();
    this.actualizarEstadoProductosEnBodega();
    this.cdr.detectChanges();  // Forzar la detección de cambios
  }
  
  private updateStockProducto(change: any) {
    // Actualizar el stock del producto en la lista de productos
    this.productos = this.productos.map(producto => {
      if (producto.id === change.productoId) {
        return { ...producto, stock: change.nuevoStock };
      }
      return producto;
    });
  
    // Refrescar el estado de los productos en bodega
    this.actualizarEstadoProductosEnBodega();
    this.cdr.detectChanges();  // Forzar la detección de cambios
  }
    
  

}
