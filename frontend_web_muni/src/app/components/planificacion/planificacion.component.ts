import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EnviarService } from '../../services/enviar.service';
import { Detalle, DiaPlanificacion, DiasPlanificacion } from '../../models/dia-envio.model';
import { TokenService } from '../../services/auth-token.service';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { PlanificacionSocketService } from '../../services/Sockets/planificacion.socket.service';
import { EnviosComponent } from "../envios/envios.component";
import { ButtonModule } from 'primeng/button'; // Para los botones de navegación y el botón de guardar
import { PanelModule } from 'primeng/panel'; // Para el encabezado de panel "Planificación Semanal"
import { CardModule } from 'primeng/card'; // Para los contenedores de productos y días de la semana
import { CalendarModule } from 'primeng/calendar'; // Para el selector de fecha en "Buscar por día"
import { InputTextModule } from 'primeng/inputtext'; // Para el campo de búsqueda de productos
import { ChipModule } from 'primeng/chip'; // Para mostrar los productos en chips
import { MessageModule } from 'primeng/message'; // Para mensajes de no coincidencias y no hay productos asignados
import { ToastModule } from 'primeng/toast'; // Para mensajes de confirmación y notificaciones
import { ConfirmDialogModule } from 'primeng/confirmdialog'; 
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService, PrimeNGConfig } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { Tanda } from '../../models/tanda.model';




interface Producto {
  id: string;
  nombre: string;
  barcode: null;
  descripcion: string;
  urlImagen: string;
  stock?:number;
  tandas?: Tanda[];
  cantidadPlanificada?:number;
}


