import { Component, OnInit, ViewEncapsulation, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Tanda } from '../../models/tanda.model';
import { Subscription } from 'rxjs';
import { Producto } from '../../models/producto.model';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { PaginatorModule } from 'primeng/paginator';
import * as XLSX from 'xlsx';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api'; 
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { TokenService } from '../../services/auth-token.service';

@Component({
  selector: 'app-tabla-inventario',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './tabla-inventario.component.html',
  standalone: true,
  styleUrls: ['./tabla-inventario.component.scss'],
  providers: [SocketInventarioService, MessageService,ConfirmationService,ConfirmDialogModule],
  imports: [
    CommonModule,
    PaginatorModule,
    DialogModule,
    HttpClientModule,

  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TablaInventarioComponent implements OnInit, OnDestroy {

  estadoFiltroActual: string | null = null;
  productos: Producto[] = [];
  productos2: Producto[] = [];
  expandedRows: { [key: string]: boolean } = {};
  
  isLoading: boolean = true;
  hasError: boolean = false;
  private subscriptions: Subscription = new Subscription();
  contadorVencidos: number = 0;
  contadorPorVencerEtapa1: number = 0;
  contadorPorVencerEtapa2: number = 0;
  contadorSeguro: number = 0;
  

  productosPaginados: Producto[] = [];  // Productos en la página actual
  productosPorPagina: number = 10; // Número de productos por página
  paginaActual: number = 0;

  terminoBusqueda: string = '';
  productosFiltrados: Producto[] = [];

  mostrarDialogo: boolean = false;
  mostrarDialogo2: boolean = false;
  mostrarDialogo3: boolean = false;
  mostrarDialogoConfirmacionEliminar: boolean = false;

  mostrarDialogoEditarProducto: boolean = false;
  productoEditable: any = {};



  tandaSeleccionada= {
    id:"",
    cantidadIngresada:0,
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };
  esEdicion: boolean = false;
  dialogLabel: string = 'Añadir Tanda'; 
  bodegaOpciones: { id: string; nombre: string }[] = [];

  ubicacionOpciones: string[] = [];
  ubicacionListado: { id: string; descripcion: string }[] = [];

  productoOpciones: { id: string; nombre: string }[] = [];

  mostrarDialogoConfirmacion = false;

  


  nuevoProducto = {
    nombre: '',
    descripcion: '',
    urlImagen: ''
  };

  nuevaTanda = {
    id:"",
    cantidadIngresada:0,
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };
  

  errores = {
    cantidadIngresada: "",
    cantidadActual: 0,
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };
  

  imagenSeleccionada: File | null = null;
  bodegaLista: { id: string; nombre: string; direccion: string; nombreEncargado: string; isDeleted: boolean }[] = [];


  constructor(
    private socketService: SocketInventarioService,
    private messageService: MessageService,
    private http: HttpClient,
    
  ) {this.generarOpciones();}

  ngOnInit() {
    const startTime = new Date().getTime();
    this.cargarBodegas();
  
    // Suscribirse a eventos de conexión/desconexión del socket
    this.socketService.onConnect().subscribe(() => console.log('Socket conectado'));
    this.socketService.onDisconnect().subscribe(() => console.log('Socket desconectado'));
  
    setTimeout(() => {
      if (this.isLoading) {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 10000);
  
    // Cargar productos inicialmente
    setTimeout(() => {
      this.socketService.getAllProductos();
      this.subscriptions.add(
        this.socketService.loadAllProductos().subscribe((productos: Producto[]) => {
          if ((new Date().getTime() - startTime) <= 10000) {
            // Filtrar productos para excluir los eliminados
            this.productos = productos.filter(producto => !producto.isDeleted);
            this.productos2 = [...this.productos];
            this.isLoading = false;
            this.hasError = false;
  
            // Log de los productos cargados
            console.log("Productos cargados (excluyendo eliminados):", this.productos);
  
            // Inicializa el contador para verificar cuántos productos han cargado sus tandas
            let productosConTandasCargadas = 0;
  
            // Cargar tandas para cada producto
            this.productos.forEach(producto => {
              this.loadTandasForProducto(producto.id, () => {
                productosConTandasCargadas++;
                // Verifica si todos los productos han cargado sus tandas
                if (productosConTandasCargadas === this.productos.length) {
                  // Actualiza los productos paginados para mostrar la primera página
                  this.actualizarProductosPaginados();
  
                  // Generar las opciones para productoId, bodega, y ubicacion después de cargar todos los productos
                  this.generarOpciones();
                }
              });
            });
          }
        }, () => {
          this.hasError = true;
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El servicio no está disponible. Intente más tarde.' });
        })
      );
    }, 1000);
  
    // Suscribirse a actualizaciones en tiempo real
    this.subscriptions.add(this.socketService.listenNewTandaCreated().subscribe(tanda => this.updateProductoTanda(tanda)));
    this.subscriptions.add(this.socketService.listenNewTandaUpdate().subscribe(tanda => this.updateProductoTanda(tanda)));
    this.subscriptions.add(this.socketService.listenStockProductoChange().subscribe(change => this.updateStockProducto(change)));
  }
  
  
  
  

  private loadTandasForProducto(idProducto: string, callback?: () => void) {
    this.socketService.getTandasByProductoId(idProducto);
    const tandaSubscription = this.socketService.onLoadTandasByProductoId(idProducto).subscribe((tandas: Tanda[]) => {
      // Ordenar tandas por fecha de vencimiento más próxima antes de asignarlas
      tandas.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
  
      this.productos = this.productos.map(prod => prod.id === idProducto ? { ...prod, tandas: tandas } : prod);
      this.productos2 = [...this.productos];
      tandaSubscription.unsubscribe();
      this.actualizarAlertas(); // Actualiza los contadores de alertas
      
      // Llamar al callback una vez que las tandas hayan sido cargadas
      if (callback) {
        callback();
      }
    });
    this.subscriptions.add(tandaSubscription);
  }
  
  private updateProductoTanda(tanda: Tanda) {
    this.productos = this.productos.map(prod => {
      if (prod.id === tanda.productoId) {
        const tandas = (prod.tandas || []).filter(t => t.id !== tanda.id).concat(tanda);
        tandas.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
        return { ...prod, tandas };
      }
      return prod;
    });
    this.productos2 = [...this.productos];
    this.actualizarAlertas();
    this.actualizarProductosPaginadosFiltrados();  // Llama para refrescar los productos paginados y filtrados
  }
  
  

  actualizarProductosPaginados() {
    const inicio = this.paginaActual * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    this.productosPaginados = this.productos.slice(inicio, fin);
  }

  cambiarPagina(event: any) {
    this.paginaActual = event.page;
    this.actualizarProductosPaginados();
  }
  
  
  // Función para actualizar el stock de un producto específico
  private updateStockProducto(change: any) {
    this.productos = this.productos.map(prod => {
      if (prod.id === change.productoId) {
        return { ...prod, stock: change.nuevoStock };
      }
      return prod;
    });
    this.productos2 = [...this.productos];
    this.actualizarAlertas();
    this.actualizarProductosPaginadosFiltrados();  // Llama para refrescar los productos paginados y filtrados
  }
  

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Calcular la cantidad total de productos
  calcularCantidadTotal(producto: Producto): number {
    return (producto.tandas || []).reduce((total, tanda) => total + tanda.cantidadActual, 0);
  }

  // Calcular la cantidad de productos próximos a vencer
  calcularCantidadPorVencer(producto: Producto): number {
    const hoy = new Date();
    return (producto.tandas || []).filter(tanda => {
      const fechaVencimiento = new Date(tanda.fechaVencimiento);
      return (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24) <= 7;
    }).length;
  }
  

  toggleExpansion(productId: string): void {
    this.expandedRows[productId] = !this.expandedRows[productId];
  }

  // Obtener la fecha de vencimiento más próxima
  calcularFechaProxima(producto: Producto): string {
    if (!producto.tandas || producto.tandas.length === 0) {
      return 'N/A';
    }
    const fechas = producto.tandas.map(tanda => new Date(tanda.fechaVencimiento));
    const fechaProxima = fechas.reduce((min, fecha) => fecha < min ? fecha : min);
    return fechaProxima.toISOString().split('T')[0];
  }

  // Calcular el estado de vencimiento para contabilización
  calcularEstadoVencimiento(tanda: Tanda): string {
    const hoy = new Date();
    if (!tanda.fechaVencimiento) {
      return 'sinVencimiento';
    }
    const fechaVencimiento = new Date(tanda.fechaVencimiento);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (diffDays < 0) {
      return 'vencido';
    } else if (diffDays <= 2) {
      return 'porVencerEtapa1';
    } else if (diffDays <= 7) {
      return 'porVencerEtapa2';
    } else {
      return 'seguro';
    }
  }

  getTotalTandas(): number {
    return this.productos.reduce((total, producto) => total + (producto.tandas ? producto.tandas.length : 0), 0);
  }
  

  

  // Contabilizar alertas y actualizar los contadores de estados
  actualizarAlertas() {
    // Reiniciar contadores antes de contar
    this.contadorVencidos = 0;
    this.contadorPorVencerEtapa1 = 0;
    this.contadorPorVencerEtapa2 = 0;
    this.contadorSeguro = 0;
  
    this.productos.forEach(producto => {
      producto.tandas?.forEach(tanda => {
        const estado = this.calcularEstadoVencimiento(tanda);
        
        switch (estado) {
          case 'vencido':
            this.contadorVencidos++;
            break;
          case 'porVencerEtapa1':
            this.contadorPorVencerEtapa1++;
            break;
          case 'porVencerEtapa2':
            this.contadorPorVencerEtapa2++;
            break;
          case 'seguro':
            this.contadorSeguro++;
            break;
        }
      });
    });
  
    // Imprimir contadores en consola para verificar si están correctos
    console.log(`Vencidos: ${this.contadorVencidos}, Por Vencer (1-2 días): ${this.contadorPorVencerEtapa1}, Por Vencer (3-7 días): ${this.contadorPorVencerEtapa2}, Seguros: ${this.contadorSeguro}`);
  }
  filtrarPorEstado(estado: string): void {
    this.estadoFiltroActual = estado;
    this.paginaActual = 0; // Reinicia a la primera página
    this.actualizarProductosPaginadosFiltrados();
  }
  
  mostrarTodos(): void {
    this.estadoFiltroActual = null;
    this.terminoBusqueda = ''; // Restablece el término de búsqueda
    this.paginaActual = 0; // Reinicia a la primera página
    this.actualizarProductosPaginadosFiltrados(); // Restablece la lista completa
  }
  
  
  obtenerTituloFiltro(estado: string): string {
    switch (estado) {
      case 'vencido':
        return 'Vencidos';
      case 'porVencerEtapa1':
        return 'Por vencer (1-2 días)';
      case 'porVencerEtapa2':
        return 'Por vencer (3-7 días)';
      case 'seguro':
        return 'Seguros';
      default:
        return '';
    }
  }

  filtrarProductos() {
  const termino = this.terminoBusqueda.toLowerCase();

  this.productosFiltrados = this.productos.filter(producto => {
    // Verificar si el término está en el nombre del producto
    const coincideProducto = producto.nombre.toLowerCase().includes(termino);

    // Verificar si el término está en alguna tanda del producto
    const coincideTanda = producto.tandas?.some(tanda => 
      tanda.ubicacion?.toLowerCase().includes(termino) || 
      tanda.bodega?.toLowerCase().includes(termino) || 
      tanda.fechaVencimiento?.toLowerCase().includes(termino)
    );

    // Retornar verdadero si el término coincide con el producto o alguna tanda
    return coincideProducto || coincideTanda;
  });

  // Actualizar la paginación con los productos filtrados
  this.actualizarProductosPaginadosFiltrados();
}

actualizarProductosPaginadosFiltrados() {
  let listaFiltrada = this.productos;

  // Filtrar por término de búsqueda
  if (this.terminoBusqueda) {
    const termino = this.terminoBusqueda.toLowerCase();
    listaFiltrada = listaFiltrada.filter(producto =>
      producto.nombre.toLowerCase().includes(termino) ||
      producto.tandas?.some(tanda => 
        tanda.ubicacion?.toLowerCase().includes(termino) || 
        tanda.bodega?.toLowerCase().includes(termino) || 
        tanda.fechaVencimiento?.toLowerCase().includes(termino)
      )
    );
  }

  // Filtrar por estado de vencimiento
  if (this.estadoFiltroActual) {
    listaFiltrada = listaFiltrada.filter(producto =>
      producto.tandas?.some(tanda => 
        this.calcularEstadoVencimiento(tanda) === this.estadoFiltroActual
      )
    );
  }

  // Actualizar productosFiltrados con la lista filtrada
  this.productosFiltrados = listaFiltrada;

  // Paginación de los productos filtrados
  const inicio = this.paginaActual * this.productosPorPagina;
  const fin = inicio + this.productosPorPagina;
  this.productosPaginados = this.productosFiltrados.slice(inicio, fin);
}



exportarInventarioExcel() {
  // Prepara los datos para el Excel
  const inventarioData: any[] = [];

  // Agrega cada producto y sus tandas a la lista
  this.productos.forEach(producto => {
    if (producto.tandas && producto.tandas.length > 0) {
      producto.tandas.forEach(tanda => {
        inventarioData.push({
          "Nombre del Producto": producto.nombre,
          "Cantidad Total": this.calcularCantidadTotal(producto),
          "Cantidad Actual en Tanda": tanda.cantidadActual,
          "Fecha de Vencimiento": tanda.fechaVencimiento,
          "Fecha de Ingreso": tanda.fechaLlegada,
          "Ubicación": tanda.ubicacion,
          "Bodega": tanda.bodega
        });
      });
    } else {
      // Si el producto no tiene tandas, aún lo agregamos al Excel con información básica
      inventarioData.push({
        "Nombre del Producto": producto.nombre,
        "Cantidad Total": this.calcularCantidadTotal(producto),
        "Cantidad Actual en Tanda": "N/A",
        "Fecha de Vencimiento": "N/A",
        "Fecha de Ingreso": "N/A",
        "Ubicación": "N/A",
        "Bodega": "N/A"
      });
    }
  });

  // Crear un libro de trabajo (Workbook) y una hoja de trabajo (Worksheet)
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(inventarioData);

  // Agregar la hoja al libro de trabajo
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

  // Exportar el archivo Excel
  XLSX.writeFile(workbook, 'Inventario.xlsx');
}

confirmExport() {
  this.mostrarDialogo = true; // Mostrar el diálogo
}

onConfirm() {
  this.mostrarDialogo = false; // Cierra el diálogo
  this.exportarInventarioExcel(); // Llama a la función de exportación
}

onCancel() {
  this.mostrarDialogo2 = false; // Cierra el diálogo sin exportar
}

addProduct(): void {
  if (!this.nuevoProducto.nombre || !this.nuevoProducto.descripcion || !this.imagenSeleccionada) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const formData = new FormData();
  formData.append('nombre', this.nuevoProducto.nombre);
  formData.append('descripcion', this.nuevoProducto.descripcion);
  formData.append('productImage', this.imagenSeleccionada, this.imagenSeleccionada.name);

  const url = 'http://34.176.26.41/api/inventario/productos';
  this.http.post(url, formData).subscribe(
    (response: any) => {
      console.log("Producto añadido:", response);
      alert("Producto añadido exitosamente.");
      this.mostrarDialogo = false;

      // Añadir el nuevo producto a la lista de productos y actualizar la paginación
      this.productos.push(response);
      this.actualizarProductosPaginadosFiltrados();
    },
    error => {
      console.error("Error al añadir el producto:", error);
      alert("Error al añadir el producto.");
    }
  );
}



onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    this.imagenSeleccionada = input.files[0];
  }
}


abrirDialogoTanda() {
  this.esEdicion = false;
  this.dialogLabel = 'Añadir Tanda'; // Cambia el label del botón al modo añadir
  this.limpiarFormularioTanda();
  this.mostrarDialogo3 = true;
}


editarTanda(tanda: Tanda) {
  this.esEdicion = true;
  this.dialogLabel = 'Guardar Cambios';
  this.mostrarDialogo3 = true;

  this.tandaSeleccionada = tanda; // Guarda la tanda seleccionada
  // Rellena los campos del formulario con los datos actuales de la tanda
  this.nuevaTanda.cantidadIngresada = tanda.cantidadIngresada;
  this.nuevaTanda.fechaVencimiento = tanda.fechaVencimiento;
}



cerrarDialogoTanda() {
  this.mostrarDialogo3 = false;
  this.esEdicion = false;
  this.dialogLabel = 'Añadir Tanda'; // Restablece el label para el siguiente uso
  this.limpiarFormularioTanda();
}


addTanda() {
  if (this.validarFormulario()) {
    const token = localStorage.getItem('authToken');

    const body = {
      cantidadIngresada: this.nuevaTanda.cantidadIngresada,
      fechaVencimiento: this.nuevaTanda.fechaVencimiento,
      idProducto: this.nuevaTanda.productoId,
      idBodega: this.nuevaTanda.bodega, // Ahora es el id de la bodega
      idUbicacion: this.nuevaTanda.ubicacion,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch('http://34.176.26.41/api/inventario/tandas', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })
    .then(response => {
      if (response.ok) {
        console.log("Tanda añadida exitosamente:", this.nuevaTanda);
        this.mostrarDialogo3 = false;
      } else {
        console.error("Error al añadir la tanda:", response.statusText);
      }
    })
    .catch(error => console.error("Error en la solicitud:", error));
  }
}


validarCantidadIngresada() {
  if (this.nuevaTanda.cantidadIngresada < 0) {
    this.nuevaTanda.cantidadIngresada = 0; // Si es negativo, lo establece en 0
  }
}



// Método auxiliar para obtener el nombre del producto a partir de su ID
obtenerNombreProducto(productoId: string): string {
  const producto = this.productoOpciones.find(p => p.id === productoId);
  return producto ? producto.nombre : '';
}

limpiarFormularioTanda() {
}


guardarCambiosTanda() {
  if (this.tandaSeleccionada) {
    const token = localStorage.getItem('authToken');
    const idTanda = this.tandaSeleccionada.id; // Usa el id de la tanda seleccionada

    // Define los datos a actualizar
    const body = {
      cantidadIngresada: this.nuevaTanda.cantidadIngresada,
      fechaVencimiento: this.nuevaTanda.fechaVencimiento,
    };

    // Configura los encabezados de la solicitud
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Realiza la solicitud PATCH
    fetch(`http://34.176.26.41/api/inventario/tandas/${idTanda}/update`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(body)
    })
    .then(response => {
      if (response.ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'Tanda Actualizada',
          detail: 'La tanda se ha actualizado correctamente',
          life: 3000
        });
        this.cerrarDialogoTanda(); // Cierra el diálogo de edición
      } else {
        console.error("Error al actualizar la tanda:", response.statusText);
      }
    })
    .catch(error => console.error("Error en la solicitud:", error));
  }
}


eliminarProducto(): void {
  this.mostrarDialogoConfirmacion = true;
}

confirmarEliminacion(): void {
  const url = `http://34.176.26.41/api/inventario/productos/${this.productoEditable.id}/delete`;
  console.log("prisdjka_ "+this.productoEditable.id )
  this.http.delete(url).subscribe(
    response => {
      console.log("Producto eliminado:", response);
      alert("Producto eliminado exitosamente.");
      
      // Remueve el producto de la lista de productos local
      this.productos = this.productos.filter(p => p.id !== this.productoEditable.id);
      this.actualizarProductosPaginadosFiltrados();
      
      // Cierra el diálogo de edición y de confirmación
      this.cerrarDialogoEditarProducto();
      this.mostrarDialogoConfirmacion = false;
    },
    error => {
      console.error("Error al eliminar el producto:", error);
      alert("Error al eliminar el producto.");
      this.mostrarDialogoConfirmacion = false;
    }
  );
}


generarOpciones() {
  // Asegúrate de que `productoOpciones` esté vacío antes de llenarlo
  this.productoOpciones = [];

  // Recorrer la lista de productos y generar las opciones
  this.productos.forEach(producto => {
    // Asegúrate de que el producto tenga un id y un nombre antes de añadirlo a las opciones
    if (producto.id && producto.nombre) {
      this.productoOpciones.push({ id: producto.id, nombre: producto.nombre });
    }
  });

  // Opcional: Mostrar en la consola para verificar
  console.log("Opciones de productos generadas:", this.productoOpciones);
}


validarFormulario(): boolean {
  let esValido = true;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Elimina la hora para comparar solo la fecha
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1); // Calcula el día siguiente

  // Reiniciar mensajes de error
  this.errores = {
    cantidadIngresada: "",
    cantidadActual: 0,
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };

  // Validación de la cantidad ingresada
  if (!this.nuevaTanda.cantidadIngresada || this.nuevaTanda.cantidadIngresada < 0) {
    this.errores.cantidadIngresada = 'La cantidad ingresada debe ser mayor que 0';
    esValido = false;
  }

  // Validación de la fecha de vencimiento
  const fechaVencimiento = new Date(this.nuevaTanda.fechaVencimiento);
  if (!this.nuevaTanda.fechaVencimiento) {
    this.errores.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
    esValido = false;
  } else if (fechaVencimiento < hoy) {
    this.errores.fechaVencimiento = 'La fecha de vencimiento debe ser al menos un día después de hoy';
    esValido = false;
  }

  // Validación del producto
  if (!this.nuevaTanda.productoId) {
    this.errores.productoId = 'Seleccione un producto';
    esValido = false;
  }

  // Validación de la bodega
  if (!this.nuevaTanda.bodega) {
    this.errores.bodega = 'Seleccione una bodega';
    esValido = false;
  }

  // Validación de la ubicación
  if (!this.nuevaTanda.ubicacion) {
    this.errores.ubicacion = 'Seleccione una ubicación';
    esValido = false;
  }

  // Mostrar errores en la consola si hay alguno
  console.log('Errores en el formulario:', this.errores);
  return esValido;
}



