import { CommonModule } from '@angular/common'; 
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { Tanda } from '../../models/tanda.model';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';



interface DeliveryProduct {
  name: string;
  quantity: number;
}

interface Delivery {
  date: string;
  products: DeliveryProduct[];
  comedor: string;
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule,NgxChartsModule]
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('myChart', { static: false }) myChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comedorChart', { static: false }) comedorChart!: ElementRef<HTMLCanvasElement>;

  chartInstance: Chart | null = null;
  comedorChartInstance: Chart | null = null;
  viewMode: 'daily' | 'weekly' | 'monthly' = 'daily';

  subscriptions: Subscription[] = [];


  view: [number, number] = [700, 400];
  gradient: boolean = false;
  showLegend: boolean = true;
  showLabels: boolean = true;
  colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#007bff', '#0056b3'] // Colores para simular el degradado
  };
  
  
  

  
  
  datosInfoCharts: any = {};
  chartData: { name: string; value: number }[] = [];


  tandas: Tanda[] = [
    { id: '1', productoId: 'A1', cantidadIngresada: 100, cantidadActual: 50, fechaLlegada: '2024-01-01', fechaVencimiento: '2024-04-01', producto: 'Product A', bodega: 'Bodega 1', ubicacion: 'A1', esMerma: false },
    { id: '2', productoId: 'B1', cantidadIngresada: 200, cantidadActual: 150, fechaLlegada: '2024-02-01', fechaVencimiento: '2024-05-01', producto: 'Product B', bodega: 'Bodega 2', ubicacion: 'B1', esMerma: false },
    { id: '3', productoId: 'C1', cantidadIngresada: 150, cantidadActual: 100, fechaLlegada: '2024-01-15', fechaVencimiento: '2024-05-15', producto: 'Product C', bodega: 'Bodega 3', ubicacion: 'C1', esMerma: false },
    { id: '4', productoId: 'D1', cantidadIngresada: 250, cantidadActual: 200, fechaLlegada: '2024-02-10', fechaVencimiento: '2024-06-10', producto: 'Product D', bodega: 'Bodega 4', ubicacion: 'D1', esMerma: false },
    { id: '5', productoId: 'E1', cantidadIngresada: 300, cantidadActual: 280, fechaLlegada: '2024-03-01', fechaVencimiento: '2024-07-01', producto: 'Product E', bodega: 'Bodega 5', ubicacion: 'E1', esMerma: false },
    { id: '6', productoId: 'F1', cantidadIngresada: 180, cantidadActual: 120, fechaLlegada: '2024-01-20', fechaVencimiento: '2024-05-20', producto: 'Product F', bodega: 'Bodega 6', ubicacion: 'F1', esMerma: false },
    { id: '7', productoId: 'G1', cantidadIngresada: 220, cantidadActual: 180, fechaLlegada: '2024-02-25', fechaVencimiento: '2024-06-25', producto: 'Product G', bodega: 'Bodega 7', ubicacion: 'G1', esMerma: false },
    { id: '8', productoId: 'H1', cantidadIngresada: 260, cantidadActual: 210, fechaLlegada: '2024-03-15', fechaVencimiento: '2024-07-15', producto: 'Product H', bodega: 'Bodega 8', ubicacion: 'H1', esMerma: true },
    { id: '9', productoId: 'I1', cantidadIngresada: 350, cantidadActual: 300, fechaLlegada: '2024-02-05', fechaVencimiento: '2024-06-05', producto: 'Product I', bodega: 'Bodega 9', ubicacion: 'I1', esMerma: false },
    { id: '10', productoId: 'J1', cantidadIngresada: 400, cantidadActual: 350, fechaLlegada: '2024-01-25', fechaVencimiento: '2024-05-25', producto: 'Product J', bodega: 'Bodega 10', ubicacion: 'J1', esMerma: true }
];

