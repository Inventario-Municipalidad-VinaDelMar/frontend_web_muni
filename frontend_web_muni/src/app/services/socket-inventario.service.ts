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

  getAllCategorias() {
    this.socket.emit('getAllCategorias');
  }

  listenTandaCreate(): Observable<Tanda> {
    return this.socket.fromEvent<Tanda>('newTandaCreated');
  }
  listenStockCategoriaChanged() {
    return this.socket.fromEvent('stockCategoriaChange');
  }

  // Escuchar el evento que devuelve las categorías
  onLoadAllCategorias(): Observable<any> {
    return this.socket.fromEvent('loadAllCategorias');
  }

  // Emitir evento para obtener tandas por ID de categoría
  getTandasByCategoriaId(idCategoria: string) {
    this.socket.emit('getTandasByIdCategoria', { idCategoria });
  }
  

  // Escuchar el evento que devuelve las tandas por ID de categoría
  onLoadTandasByCategoriaId(idCategoria: string): Observable<any> {
    idCategoria=idCategoria+"-tanda"
    return this.socket.fromEvent(idCategoria);
  }

}