@Component({
  selector: 'app-planificacion',
  standalone: true,
  templateUrl: './planificacion.component.html',
  providers: [ConfirmationService, MessageService,ReactiveFormsModule, MultiSelectModule],
  styleUrls: ['./planificacion.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    CalendarModule,
    ToastModule,
    ConfirmDialogModule,
    EnviosComponent,
    ButtonModule,
    PanelModule,
    CardModule,
    ChipModule,
    MessageModule,
    DividerModule,
    
    

  ]
})
export class PlanificacionComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrado:Producto[] = [];
  productosPorDia: { [key: string]: Set<Producto> } = {
    lunes: new Set<Producto>(),
    martes: new Set<Producto>(),
    miercoles: new Set<Producto>(),
    jueves: new Set<Producto>(),
    viernes: new Set<Producto>()};


  searchTerm: string = '';
  displayDialog: boolean = false;
  selectedProducto?: Producto;
  cantidadAsignada: number = 0;
  currentWeek: number = 0; 
  fechasSemana: { [key: string]: string } = {};
  productoDetailsDialogVisible: boolean = false;
  selectedDate: Date = new Date(); 
  planificacion: any;
  
  
  
  @ViewChild(EnviosComponent) enviosComponent!: EnviosComponent;
  
  private productSubscription: Subscription = new Subscription();
  private planificacionSubscription: Subscription = new Subscription();

  constructor(
    private socketInventarioService: SocketInventarioService, 
    private planificacionSocketService: PlanificacionSocketService,
    private primengConfig: PrimeNGConfig,
    private enviarService: EnviarService,
    private tokenService: TokenService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.primengConfig.setTranslation({
      dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
      dayNamesMin: ["D", "L", "Ma", "Mi", "J", "V", "S"],
      monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
      firstDayOfWeek: 1,
      today: 'Hoy',
      clear: 'Limpiar'
    });
  
    this.planificacionSubscription.add(
      this.planificacionSocketService.onLoadPlanificacion().subscribe(
        (data: any) => this.asignarProductosPorDia(data),
        (error: any) => console.error('Error al cargar planificación:', error)
      )
    );
  
    this.resetData(); // Limpia los datos
    this.updateWeekDates(); 
    this.logWeekDates();
    this.loadProductos(); // Carga los productos
    this.productosFiltrado = [...this.productos];
  
    // Suscripciones para recibir cambios en tiempo real
    this.subscribeToRealTimeUpdates();
  }
  

  ngOnDestroy() {
    this.productSubscription.unsubscribe(); // Limpia las suscripciones
    this.planificacionSubscription.unsubscribe();
  }

  private resetData() {
    this.productos = [];
  }

  
  
  private loadProductos() {
    this.socketInventarioService.getAllProductos();
  
    this.productSubscription.add(
      this.socketInventarioService.loadAllProductos().subscribe(
        (productos: Producto[]) => {
          // Inicializa los productos y asegura que `tandas` esté como un array vacío en cada producto
          this.productos = productos.map(producto => ({
            ...producto,
            tandas: producto.tandas || [] // Inicializa `tandas` como un array vacío si no está definida
          }));
  
          // Contador para verificar cuándo todas las tandas se han cargado
          let tandasCargadas = 0;
  
          // Para cada producto, cargar sus tandas y mostrarlas en consola
          this.productos.forEach(producto => {
            // Emitir evento para obtener tandas del producto
            this.socketInventarioService.getTandasByProductoId(producto.id);
  
            // Suscribirse al evento para recibir las tandas de cada producto
            this.socketInventarioService.onLoadTandasByProductoId(producto.id).subscribe(
              (tandas: Tanda[]) => {
                producto.tandas = tandas;
  
                // Incrementar el contador cada vez que se carguen las tandas de un producto
                tandasCargadas++;
  
                // Verificar si todas las tandas han sido cargadas
                if (tandasCargadas === this.productos.length) {
                  // Ordenar productos por la fecha de vencimiento más próxima de sus tandas
                  this.productosFiltrado = this.productos.sort((a, b) => {
                    const fechaVencimientoA = (a.tandas && a.tandas.length > 0) 
                      ? Math.min(...a.tandas
                          .filter(t => t.fechaVencimiento) // Filtrar tandas con fecha válida
                          .map(t => new Date(t.fechaVencimiento).getTime())
                        )
                      : Infinity;
                    const fechaVencimientoB = (b.tandas && b.tandas.length > 0) 
                      ? Math.min(...b.tandas
                          .filter(t => t.fechaVencimiento) // Filtrar tandas con fecha válida
                          .map(t => new Date(t.fechaVencimiento).getTime())
                        )
                      : Infinity;
                    
                    return fechaVencimientoA - fechaVencimientoB;
                  });
  
                }
              },
              (error: any) => {
                console.error(`Error al cargar tandas del producto ${producto.nombre}:`, error);
              }
            );
          });
        },
        (error: any) => {
          console.error('Error al cargar productos:', error);
        }
      )
    );
  }
  
  
  // En el componente TypeScript
  getExpiryClass(producto: Producto): string {
    const today = new Date().getTime();
    const nearestExpiry = this.getNearestExpiry(producto);
    
    if (nearestExpiry === Infinity) return 'null';

    const daysUntilExpiry = Math.ceil((nearestExpiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'vencido';
    if (daysUntilExpiry <= 2) return 'porvencer1';
    if (daysUntilExpiry <= 7) return 'porvencer2';
    return 'seguro';
  }


  private asignarProductosPorDia(planificacion: any[]) {
    console.log("Planificación:", JSON.stringify(planificacion, null, 2));
  
    // Limpiar los datos de productosPorDia antes de asignar nuevos productos
    this.productosPorDia = {
      lunes: new Set<Producto>(),
      martes: new Set<Producto>(),
      miercoles: new Set<Producto>(),
      jueves: new Set<Producto>(),
      viernes: new Set<Producto>(),
    };
  
    // Recorrer cada elemento de la planificación
    planificacion.forEach((plan: any) => {
      const fechaProducto = new Date(plan.fecha + 'T00:00:00');
      const diaSemana = fechaProducto.getDay(); // Obtener el día de la semana (0 = domingo, 1 = lunes, ...)
  
      let dia: string;
  
      // Mapear el número de día a un nombre de día de la semana
      switch (diaSemana) {
        case 1:
          dia = 'lunes';
          break;
        case 2:
          dia = 'martes';
          break;
        case 3:
          dia = 'miercoles';
          break;
        case 4:
          dia = 'jueves';
          break;
        case 5:
          dia = 'viernes';
          break;
        default:
          return; // Ignorar fines de semana (0 = domingo)
      }
  
      // Recorremos los detalles de la planificación
      plan.detalles.forEach((detalle: any) => {
        const producto: Producto = {
          id: detalle.productoId,
          nombre: typeof detalle.producto === 'string' ? detalle.producto : detalle.producto.nombre,
          urlImagen: detalle.urlImagen,
          cantidadPlanificada: detalle.cantidadPlanificada,
          barcode: null,
          descripcion: '',
        };
  
        // Validar que el producto no esté ya en el día antes de agregarlo
        if (!Array.from(this.productosPorDia[dia]).some((p) => p.id === producto.id)) {
          this.productosPorDia[dia].add(producto);
        }
      });
    });
  
    console.log("Productos por día:", this.productosPorDia);
    this.cdr.detectChanges();
  }
  



filterProductos() {
  if (!this.searchTerm) {
    this.productosFiltrado = [...this.productos]; // Si no hay término de búsqueda, mostrar todos
  } else {
    this.productosFiltrado = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}

  


  
  


  private limpiarTandasPorDia() {
    // Reiniciar el objeto tandasPorDia a su estado inicial
    this.productosPorDia = {
      lunes: new Set<Producto>(),
      martes: new Set<Producto>(),
      miercoles: new Set<Producto>(),
      jueves: new Set<Producto>(),
      viernes: new Set<Producto>(),
    };
  }
  

  guardarProductos() {
    const diasPlanificacion: DiasPlanificacion = { dias: [] };
    const diasDeLaSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  
    // Llenar los días de planificación
    for (const dia of diasDeLaSemana) {
      const fecha = this.fechasSemana[dia];
      const productos = this.productosPorDia[dia];
      if (fecha) {
        const diaPlanificacion: DiaPlanificacion = {
          fecha: fecha,
          detalles: [],
        };
        if (productos.size > 0) {
          productos.forEach((producto: Producto) => {
            const detalle: Detalle = {
              productoId: producto.id, // Incluye solo las propiedades esperadas
              cantidadPlanificada: producto.cantidadPlanificada || 0 // Usar la cantidad planificada
            };
            diaPlanificacion.detalles.push(detalle);
          });
        }
        diasPlanificacion.dias.push(diaPlanificacion);
      }
    }
  
    const token = this.tokenService.getToken();
  
    this.enviarService.setPlanificacion(token!, diasPlanificacion).subscribe(
      (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Planificación guardada con éxito.' });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la planificación.' });
        console.error('Error al guardar planificación:', error);
      }
    );
  }
  
  
  confirm() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas guardar la planificación?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí', // Etiqueta para el botón de aceptación
      rejectLabel: 'No', // Etiqueta para el botón de rechazo
      acceptButtonStyleClass: 'p-button-yes', // Clase CSS para el botón de aceptación
      rejectButtonStyleClass: 'p-button-danger p-button-outlined p-button-rounded', // Botón rojo solo con borde y bordes redondeados
      accept: () => {
        this.guardarProductos();
        setTimeout(() => {}, 1000);
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'No se guardó la planificación'
        });
      }
      
    });
    this.cdr.detectChanges();
  }

  


  

  showProductoDetails(producto: Producto) {
    this.selectedProducto = producto;
    this.displayDialog = true;
    this.cantidadAsignada = 10;
    
  }
  showProductoDisponible(producto: Producto) {
    this.selectedProducto = producto; // Asignar la tanda seleccionada
    this.productoDetailsDialogVisible = true; // Mostrar el nuevo diálogo
  }


  closeDialog() {
    this.displayDialog = false;
  }
  closeProductoDetailsDialog() {
    this.productoDetailsDialogVisible = false; // Cerrar el diálogo
    this.selectedProducto = undefined; // Limpiar la tanda seleccionada
  }

  

  
  
  allowDrop(event: DragEvent) {
    event.preventDefault();
  }
  
  drag(event: DragEvent) {
    const id = (event.target as HTMLElement).id;
    event.dataTransfer?.setData('text', id);
  }
  
  // Cambiar el método dropToMainList para evitar eliminar de productosFiltrado
