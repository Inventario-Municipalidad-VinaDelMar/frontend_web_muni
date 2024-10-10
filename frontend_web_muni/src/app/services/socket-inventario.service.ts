import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { Tanda } from '../models/tanda.model';

@Injectable({
  providedIn: 'root', // Esto hace que el servicio esté disponible globalmente en toda la aplicación.
})
export class SocketInventarioService {
  constructor(private socket: Socket) {}

  // Método para escuchar el evento de conexión
  onConnect(): Observable<any> {
    return this.socket.fromEvent('connect');
  }

  // Método para escuchar el evento de desconexión
  onDisconnect(): Observable<any> {
    return this.socket.fromEvent('disconnect');
  }

  // Desconectar Loads en duros (que no necesitan valores diferentes para ingresar)
  disconnectAll(): void {
    this.socket.off('newTandaCreated');
    this.socket.off('stockCategoriaChange');
    this.socket.off('loadAllCategorias');
    console.log('sockets desconectados...')
  }

  disconnectTandas(categoriaId:string){

    this.socket.off(categoriaId+'-tanda');
    console.log('mató la tanda: '+categoriaId+'-tanda')
  }

  getAllProductos() {
    this.socket.emit('getAllProductos');
  }

  listenTandaCreate(): Observable<Tanda> {
    return this.socket.fromEvent<Tanda>('newTandaCreated');
  }
  listenStockCategoriaChanged() {
    return this.socket.fromEvent('stockCategoriaChange');
  }

  // Escuchar el evento que devuelve las categorías
  loadAllProductos(): Observable<any> {
    return this.socket.fromEvent('loadAllProductos');
  }

  // Emitir evento para obtener tandas por ID de categoría
  getTandasByProductoId(idProducto: string) {
    console.log('Emitiendo getTandasByProductoId para producto:', idProducto);
    this.socket.emit('getTandasByIdProducto', { idProducto });
  }
  

  // Escuchar el evento que devuelve las tandas por ID de categoría
  onLoadTandasByProductoId(idProducto: string): Observable<any> {
    return this.socket.fromEvent(`${idProducto}-tanda`);
  }

}
