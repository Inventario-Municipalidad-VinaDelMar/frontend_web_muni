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



  tandaSeleccionada: Tanda | null = null; 
  esEdicion: boolean = false;
  dialogLabel: string = 'Añadir Tanda'; 
  bodegaOpciones: string[] = [];
  ubicacionOpciones: string[] = [];
  productoOpciones: { id: string; nombre: string }[] = [];


  nuevoProducto = {
    nombre: '',
    descripcion: '',
    urlImagen: ''
  };

  nuevaTanda: Tanda = {
    id: '',                // Identificador único de la tanda (debes asignarle un valor en algún momento)
    productoId: '',        // ID del producto al que pertenece la tanda
    cantidadIngresada: 0,  // Cantidad ingresada en la tanda
    cantidadActual: 0,     // Cantidad actual disponible en la tanda
    fechaLlegada: '',      // Fecha de llegada de la tanda
    fechaVencimiento: '',  // Fecha de vencimiento de la tanda
    producto: '',          // Nombre del producto (puedes asignarlo al seleccionar el producto en el select)
    bodega: '',            // Bodega en la que se almacena la tanda
    ubicacion: '',         // Ubicación de la tanda dentro de la bodega
    esMerma: false         // Indica si es merma o no
  };

  errores = {
    cantidadIngresada: '',
    cantidadActual: '',
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };
  

  selectedFile: File | null = null;


  constructor(
    private socketService: SocketInventarioService,
    private messageService: MessageService,
    
  ) {this.generarOpciones();}

  ngOnInit() {
    const startTime = new Date().getTime();
    
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
            this.productos = productos;
            this.productos2 = productos;
            this.isLoading = false;
            this.hasError = false;
  
            // Inicializa el contador para verificar cuántos productos han cargado sus tandas
            let productosConTandasCargadas = 0;
  
            // Cargar tandas para cada producto
            productos.forEach(producto => {
              this.loadTandasForProducto(producto.id, () => {
                productosConTandasCargadas++;
                // Verifica si todos los productos han cargado sus tandas
                if (productosConTandasCargadas === productos.length) {
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
        // Actualizar y ordenar las tandas por fecha de vencimiento
        const tandas = (prod.tandas || []).filter(t => t.id !== tanda.id).concat(tanda);
        tandas.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
        
        return { ...prod, tandas };
      }
      return prod;
    });
    this.productos2 = [...this.productos];
    this.actualizarAlertas();
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

addProduct() {
    try {
      // Crear un nuevo objeto Producto basado en los datos del formulario
      const nuevoProducto: Producto = {
        id: (Math.random() * 1000000).toFixed(0), // Genera un ID temporal único para el producto
        nombre: this.nuevoProducto.nombre,
        barcode: null,
        descripcion: this.nuevoProducto.descripcion,
        urlImagen: this.nuevoProducto.urlImagen,
        stock: 0,
        tandas: [],
        cantidadPlanificada: 0
      };

      // Agregar el producto a los arrays de productos
      this.productos.push(nuevoProducto);
      this.actualizarProductosPaginados();

      // Mostrar mensaje de éxito
      this.messageService.add({
        severity: 'success',
        summary: 'Producto Creado',
        detail: 'El producto se ha añadido correctamente',
        life: 3000 // El mensaje desaparecerá después de 3 segundos
      });

      // Limpiar el formulario y cerrar el diálogo
      this.mostrarDialogo = false;
      this.nuevoProducto = { nombre: '', descripcion: '', urlImagen: '' };
      this.selectedFile = null;
    } catch (error) {
      // Mostrar mensaje de error si algo falla
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo añadir el producto. Intente de nuevo.',
        life: 3000
      });
    }
  }



onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}


abrirDialogoTanda() {
  this.esEdicion = false;
  this.dialogLabel = 'Añadir Tanda'; // Cambia el label del botón al modo añadir
  this.limpiarFormularioTanda();
  this.mostrarDialogo3 = true;
}