dropToMainList(event: DragEvent) {
  event.preventDefault();
  const data = event.dataTransfer?.getData('text');
  const productoElement = document.getElementById(data ?? '');

  if (productoElement) {
    const producto = this.productos.find(t => t.id === data);
    
    if (producto) {
      // Cambiar las clases
      productoElement.classList.remove('producto-en-dia');
      productoElement.classList.add('producto-en-lista');

      // Añadir el elemento de nuevo a la lista principal
      const productosContainer = document.getElementById('productos');
      if (productosContainer) {
        productosContainer.appendChild(productoElement);
      }
    }
  }
}

// Cambiar el método drop para evitar duplicados en productosPorDia
drop(event: DragEvent, dia: string) {
  event.preventDefault();
  const productoId = event.dataTransfer?.getData('text'); // Obtener el ID del producto desde el drag
  const producto = this.productosFiltrado.find(p => p.id === productoId); // Buscar el producto en la lista

  if (producto) {
    // Verificar si ya existe un producto del mismo tipo (basado en `nombre` u otro criterio)
    const existeProductoDelMismoTipo = Array.from(this.productosPorDia[dia]).some(
      (p) => p.nombre === producto.nombre // Aquí puedes usar `nombre` u otra propiedad relevante
    );

    if (existeProductoDelMismoTipo) {
      // Mostrar un mensaje de advertencia si ya existe un producto del mismo tipo
      this.messageService.add({
        severity: 'warn',
        summary: 'Producto duplicado',
        detail: `El producto del tipo "${producto.nombre}" ya está planificado para ${dia}.`
      });
      return; // Salir sin agregar el producto
    }

    // Si no está duplicado, agregar el producto al día
    this.productosPorDia[dia].add(producto);
  }
}




