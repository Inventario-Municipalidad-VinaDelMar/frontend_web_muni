import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketInventarioService } from '../../services/socket-inventario.service';
import { Tanda } from '../../models/tanda.model';
import { DialogModule } from 'primeng/dialog'; 
import { PlanificacionSocketService } from '../../services/planificacion.socket.service';
import { Subscription } from 'rxjs';
import { CalendarModule } from 'primeng/calendar';
import { PrimeNGConfig } from 'primeng/api';
import { EnviarService } from '../../services/enviar.service';
import { Detalle, DiaPlanificacion, DiasPlanificacion } from '../../models/dia-envio.model';
import { TokenService } from '../../services/auth-token.service';

interface Producto {
  id: string;
  nombre: string;
}


@Component({
  selector: 'app-planificacion',
  standalone: true,
  templateUrl: './planificacion.component.html',
  styleUrls: ['./planificacion.component.scss'],
  imports: [CommonModule, FormsModule, DialogModule,CalendarModule]
})
export class PlanificacionComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  tandas: Tanda[] = [];
  tandasPorDia: { [key: string]: Set<Tanda> } = {
    lunes: new Set(),
    martes: new Set(),
    miercoles: new Set(),
    jueves: new Set(),
    viernes: new Set(),
  };
  tandasFiltradas: Tanda[] = [];
  searchTerm: string = '';
  displayDialog: boolean = false;
  selectedTanda?: Tanda;
  cantidadAsignada: number = 0;
  currentWeek: number = 0; 
  fechasSemana: { [key: string]: string } = {};
  tandaDetailsDialogVisible: boolean = false;
  selectedDate: Date = new Date(); 
  
  
  
  private productSubscription: Subscription = new Subscription();
  private planificacionSubscription: Subscription = new Subscription();

  constructor(
    private socketInventarioService: SocketInventarioService, 
    private planificacionSocketService: PlanificacionSocketService,
    private primengConfig: PrimeNGConfig,
    private enviarService: EnviarService,
    private tokenService: TokenService
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
        this.asignarTandasPorDia(data);
      }, (error: any) => {
        console.error('Error al cargar planificación:', error);
      })
    );
    this.resetData(); // Limpia los datos
    this.updateWeekDates(); 
    this.logWeekDates();
    this.loadProductos(); // Carga los productos
  }

  ngOnDestroy() {
    this.productSubscription.unsubscribe(); // Limpia las suscripciones
    this.planificacionSubscription.unsubscribe();
  }

  private resetData() {
    this.productos = [];
    this.tandas = [];
    this.tandasFiltradas = [];
    this.tandasPorDia = {
      lunes: new Set(),
      martes: new Set(),
      miercoles: new Set(),
      jueves: new Set(),
      viernes: new Set(),
    };
  }

  private loadProductos() {
    this.socketInventarioService.getAllProductos();

    this.productSubscription.add(
      this.socketInventarioService.loadAllProductos().subscribe((productos: Producto[]) => {
        this.productos = productos;
        this.loadTandasForProductos();
      }, (error: any) => {
        console.error('Error al cargar productos:', error);
      })
    );
  }

  private asignarTandasPorDia(planificacion: any[]) {
    // Recorremos cada elemento de la planificación
    planificacion.forEach((plan: any) => {
      const fechaTanda = new Date(plan.fecha+ 'T00:00:00');
      const diaSemana = fechaTanda.getDay(); // Obtener el día de la semana (0 = domingo, 1 = lunes, ...)
  
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
         
  
        // Crear la tanda con la información necesaria
        const tanda: Tanda = {
          id: detalle.id,
          productoId: detalle.productoId,
          cantidadIngresada: detalle.cantidadPlanificada, // Puedes cambiar esto según tu lógica
          cantidadActual: detalle.cantidadPlanificada,
          fechaLlegada: plan.fecha, // La fecha de llegada
          fechaVencimiento: this.calcularFechaVencimiento(plan.fecha), // Lógica para calcular la fecha de vencimiento
          producto: detalle.producto, // Nombre del producto
          bodega: '', // Valor predeterminado o lógica para la bodega
          ubicacion: '', // Valor predeterminado o lógica para la ubicación
        };
  
        // Añadir la tanda al Set del día correspondiente
        this.tandasPorDia[dia].add(tanda);
      });
    });
  }
  
  


  private limpiarTandasPorDia() {
    // Reiniciar el objeto tandasPorDia a su estado inicial
    this.tandasPorDia = {
      lunes: new Set<Tanda>(),
      martes: new Set<Tanda>(),
      miercoles: new Set<Tanda>(),
      jueves: new Set<Tanda>(),
      viernes: new Set<Tanda>(),
    };
  }
  
  
  // Función para calcular la fecha de vencimiento (debes implementarla según tu lógica)
  private calcularFechaVencimiento(fechaLlegada: string): string {
    const llegada = new Date(fechaLlegada);
    // Supongamos que la fecha de vencimiento es 30 días después de la llegada
    llegada.setDate(llegada.getDate() + 30);
    return llegada.toISOString().split('T')[0]; // Retorna la fecha en formato YYYY-MM-DD
  }
  

  private loadTandasForProductos() {
    this.productos.forEach(producto => {
      this.socketInventarioService.getTandasByProductoId(producto.id);
      this.productSubscription.add(
        this.socketInventarioService.onLoadTandasByProductoId(producto.id).subscribe((tandas: Tanda[]) => {
          this.tandas = [...this.tandas, ...tandas];
          this.tandasFiltradas = [...this.tandas];  // Actualiza las tandas filtradas
        }, (error: any) => {
          console.error(`Error al cargar tandas para producto ${producto.id}:`, error);
        })
      );
    });
  }
  
  
  guardarTandas() {
    // Crear objeto para almacenar los días
    const diasPlanificacion: DiasPlanificacion = { dias: [] };

    // Iterar sobre los días de la semana
    const diasDeLaSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    for (const dia of diasDeLaSemana) {
        const fecha = this.fechasSemana[dia];
        const tandas = this.tandasPorDia[dia];

        if (fecha) {
            const diaPlanificacion: DiaPlanificacion = {
                fecha: fecha,
                detalles: []
            };

            if (tandas.size > 0) {
                tandas.forEach((tanda: Tanda) => {
                    const detalle: Detalle = {
                        productoId: tanda.productoId,
                        cantidadPlanificada: tanda.cantidadActual,
                    };
                    diaPlanificacion.detalles.push(detalle);
                });
            }

            diasPlanificacion.dias.push(diaPlanificacion);
        }
    }

    console.log('Estructura de días antes de enviar:', JSON.stringify(diasPlanificacion));

    const token = this.tokenService.getToken();
    console.log('Token obtenido:', token);

    // Desconectar el socket antes de enviar
    this.planificacionSocketService.disconnectSocket();

    this.enviarService.setPlanificacion(token!, diasPlanificacion).subscribe(
        response => {
            alert('Planificación guardada con éxito.');
        },
        error => {
            alert('Error al guardar la planificación.');
            console.error('Error Status:', error.status);
            console.error('Error Body:', error.error);
        },
        () => {
            // Reconectar el socket después de completar la operación
            this.planificacionSocketService.connectSocket();
        }
    );
}


  


  
  
  
  
  

  showTandaDetails(tanda: Tanda) {
    this.selectedTanda = tanda;
    this.displayDialog = true;
    this.cantidadAsignada = tanda.cantidadActual;
    
  }
  showTandaDisponible(tanda: Tanda) {
    this.selectedTanda = tanda; // Asignar la tanda seleccionada
    this.tandaDetailsDialogVisible = true; // Mostrar el nuevo diálogo
  }

  guardarCantidadAsignada() {
    if (this.selectedTanda && this.cantidadAsignada > 0 && this.cantidadAsignada <= this.selectedTanda.cantidadActual) {
      const cantidadRestante = this.selectedTanda.cantidadActual - this.cantidadAsignada;

      // Actualizar la tanda asignada al día
      this.selectedTanda.cantidadActual = this.cantidadAsignada;

      // Devolver la cantidad restante al listado principal
      const tandaRestante = { ...this.selectedTanda, cantidadActual: cantidadRestante };

      // Añadir el sobrante al listado si queda cantidad restante
      if (cantidadRestante > 0) {
        this.tandasFiltradas.push(tandaRestante);
      }

      this.displayDialog = false; // Cerrar el diálogo
    } else {
      alert('La cantidad asignada no es válida.');
    }
  }

  closeDialog() {
    this.displayDialog = false;
  }
  closeTandaDetailsDialog() {
    this.tandaDetailsDialogVisible = false; // Cerrar el diálogo
    this.selectedTanda = undefined; // Limpiar la tanda seleccionada
  }

  

  
  
  allowDrop(event: DragEvent) {
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
          this.tandasPorDia[dia].delete(tanda);
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

  drop(event: DragEvent, dia: string) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text');
    const tandaElement = document.getElementById(data ?? '');

    if (tandaElement) {
        const tanda = this.tandas.find(t => t.id === data);
        
        if (tanda && !this.tandasPorDia[dia].has(tanda)) { // Verifica si ya está asignada
            // Agregar la tanda al día correspondiente
            this.tandasPorDia[dia].add(tanda);
            
            // Removerla de la lista de tandas filtradas
            this.tandasFiltradas = this.tandasFiltradas.filter(t => t.id !== tanda.id);

            // Cambiar las clases
            tandaElement.classList.add('tanda-en-dia');
            tandaElement.classList.add(`tanda-en-${dia}`);  // Clase específica para el día
            tandaElement.classList.remove('tanda-en-lista');
        }
    }
}

// Para quitar de un día, usamos delete para el Set
quitarDeDia(tanda: Tanda, dia: string) {
    // Remover la tanda del día correspondiente
    this.tandasPorDia[dia].delete(tanda);
  
    // Agregar la tanda de nuevo a la lista filtrada
    this.tandasFiltradas.push(tanda);
}

// Actualización del filtro para no incluir tandas ya asignadas
filtrarTandas() {
    const tandasEnDias = Object.values(this.tandasPorDia)
        .flatMap(set => Array.from(set)) // Convertir cada Set en un Array
        .map(t => t.id);

    this.tandasFiltradas = this.tandas
        .filter(tanda => !tandasEnDias.includes(tanda.id))  // Excluir tandas en días
        .filter(tanda => tanda.producto.toLowerCase().includes(this.searchTerm.toLowerCase()));  // Aplicar filtro de búsqueda
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