deliveries: Delivery[] = [
  { date:'2024-01-03', products: [{ name: 'Product A', quantity: 10 }, { name: 'Product B', quantity: 15 }], comedor: 'Comedor 1' },
  { date: '2024-01-03', products: [{ name: 'Product C', quantity: 8 }, { name: 'Product D', quantity: 12 }], comedor: 'Comedor 2' },
  { date: '2024-01-10', products: [{ name: 'Product A', quantity: 5 }], comedor: 'Comedor 1' },
  { date: '2024-01-15', products: [{ name: 'Product B', quantity: 10 }, { name: 'Coca-cola', quantity: 20 }], comedor: 'Comedor 3' },
  { date: '2024-01-20', products: [{ name: 'Product D', quantity: 7 }], comedor: 'Comedor 2' },
  { date: '2024-01-25', products: [{ name: 'Product A', quantity: 12 }, { name: 'Product B', quantity: 14 }], comedor: 'Comedor 1' },
  { date: '2024-02-07', products: [{ name: 'Product A', quantity: 20 }, { name: 'Product B', quantity: 18 }], comedor: 'Comedor 1' },
  { date: '2024-02-07', products: [{ name: 'Product C', quantity: 9 }], comedor: 'Comedor 2' },
  { date: '2024-02-07', products: [{ name: 'Product D', quantity: 6 }], comedor: 'Comedor 3' },
  { date: '2024-02-10', products: [{ name: 'Product A', quantity: 11 }], comedor: 'Comedor 1' },
  { date: '2024-02-14', products: [{ name: 'Product B', quantity: 13 }], comedor: 'Comedor 2' },
  { date: '2024-02-20', products: [{ name: 'Product C', quantity: 7 }, { name: 'Product D', quantity: 10 }], comedor: 'Comedor 3' },
  { date: '2024-03-01', products: [{ name: 'Product A', quantity: 8 }], comedor: 'Comedor 1' },
  { date: '2024-03-05', products: [{ name: 'Product B', quantity: 12 }], comedor: 'Comedor 2' },
  { date: '2024-04-09', products: [{ name: 'Product C', quantity: 10 }], comedor: 'Comedor 3' },
  { date: '2024-04-10', products: [{ name: 'Product D', quantity: 9 }], comedor: 'Comedor 1' },
  { date: '2024-04-15', products: [{ name: 'Product A', quantity: 15 }, { name: 'Product B', quantity: 20 }], comedor: 'Comedor 2' },
  { date: '2024-04-20', products: [{ name: 'Product C', quantity: 14 }], comedor: 'Comedor 3' },
];
  

  constructor(private http: HttpClient) {
    
    Chart.register(...registerables);
  }
  calcularProductosEntregados(): number {
    return this.deliveries.reduce((total, delivery) => {
      return total + delivery.products.reduce((productTotal, product) => productTotal + product.quantity, 0);
    }, 0);
  }

  calcularProductosMermados(): number {
    return this.tandas.reduce((total, tanda) => {
      return tanda.esMerma ? total + tanda.cantidadActual : total;
    }, 0);
  }

  cargarDatos(): void {
  }
  

  async ngAfterViewInit() {
    this.createChart(); // Crear gráfico de entregas por tiempo
  
    // Crear gráfico de productos por comedor
    setTimeout(() => {
      this.createComedorChart('Comedor 1'); 
    });

    // Crear gráfico de comparación circular
    this.prepareChartData();
  }
  
  

  handleTimeViewChange(event: Event) {
    this.viewMode = (event.target as HTMLSelectElement).value as 'daily' | 'weekly' | 'monthly';
    this.createChart(); // Actualiza el gráfico basado en el nuevo modo de vista
  }

  ngOnInit(): void {
    console.log('info:', this.datosInfoCharts);
  }

  getFilteredData() {
    const groupBy = (arr: any[], key: Function) => {
        return arr.reduce((acc, current) => {
            const groupKey = key(current);
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(current);
            return acc;
        }, {});
    };

    console.log("Current view mode:", this.viewMode);

    if (this.viewMode === 'daily') {
        const groupedData = groupBy(this.deliveries, (delivery: any) => {

            const [year, month, day] = delivery.date.split('-').map(Number);
            const dateObj = new Date(Date.UTC(year, month - 1, day));
            
            // Formatear explícitamente la fecha a un string en UTC
            const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(dateObj.getUTCDate()).padStart(2, '0')}`;

            return formattedDate;
        });
        console.log("Daily grouped data:", groupedData);
        return groupedData;
    } else if (this.viewMode === 'weekly') {
        const groupedData = groupBy(this.deliveries, (delivery: any) => {
            const [year, month, day] = delivery.date.split('-').map(Number);
            const dateObj = new Date(Date.UTC(year, month - 1, day));
            const startOfWeek = new Date(dateObj);
            startOfWeek.setUTCDate(dateObj.getUTCDate() - dateObj.getUTCDay());

            const formattedStartOfWeek = `${startOfWeek.getUTCFullYear()}-${String(startOfWeek.getUTCMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getUTCDate()).padStart(2, '0')}`;

            return formattedStartOfWeek;
        });
        return groupedData;
    } else {
        const groupedData = groupBy(this.deliveries, (delivery: any) => {
            const [year, month, day] = delivery.date.split('-').map(Number);
            const dateObj = new Date(Date.UTC(year, month - 1, day));

            const formattedMonth = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}`;

            return formattedMonth;
        });
        return groupedData;
    }
}


  
  