// Para quitar de un día, usamos delete para el Set
quitarDeDia(producto: Producto, dia: string) {
  // Eliminar el producto del día específico
  this.productosPorDia[dia].delete(producto);
}

private getNearestExpiry(producto: Producto): number {
  return producto.tandas?.reduce((nearest, tanda) => {
    const fechaVencimiento = new Date(tanda.fechaVencimiento).getTime();
    return fechaVencimiento < nearest ? fechaVencimiento : nearest;
  }, Infinity) || Infinity;
}



  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0'); // Asegurar que el día tiene 2 dígitos
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Asegurar que el mes tiene 2 dígitos
    const year = date.getFullYear(); // Obtener el año completo
    return `${year}-${month}-${day}`; // Formato yyyy-mm-dd
  }

  formatDateString(date: string): string {
    // Utiliza una conversión controlada para evitar problemas de zona horaria
    const parsedDate = new Date(`${date}T00:00:00`); // Asegura que la fecha sea tratada como UTC
    const year = parsedDate.getFullYear();
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  


  nextWeek() {
    this.limpiarTandasPorDia();
    this.currentWeek++;
    this.updateWeekDates();
    this.logWeekDates();
  }

  prevWeek() {
    this.limpiarTandasPorDia();
    this.currentWeek--;
    this.updateWeekDates();
    this.logWeekDates();
  }

  logWeekDates() {
    const lunes = this.fechasSemana['lunes'];
    const viernes = this.fechasSemana['viernes'];
    const lunesFormatted = this.formatDateString(lunes);
    const viernesFormatted = this.formatDateString(viernes);
    this.planificacionSocketService.getPlanificacion(lunesFormatted, viernesFormatted);
  }
  updateWeek() {
    const startOfWeek = this.getStartOfWeek(this.selectedDate); // Obtener el lunes de la semana de selectedDate
  
    // Asignar las fechas de lunes a viernes
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.fechasSemana[this.diaDeLaSemana(i)] = this.formatDate(date);
    }
  
    // Cargar la planificación para la nueva semana seleccionada
    this.logWeekDates();
  }
  getStartOfWeek(date: Date): Date {
    const day = date.getDay(); // 0: domingo, 1: lunes, ..., 6: sábado
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajusta si es domingo
    return new Date(date.setDate(diff));
  }
  
  
  

  updateWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Domingo es 0, Lunes es 1, ..., Sábado es 6
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1) + this.currentWeek * 7); // Calcular el lunes de la semana actual
  
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      this.fechasSemana[this.diaDeLaSemana(i)] = this.formatDate(date);
    }
  }
  

  diaDeLaSemana(i: number): string {
    switch (i) {
      case 0: return 'lunes';
      case 1: return 'martes';
      case 2: return 'miercoles';
      case 3: return 'jueves';
      case 4: return 'viernes';
      default: return '';
    }
  }

  private subscribeToRealTimeUpdates() {
    // Suscribirse al evento de creación de una nueva tanda
    this.productSubscription.add(
      this.socketInventarioService.listenNewTandaCreated().subscribe(tanda => this.updateProductoTanda(tanda))
    );
  
    // Suscribirse al evento de actualización de una tanda existente
    this.productSubscription.add(
      this.socketInventarioService.listenNewTandaUpdate().subscribe(tanda => this.updateProductoTanda(tanda))
    );
  
    // Suscribirse al evento de cambio de stock del producto
    this.productSubscription.add(
      this.socketInventarioService.listenStockProductoChange().subscribe(change => this.updateStockProducto(change))
    );
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
  
    // Actualizar la lista de productos filtrados
    this.productosFiltrado = [...this.productos];
    this.cdr.detectChanges();
  }
  
  private updateStockProducto(change: any) {
    this.productos = this.productos.map(prod => {
      if (prod.id === change.productoId) {
        return { ...prod, stock: change.nuevoStock };
      }
      return prod;
    });
  
    // Actualizar la lista de productos filtrados
    this.productosFiltrado = [...this.productos];
    this.cdr.detectChanges();
  }
  
}
