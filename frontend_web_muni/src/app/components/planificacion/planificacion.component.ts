import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tanda } from '../../models/tanda.model';
import { DialogModule } from 'primeng/dialog'; 
import { Subscription } from 'rxjs';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmationService, MessageService, PrimeNGConfig } from 'primeng/api';
import { EnviarService } from '../../services/enviar.service';
import { Detalle, DiaPlanificacion, DiasPlanificacion } from '../../models/dia-envio.model';
import { TokenService } from '../../services/auth-token.service';
import { DataViewModule } from 'primeng/dataview';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SocketInventarioService } from '../../services/Sockets/socket-inventario.service';
import { PlanificacionSocketService } from '../../services/Sockets/planificacion.socket.service';

interface Producto {
  id: string;
  nombre: string;
  urlImagen:string;
  cantidadPlanificada:number;
}


@Component({
  selector: 'app-planificacion',
  standalone: true,
  templateUrl: './planificacion.component.html',
  providers: [ConfirmationService, MessageService],
  styleUrls: ['./planificacion.component.scss'],
  imports: [CommonModule, FormsModule, DialogModule,CalendarModule,DataViewModule,ToastModule,ConfirmDialogModule]
})
export class PlanificacionComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrado:Producto[] = [];
  productosPorDia: { [key: string]: Set<Producto> } = {
    lunes: new Set<Producto>(),
    martes: new Set<Producto>(),
    miercoles: new Set<Producto>(),
    jueves: new Set<Producto>(),
    viernes: new Set<Producto>()
};


  searchTerm: string = '';
  displayDialog: boolean = false;
  selectedProducto?: Producto;
  cantidadAsignada: number = 0;
  currentWeek: number = 0; 
  fechasSemana: { [key: string]: string } = {};
  productoDetailsDialogVisible: boolean = false;
  selectedDate: Date = new Date(); 
  planificacion: any;
  
  
  
  private productSubscription: Subscription = new Subscription();
  private planificacionSubscription: Subscription = new Subscription();

  constructor(
    private socketInventarioService: SocketInventarioService, 
    private planificacionSocketService: PlanificacionSocketService,
    private primengConfig: PrimeNGConfig,
    private enviarService: EnviarService,
    private tokenService: TokenService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
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
      this.planificacionSocketService.onLoadPlanificacion().subscribe((data: any) => {
        this.asignarProductosPorDia(data)
      }, (error: any) => {
        console.error('Error al cargar planificación:', error);
      })
    );
    this.resetData(); // Limpia los datos
    this.updateWeekDates(); 
    this.logWeekDates();
    this.loadProductos(); // Carga los productos
    this.productosFiltrado = [...this.productos];
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
        this.socketInventarioService.loadAllProductos().subscribe((productos: Producto[]) => {
            this.productos = productos;
            this.productosFiltrado = [...this.productos]; // Inicializa productosFiltrado aquí
        }, (error: any) => {
            console.error('Error al cargar productos:', error);
        })
    );
}


  private asignarProductosPorDia(planificacion: any[]) {
    //console.log("Planificación:", JSON.stringify(planificacion, null, 2));

    // Limpiar los datos de productosPorDia antes de asignar nuevos productos
    this.productosPorDia = {
        lunes: new Set<Producto>(),
        martes: new Set<Producto>(),
        miercoles: new Set<Producto>(),
        jueves: new Set<Producto>(),
        viernes: new Set<Producto>()
    };

    // Recorremos cada elemento de la planificación
    planificacion.forEach((plan: any) => {
        const fechaProducto = new Date(plan.fecha + 'T00:00:00');
        const diaSemana = fechaProducto.getDay(); // Obtener el día de la semana (0 = domingo, 1 = lunes, ...)

        let dia: string;

        // Mapear el número de día a un nombre de día de la semana
        switch (diaSemana) {
            case 1: dia = 'lunes'; break;
            case 2: dia = 'martes'; break;
            case 3: dia = 'miercoles'; break;
            case 4: dia = 'jueves'; break;
            case 5: dia = 'viernes'; break;
            default: return; // Ignorar fines de semana (0 = domingo)
        }

        // Recorremos los detalles de la planificación
        plan.detalles.forEach((detalle: any) => {
          console.log( typeof(detalle.producto.nombre)==="string")
            // Crear el producto con la información necesaria
            // typeof(detalle.producto.nombre)==="string"?detalle.producto.nombre:(detalle.producto.nombre as any).nombre
            // const {} = detalle;
            const producto: Producto = {
                id: detalle.productoId, // Cambiar a productoId
                // nombre:  typeof(detalle.producto)==="string"?detalle.producto:(detalle.producto as any).nombre, // Asumiendo que el detalle tiene un campo 'producto' 
                nombre: detalle.producto, // Asumiendo que el detalle tiene un campo 'producto'
                urlImagen: detalle.urlImagen, // Incluyendo la URL de la imagen
                cantidadPlanificada: detalle.cantidadPlanificada // Incluyendo la cantidad planificada
            };
            console.log({ producto})
            // Añadir el producto al Set del día correspondiente
            this.productosPorDia[dia].add(producto);
        });
    });
    console.log({productos:this.productosPorDia['lunes']});
    // Log para ver el resultado final de productosPorDia
    console.log("Productos por día:", this.productosPorDia);
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
      const tandas = this.productosPorDia[dia];
      if (fecha) {
        const diaPlanificacion: DiaPlanificacion = {
          fecha: fecha,
          detalles: [],
        };
        if (tandas.size > 0) {
          tandas.forEach((producto: Producto) => {
            const detalle: Detalle = {
              productoId: producto.id,
              cantidadPlanificada: 10, // Aquí la cantidad planificada
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
      accept: () => {
        this.guardarProductos();
        setTimeout(() => {
        }, 1000); // 1000 milisegundos = 1 segundo
        
        
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'No se guardó la planificación' });
      }
    });
    
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
    event.dataTransfer?.setData('text', (event.target as HTMLElement).id);
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
  const data = event.dataTransfer?.getData('text');
  const productoElement = document.getElementById(data ?? '');

  if (productoElement) {
    const producto = this.productos.find(t => t.id === data);
    
    if (producto && !this.productosPorDia[dia].has(producto)) { // Verifica si ya está asignada
      // Agregar la tanda al día correspondiente
      this.productosPorDia[dia].add(producto);
      
      // Cambiar las clases
      productoElement.classList.add('tanda-en-dia');
      productoElement.classList.add(`tanda-en-${dia}`);  // Clase específica para el día
      productoElement.classList.remove('tanda-en-lista');
    }
  }
}


// Para quitar de un día, usamos delete para el Set
quitarDeDia(producto: Producto, dia: string) {
    // Remover la tanda del día correspondiente
    this.productosPorDia[dia].delete(producto);
  
    // Agregar la tanda de nuevo a la lista filtrada
    this.productosFiltrado.push(producto);
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
}