confirmarEliminarTanda(tanda: Tanda) {
  this.tandaSeleccionada  = {
    id:tanda.id,
    cantidadIngresada:tanda.cantidadIngresada,
    fechaLlegada: tanda.fechaLlegada,
    fechaVencimiento: tanda.fechaVencimiento,
    productoId: tanda.productoId,
    bodega:tanda.bodega,
    ubicacion:tanda.ubicacion
  }
  
  this.mostrarDialogoConfirmacionEliminar = true;
}
eliminarTanda() {
  if (this.tandaSeleccionada) {
    console.log("Se va a eliminar: " + this.tandaSeleccionada);
    // Aquí podrías realizar la lógica de eliminación, por ejemplo, llamando a un servicio
    // Después de eliminar, cierra el diálogo
    this.cerrarDialogoConfirmacionEliminar();
  }
}

cerrarDialogoConfirmacionEliminar() {
  this.mostrarDialogoConfirmacionEliminar = false;
  this.tandaSeleccionada  = {
    id:'',
    cantidadIngresada:0,
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };;
}


abrirDialogoEditarProducto(producto: any) {
  this.productoEditable = { ...producto }; // Clonar el producto seleccionado
  this.mostrarDialogoEditarProducto = true;
}

// Guarda los cambios realizados al producto
guardarCambiosProducto(): void {
  if (!this.productoEditable.nombre || !this.productoEditable.id) {
    alert("El nombre y el ID del producto son obligatorios.");
    return;
  }

  const formData = new FormData();
  formData.append('nombre', this.productoEditable.nombre);
  formData.append('descripcion', this.productoEditable.descripcion || '');

  if (this.imagenSeleccionada) {
    formData.append('newProductImage', this.imagenSeleccionada, this.imagenSeleccionada.name);
  }

  const url = `http://34.176.26.41/api/inventario/productos/${this.productoEditable.id}/update`;
  this.http.patch(url, formData).subscribe(
    response => {
      console.log("Producto actualizado:", response);
      alert("Producto actualizado exitosamente.");
      this.cerrarDialogoEditarProducto();
      this.actualizarProductosPaginadosFiltrados();
    },
    error => {
      console.error("Error al actualizar el producto:", error);
      alert("Error al actualizar el producto.");
    }
  );
}