editarTanda(tanda: Tanda) {
  this.esEdicion = true;
  this.dialogLabel = 'Guardar Cambios'; // Cambia el label del botón al modo edición
  this.nuevaTanda = { ...tanda }; // Cargar los datos de la tanda en el formulario
  this.mostrarDialogo3 = true;
}


cerrarDialogoTanda() {
  this.mostrarDialogo3 = false;
  this.esEdicion = false;
  this.dialogLabel = 'Añadir Tanda'; // Restablece el label para el siguiente uso
  this.limpiarFormularioTanda();
}
addTanda() {
  // Primero ejecuta las validaciones en el formulario
  if (this.validarFormulario()) {
    // Si el formulario es válido, procede a crear la nueva tanda
    const nuevaTanda: Tanda = {
      id: (Math.random() * 1000000).toFixed(0), // Genera un ID aleatorio temporal para la tanda
      productoId: this.nuevaTanda.productoId,
      cantidadIngresada: this.nuevaTanda.cantidadIngresada,
      cantidadActual: this.nuevaTanda.cantidadActual,
      fechaLlegada: this.nuevaTanda.fechaLlegada,
      fechaVencimiento: this.nuevaTanda.fechaVencimiento,
      producto: this.obtenerNombreProducto(this.nuevaTanda.productoId), // Nombre del producto asociado
      bodega: this.nuevaTanda.bodega,
      ubicacion: this.nuevaTanda.ubicacion,
      esMerma: this.nuevaTanda.esMerma
    };

    // Aquí puedes agregar la lógica para añadir esta tanda a un producto específico si lo deseas.
    // Ejemplo: this.productos.find(p => p.id === nuevaTanda.productoId)?.tandas?.push(nuevaTanda);

    // Mostrar mensaje de éxito
    this.messageService.add({
      severity: 'success',
      summary: 'Tanda Creada',
      detail: 'La tanda se ha añadido correctamente',
      life: 3000
    });

    // Cierra el diálogo y reinicia el formulario
    this.cerrarDialogoTanda();
  } else {
    // Si la validación falla, muestra un mensaje de error general
    this.messageService.add({
      severity: 'error',
      summary: 'Error en el Formulario',
      detail: 'Por favor, corrige los errores en el formulario antes de continuar',
      life: 3000
    });
  }
}

// Método auxiliar para obtener el nombre del producto a partir de su ID
obtenerNombreProducto(productoId: string): string {
  const producto = this.productoOpciones.find(p => p.id === productoId);
  return producto ? producto.nombre : '';
}

limpiarFormularioTanda() {
  this.nuevaTanda = {
    id: '',                // Identificador único de la tanda (debes asignarle un valor en algún momento)
    productoId: '',        // ID del producto al que pertenece la tanda
    cantidadIngresada: 0,  // Cantidad ingresada en la tanda
    cantidadActual: 0,     // Cantidad actual disponible en la tanda
    fechaLlegada: '',      // Fecha de llegada de la tanda
    fechaVencimiento: '',  // Fecha de vencimiento de la tanda
    producto: '',          // Nombre del producto (puedes asignarlo al seleccionar el producto en el select)
    bodega: '',            // Bodega en la que se almacena la tanda
    ubicacion: '',         // Ubicación de la tanda dentro de la bodega
    esMerma: false 
  };
}


guardarCambiosTanda() {
  if (this.tandaSeleccionada) {
    // Actualizar los valores de la tanda seleccionada
    this.tandaSeleccionada.cantidadIngresada = this.nuevaTanda.cantidadIngresada;
    this.tandaSeleccionada.cantidadActual = this.nuevaTanda.cantidadActual;
    this.tandaSeleccionada.fechaLlegada = this.nuevaTanda.fechaLlegada;
    this.tandaSeleccionada.fechaVencimiento = this.nuevaTanda.fechaVencimiento;
    this.tandaSeleccionada.bodega = this.nuevaTanda.bodega;
    this.tandaSeleccionada.ubicacion = this.nuevaTanda.ubicacion;
    this.tandaSeleccionada.esMerma = this.nuevaTanda.esMerma;

    this.messageService.add({
      severity: 'success',
      summary: 'Tanda Actualizada',
      detail: 'La tanda se ha actualizado correctamente',
      life: 3000
    });

    this.cerrarDialogoTanda();
  }
}

