import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Delivery } from '../models/detalle-envio.model';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {
  private apiUrl = 'http://34.176.26.41/api/inventario/infoCharts';

  constructor(private http: HttpClient) { }

  getChartData(): Observable<Delivery[]> {
    const params = new HttpParams()
      .set('fechaInicio', '2024-01-01')
      .set('fechaFin', '2024-12-31');

    return this.http.get<{ tanda: any[], entregas: any[] }>(this.apiUrl, { params }).pipe(
      map(response => 
        response.entregas.map(entrega => ({
          date: entrega.fecha,
          products: entrega.productosEntregados.map((product: any) => ({
            name: product.producto,
            quantity: product.cantidad
          })),
          comedor: entrega.comedorSolidario
        }))
      )
    );
  }
}
