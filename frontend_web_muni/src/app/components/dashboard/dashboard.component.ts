import { CommonModule } from '@angular/common'; 
import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { Tanda } from '../../models/tanda.model';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { HttpClient } from '@angular/common/http';

interface DeliveryProduct {
  nombre: string;
  cantidadEntregada: number;
}

interface Entrega {
  fecha: string;
  comedor: string;
  productos: DeliveryProduct[];
}

interface Merma {
  cantidadRetirada: number;
  fecha: string;
  producto: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, NgxChartsModule]
})
export class DashboardComponent implements AfterViewInit, OnInit {
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
    domain: ['#007bff', '#0056b3'] 
  };

  datosInfoCharts: any = {};
  entregas: Entrega[] = []; // Datos de entregas dinámicos
  tandas: Tanda[] = []; // Datos de tandas dinámicos
  chartData: { name: string; value: number }[] = [];
  mermas: Merma[] = [];


  constructor(private http: HttpClient) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.getInfoChartsData(); 
  }

  getInfoChartsData(): void {
    const url = `http://34.176.26.41/api/inventario/infoCharts?fechaInicio=2024-01-01&fechaFin=2024-12-31`;
  
    this.http.get(url).subscribe(
      (response: any) => {
        console.log('Datos recibidos:', response);
        this.datosInfoCharts = response;
        this.entregas = response.entregas || [];
        this.tandas = response.tandas || [];
        this.mermas = response.mermas || []; // Cargar las mermas
        this.prepareChartData(); // Actualizar los datos del gráfico
      },
      (error) => {
        console.error('Error al cargar los datos:', error);
      }
    );
  }
  

  calcularProductosEntregados(): number {
    return this.entregas.reduce((total, entrega) => {
      return total + entrega.productos.reduce((productTotal, product) => productTotal + product.cantidadEntregada, 0);
    }, 0);
  }

  calcularProductosMermados(): number {
    return this.tandas.reduce((total, tanda) => {
      return tanda.esMerma ? total + tanda.cantidadActual : total;
    }, 0);
  }

  getComedorData() {
    const productCountByComedor = this.entregas.reduce((acc: Record<string, Record<string, number>>, entrega) => {
      const comedor = entrega.comedor;
      if (!acc[comedor]) {
        acc[comedor] = {};
      }
      entrega.productos.forEach(product => {
        const productName = product.nombre;
        acc[comedor][productName] = (acc[comedor][productName] || 0) + product.cantidadEntregada;
      });
      return acc;
    }, {});
  
    return productCountByComedor;
  }
  
  getComedorKeys() {
    return Object.keys(this.getComedorData());
  }

  prepareChartData() {
    // Calcular total de productos entregados
    const totalEntregados = this.calcularProductosEntregados();
  
    // Calcular total de productos mermados
    const totalMermados = this.mermas.reduce((total, merma) => total + merma.cantidadRetirada, 0);
  
    // Actualizar datos para el gráfico circular
    this.chartData = [
      { name: 'Entregados', value: totalEntregados },
      { name: 'Mermados', value: totalMermados }
    ];
  
    console.log("Datos para gráfico circular:", this.chartData);
  }
  
  
  

  async ngAfterViewInit() {
    this.getInfoChartsData(); // Llama al método para cargar datos
  
    // Usa un retraso para garantizar que los datos y los elementos HTML estén disponibles
    setTimeout(() => {
      const firstComedor = this.getComedorKeys()[0];
      if (firstComedor) {
        this.createComedorChart(firstComedor); // Carga el gráfico para el primer comedor
      } else {
        console.warn('No hay comedores disponibles para mostrar.');
      }
      this.createChart(); // Carga el gráfico general
  
      // Actualiza el gráfico circular para entregados vs mermados
      this.prepareChartData();
    }, 500); // Ajusta el tiempo según la latencia de tu API
  }
  
  

  handleTimeViewChange(event: Event) {
    this.viewMode = (event.target as HTMLSelectElement).value as 'daily' | 'weekly' | 'monthly';
    this.createChart(); 
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

    const totalEntregas = values.reduce((sum, value) => sum + value, 0);
    const totalDeliveriesDisplay = document.getElementById('totalDeliveriesDisplay');
    if (totalDeliveriesDisplay) {
      totalDeliveriesDisplay.textContent = `Total Entregas: ${totalEntregas}`;
    }

    const ctx = this.myChart.nativeElement.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#007bff');
    gradient.addColorStop(1, '#0056b3');

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Entregas',
            data: values,
            backgroundColor: gradient,
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
              stepSize: 1 
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
    const labels = Object.keys(productData); // Productos
    const data = Object.values(productData); // Cantidades
  
    const totalProducts = data.reduce((sum, value) => sum + value, 0);
    const totalProductsDisplay = document.getElementById('totalProductsDisplay');
    if (totalProductsDisplay) {
      totalProductsDisplay.textContent = `Total Productos Entregados: ${totalProducts}`;
    }
  
    const ctx = this.comedorChart.nativeElement.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#007bff');
    gradient.addColorStop(1, '#0056b3');
  
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels, // Nombres de productos
        datasets: [
          {
            label: `Productos entregados a ${comedor}`,
            data, // Cantidades de productos
            backgroundColor: gradient,
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };
  
    if (this.comedorChartInstance) {
      this.comedorChartInstance.destroy();
    }
  
    this.comedorChartInstance = new Chart(ctx, config);
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
      const groupedData = groupBy(this.entregas, (entrega: any) => {
        const [year, month, day] = entrega.fecha.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(dateObj.getUTCDate()).padStart(2, '0')}`;
        return formattedDate;
      });
      console.log("Daily grouped data:", groupedData);
      return groupedData;
    } else if (this.viewMode === 'weekly') {
      const groupedData = groupBy(this.entregas, (entrega: any) => {
        const [year, month, day] = entrega.fecha.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const startOfWeek = new Date(dateObj);
        startOfWeek.setUTCDate(dateObj.getUTCDate() - dateObj.getUTCDay());
  
        const formattedStartOfWeek = `${startOfWeek.getUTCFullYear()}-${String(startOfWeek.getUTCMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getUTCDate()).padStart(2, '0')}`;
        return formattedStartOfWeek;
      });
      return groupedData;
    } else {
      const groupedData = groupBy(this.entregas, (entrega: any) => {
        const [year, month, day] = entrega.fecha.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const formattedMonth = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}`;
        return formattedMonth;
      });
      return groupedData;
    }
  }


  // Método para manejar el cambio de comedor en el selector
  handleComedorChange(event: Event) {
    const selectedComedor = (event.target as HTMLSelectElement).value;
    this.createComedorChart(selectedComedor);
  }

  // Método para obtener el color de un elemento en la gráfica
  getColor(name: string): string {
    const colorMap: Record<string, string> = {
      'Entregados': '#007bff', // Azul
      'Mermados': '#dc3545'   // Rojo
    };
    return colorMap[name] || '#000'; // Color por defecto si no está en el mapa
  }
  

  // Método para calcular el valor total en la gráfica circular
  totalValue(): number {
    return this.chartData.reduce((sum, item) => sum + item.value, 0);
  }

  // Método para calcular el total de productos en tandas
  totalProductosEnTandas(): number {
    return this.tandas.reduce((total, tanda) => total + tanda.cantidadIngresada, 0);
  }
  calcularTotalMermados(): number {
    return this.mermas.reduce((total, merma) => total + merma.cantidadRetirada, 0);
  }
  

  totalDeliveries(): number {
    return this.datosInfoCharts.entregas ? this.datosInfoCharts.entregas.length : 0;
  }
  
}