generarOpciones() {
  const bodegaSet = new Set<string>();
  const ubicacionSet = new Set<string>();

  this.productos.forEach(producto => {
    this.productoOpciones.push({ id: producto.id, nombre: producto.nombre });

    producto.tandas?.forEach(tanda => {
      if (tanda.bodega) bodegaSet.add(tanda.bodega);
      if (tanda.ubicacion) ubicacionSet.add(tanda.ubicacion);
    });
  });

  this.bodegaOpciones = Array.from(bodegaSet);
  this.ubicacionOpciones = Array.from(ubicacionSet);
}

validarFormulario(): boolean {
  let esValido = true;
  const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato 'yyyy-mm-dd'

  // Resetear mensajes de error
  this.errores = {
    cantidadIngresada: '',
    cantidadActual: '',
    fechaLlegada: '',
    fechaVencimiento: '',
    productoId: '',
    bodega: '',
    ubicacion: ''
  };

  // Validaciones específicas
  if (!this.nuevaTanda.cantidadIngresada || this.nuevaTanda.cantidadIngresada <= 0) {
    this.errores.cantidadIngresada = 'La cantidad ingresada debe ser mayor que 0';
    esValido = false;
  }

  if (!this.nuevaTanda.cantidadActual || this.nuevaTanda.cantidadActual < 0) {
    this.errores.cantidadActual = 'La cantidad actual no puede ser negativa';
    esValido = false;
  }

  if (!this.nuevaTanda.fechaLlegada) {
    this.errores.fechaLlegada = 'La fecha de llegada es obligatoria';
    esValido = false;
  }

  if (!this.nuevaTanda.fechaVencimiento) {
    this.errores.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
    esValido = false;
  } else if (this.nuevaTanda.fechaVencimiento < hoy) {
    this.errores.fechaVencimiento = 'La fecha de vencimiento no puede ser anterior a hoy';
    esValido = false;
  }

  if (!this.nuevaTanda.productoId) {
    this.errores.productoId = 'Seleccione un producto';
    esValido = false;
  }

  if (!this.nuevaTanda.bodega) {
    this.errores.bodega = 'Seleccione una bodega';
    esValido = false;
  }

  if (!this.nuevaTanda.ubicacion) {
    this.errores.ubicacion = 'Seleccione una ubicación';
    esValido = false;
  }

  return esValido;
}


confirmarEliminarTanda(tanda: Tanda) {
  this.tandaSeleccionada = tanda;
  this.mostrarDialogoConfirmacionEliminar = true;
}
eliminarTanda() {
  if (this.tandaSeleccionada) {
    console.log("Se va a eliminar: " + this.tandaSeleccionada.id);
    // Aquí podrías realizar la lógica de eliminación, por ejemplo, llamando a un servicio
    // Después de eliminar, cierra el diálogo
    this.cerrarDialogoConfirmacionEliminar();
  }
}

cerrarDialogoConfirmacionEliminar() {
  this.mostrarDialogoConfirmacionEliminar = false;
  this.tandaSeleccionada = null;
}


abrirDialogoEditarProducto(producto: any) {
  this.productoEditable = { ...producto }; // Clonar el producto seleccionado
  this.mostrarDialogoEditarProducto = true;
}

// Guarda los cambios realizados al producto
guardarCambiosProducto() {
  // Aquí puedes realizar la lógica para guardar los cambios en el producto,
  // como enviar los datos a la API o actualizar el estado local
  console.log('Guardando cambios del producto:', this.productoEditable);
  this.cerrarDialogoEditarProducto();
}

// Cierra el diálogo sin guardar cambios
cerrarDialogoEditarProducto() {
  this.mostrarDialogoEditarProducto = false;
}

// Maneja la carga de archivos de imagen (opcional, si quieres permitir cambios de imagen)


}
