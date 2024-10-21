import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { Tanda } from '../../models/tanda.model';

@Injectable({
  providedIn: 'root',
})
export class SocketInventarioService {
  constructor(private socket: Socket) {
    this.initSocket();
  }

  // Inicializar el socket y escuchar eventos
  private initSocket() {
    this.socket.on('connect', () => {
      console.log('Conectado al socket de Inventario');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del socket de Inventario');
    });

    // Escuchar el evento de carga de productos
    this.socket.on('loadAllProductos', (data: any) => {
      
      // Aquí puedes manejar la lógica para actualizar tu estado local
    });

    // Escuchar el evento de creación de tanda
    this.socket.on('newTandaCreated', (data: Tanda) => {
      console.log('Nueva tanda creada:', data);
    });

    // Escuchar el evento de cambio de stock por categoría
    this.socket.on('stockCategoriaChange', (data: any) => {
      console.log('Cambio de stock en categoría:', data);
    });
  }
  
  // Método para escuchar el evento de conexión
  onConnect(): Observable<any> {
    return this.socket.fromEvent('connect');
  }

  // Método para escuchar el evento de desconexión
  onDisconnect(): Observable<any> {
    return this.socket.fromEvent('disconnect');
  }

  // Emitir evento para obtener todos los productos
  getAllProductos() {
    this.socket.emit('getAllProductos');
  }

  // Escuchar el evento que devuelve todos los productos
  loadAllProductos(): Observable<any> {
    return this.socket.fromEvent('loadAllProductos');
  }

  // Escuchar el evento de creación de tanda
  listenTandaCreate(): Observable<Tanda> {
    return this.socket.fromEvent<Tanda>('newTandaCreated');
  }

  // Escuchar el evento que indica cambio de stock en categoría
  listenStockCategoriaChanged() {
    return this.socket.fromEvent('stockCategoriaChange');
  }

  // Emitir evento para obtener tandas por ID de producto
  getTandasByProductoId(idProducto: string) {
    this.socket.emit('getTandasByIdProducto', { idProducto });
  }

  // Escuchar el evento que devuelve las tandas por ID de producto
  onLoadTandasByProductoId(idProducto: string): Observable<any> {
    return this.socket.fromEvent(`${idProducto}-tanda`);
  }
}
