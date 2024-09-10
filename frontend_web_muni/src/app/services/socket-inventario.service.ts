import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

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

  getAllCategorias() {
    this.socket.emit('getAllCategorias');
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