createChart() {
  const data = this.getFilteredData();

  const labels = Object.keys(data).map(dateStr => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(dateStr + 'T00:00:00Z'));
  });

  const values = Object.keys(data).map(label => data[label].length);

  // Calcular el total de entregas
  const totalEntregas = values.reduce((sum, value) => sum + value, 0);

  // Actualizar el elemento HTML para mostrar el total de entregas
  const totalDeliveriesDisplay = document.getElementById('totalDeliveriesDisplay');
  if (totalDeliveriesDisplay) {
    totalDeliveriesDisplay.textContent = `Total Entregas: ${totalEntregas}`;
  }

  const ctx = this.myChart.nativeElement.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradient.addColorStop(0, '#007bff'); // Color inicial
  gradient.addColorStop(1, '#0056b3'); // Color final


  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Entregas',
          data: values,
          backgroundColor: gradient, // Cambiar a un color azul claro
        borderColor: 'rgba(54, 162, 235, 1)', 
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1 // Mostrar solo números enteros en el eje Y
          }
        }
      }
    }
  };

  if (this.chartInstance) {
    this.chartInstance.destroy();
  }

  this.chartInstance = new Chart(this.myChart.nativeElement.getContext('2d')!, config);
}




createComedorChart(comedor: string) {
  if (!this.comedorChart || !this.comedorChart.nativeElement) {
    return;
  }

  const productData = this.getComedorData()[comedor] || {};
  const labels = Object.keys(productData);
  const data = Object.values(productData);

  // Calcular el total de productos entregados para el comedor seleccionado
  const totalProducts = data.reduce((sum, value) => sum + value, 0);

  // Actualizar el elemento HTML para mostrar el total de productos entregados
  const totalProductsDisplay = document.getElementById('totalProductsDisplay');
  if (totalProductsDisplay) {
    totalProductsDisplay.textContent = `Total Productos Entregados: ${totalProducts}`;
  }

  const ctx = this.myChart.nativeElement.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradient.addColorStop(0, '#007bff'); // Color inicial
  gradient.addColorStop(1, '#0056b3'); // Color final


  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: `Productos entregados a ${comedor}`,
          data: data,
          backgroundColor: gradient,
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1 // Mostrar solo números enteros en el eje Y
          }
        }
      }
    }
  };

  if (this.comedorChartInstance) {
    this.comedorChartInstance.destroy();
  }

  this.comedorChartInstance = new Chart(this.comedorChart.nativeElement.getContext('2d')!, config);
}


  handleComedorChange(event: Event) {
    const selectedComedor = (event.target as HTMLSelectElement).value;
    this.createComedorChart(selectedComedor);
  }

  getComedorData() {
    const productCountByComedor = this.deliveries.reduce((acc: Record<string, Record<string, number>>, delivery) => {
      const comedor = delivery.comedor;
      if (!acc[comedor]) {
        acc[comedor] = {};
      }
      delivery.products.forEach(product => {
        const productName = product.name;
        acc[comedor][productName] = (acc[comedor][productName] || 0) + product.quantity;
      });
      return acc;
    }, {});
  
    return productCountByComedor;
  }
  

  getComedorKeys() {
    return Object.keys(this.getComedorData());
  }

  
  prepareChartData() {
    const productosEntregados = this.calcularProductosEntregados();
    const productosMermados = this.calcularProductosMermados();

    this.chartData = [
      { name: 'Entregados', value: productosEntregados },
      { name: 'Mermados', value: productosMermados }
    ];
  }
    customTooltipText = (data: any) => {
      const percentage = ((data.value / this.totalValue()) * 100).toFixed(2);
      return `${data.name}: ${data.value} (${percentage}%)`;
    };
    
    totalValue(): number {
      return this.chartData.reduce((sum, item) => sum + item.value, 0);
    }
    
    
    totalDeliveries(): number {
      return this.deliveries.length;
    }
    
    totalProductosEnTandas(): number {
      return this.tandas.reduce((total, tanda) => total + tanda.cantidadIngresada, 0);
    }
    
    getColor(name: string): string {
      const colorMap: Record<string, string> = {
        'Entregados': this.colorScheme.domain[0],
        'Mermados': this.colorScheme.domain[1]
      };
      return colorMap[name] || '#000'; // Retorna un color por defecto si no se encuentra en el mapa
    }

    
    
    
}