// Cierra el diálogo sin guardar cambios
cerrarDialogoEditarProducto() {
  this.mostrarDialogoEditarProducto = false;
}

// Maneja la carga de archivos de imagen (opcional, si quieres permitir cambios de imagen)
getTotalTandasFiltradas(): number {
  return this.productosFiltrados.reduce((total, producto) => {
    // Asegurarte de contar solo las tandas con cantidad mayor a 0 si es necesario
    const tandasFiltradas = (producto.tandas || []).filter(tanda => tanda.cantidadActual > 0);
    return total + tandasFiltradas.length;
  }, 0);
}
onBodegaChange(event: Event): void {
  const nombreBodegaSeleccionada = (event.target as HTMLSelectElement).value;
  const bodegaSeleccionada = this.bodegaLista.find(bodega => bodega.nombre === nombreBodegaSeleccionada);

  if (bodegaSeleccionada) {
    const idBodega = bodegaSeleccionada.id;
    this.nuevaTanda.bodega = idBodega; // Guarda el id de la bodega seleccionada en nuevaTanda.bodega

    // Llama al servicio para obtener las ubicaciones por bodega
    this.socketService.getUbicacionesByBodega(idBodega);

    // Actualiza ubicacionListado con las ubicaciones obtenidas
    this.socketService.loadUbicacionesByBodega(idBodega).subscribe(ubicaciones => {
      this.ubicacionListado = ubicaciones.map((ubicacion: any) => ({
        id: ubicacion.id,
        descripcion: ubicacion.descripcion
      }));
    });
  } else {
    this.ubicacionListado = []; // Limpia la lista de ubicaciones si no hay bodega seleccionada
    this.nuevaTanda.bodega = ""; // Opcional: Limpia el id de la bodega si no hay selección
  }
}





// Método para cargar las bodegas disponibles desde el servicio de socket
cargarBodegas(): void {
  this.socketService.getAllBodegas(); // Emite el evento para solicitar bodegas

  this.socketService.loadAllBodegas().subscribe((bodegas: any[]) => {
    console.log("Bodegas cargadas:", bodegas);
    
    // Asegúrate de que bodegas sean objetos con { id, nombre, etc. }
    this.bodegaOpciones = bodegas.map(bodega => ({ id: bodega.id, nombre: bodega.nombre }));
    this.bodegaLista = bodegas;
  });
}

}
