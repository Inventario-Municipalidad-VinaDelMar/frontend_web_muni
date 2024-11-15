import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { filter } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tanda } from '../../models/tanda.model';
import { TokenService } from '../auth-token.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocketInventarioService {
  private inventoryUpdates = new BehaviorSubject<Tanda | null>(null);
  private socketConnected = false;

  constructor(
    private socket: Socket,
    private tokenService: TokenService,
    private authService: AuthService
  ) {
    // Observa el token y conecta el socket solo cuando haya un token no nulo
    this.tokenService.getTokenObservable()
      .pipe(filter(token => !!token)) // Solo procede si hay un token válido (no nulo)
      .subscribe(token => {
        if (token) {  // Aseguramos que token no sea null
          this.initializeConnection(token);
          console.log('Socket Inventario: Inicializando conexión con token');
        } else {
          this.disconnectSocket();
          console.log('Socket Inventario: Desconectado debido a falta de token');
        }
      });

  }

  initializeConnection(token: string): void {
    if (!this.socketConnected) {
      console.log('Inicializando conexión de Socket Inventario con token:', token);
      this.connectSocket(token);
    } else {
      console.log('El socket ya está conectado. No es necesario reconectar.');
    }
  }

  private connectSocket(token: string): void {

    // Actualiza el token en las opciones de auth antes de conectar
    this.socket.ioSocket.auth = { token };

    this.socket.connect();
    this.initSocket();
    this.socketConnected = true;
  }

  disconnectSocket(): void {
    if (this.socketConnected) {
      this.socket.disconnect();
      this.socketConnected = false;
      console.log('Socket de Inventario desconectado');
    }
  }

  private initSocket() {
    this.socket.on('connect', () => {
      console.log('Conectado al socket de Inventario');
      this.socketConnected = true;
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('Desconectado del socket de Inventario. Razón:', reason);
      this.socketConnected = false;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Error en la conexión del socket de Planificación:', error);
      if (error.message.includes('Token not valid')) {
        this.reconnectSocket(); // Llama a la reconexión si el token es inválido
      }
    });

    // Detecta si el token ha expirado y reconecta automáticamente
    this.socket.on('tokenExpired', () => {
      console.log('Token expirado en el socket de Inventario');
      this.reconnectSocket();
    });
  }

  private reconnectSocket(): void {
    // Intenta refrescar el token y reconectar el socket
    this.authService.refreshToken().subscribe(
      newToken => {
        console.log('Token renovado, reconectando Socket de Inventario');
        this.disconnectSocket(); // Desconecta el socket actual
        this.initializeConnection(newToken); // Reconecta con el nuevo token
      },
      error => {
        console.error('Error al renovar el token:', error);
        // Opcional: puedes redirigir al usuario al login si falla la renovación del token
      }
    );
  }

  // Métodos de interacción con el socket

  onConnect(): Observable<any> {
    return this.socket.fromEvent('connect');
  }
  isConnected(): boolean {
    return this.socketConnected;
  }

  onDisconnect(): Observable<any> {
    return this.socket.fromEvent('disconnect');
  }

  getAllProductos(): void {
    if (this.socketConnected) {
      this.socket.emit('getAllProductos');
    } else {
      console.warn('No se puede obtener productos: el socket no está conectado');
    }
  }

  loadAllProductos(): Observable<any> {
    return this.socket.fromEvent('loadAllProductos');
  }

  getAllBodegas(): void {
    if (this.socketConnected) {
      this.socket.emit('getAllBodegas');
    } else {
      console.warn('No se puede obtener bodegas: el socket no está conectado');
    }
  }

  loadAllBodegas(): Observable<any> {
    return this.socket.fromEvent('loadAllBodegas');
  }

// Escucha cuando se crea una nueva tanda
listenNewTandaCreated(): Observable<Tanda> {
  return this.socket.fromEvent<Tanda>('newTandaCreated');
}

// Escucha cuando se actualiza una tanda existente
listenNewTandaUpdate(): Observable<Tanda> {
  return this.socket.fromEvent<Tanda>('newTandaUpdate');
}

// Escucha cambios en el stock de productos
listenStockProductoChange(): Observable<any> {
  return this.socket.fromEvent('stockProductoChange');
}


getTandasByProductoId(idProducto: string): void {
    if (this.socketConnected) {
      this.socket.emit('getTandasByIdProducto', { idProducto });
    } else {
      console.warn('No se puede obtener tandas: el socket no está conectado');
    }
  }

  onLoadTandasByProductoId(idProducto: string): Observable<any> {
    return this.socket.fromEvent(`${idProducto}-tanda`);
  }

  getInventoryUpdates(): Observable<Tanda | null> {
    return this.inventoryUpdates.asObservable();
  }

  getUbicacionesByBodega(idBodega: string): void {
    if (this.socketConnected) {
      this.socket.emit('getUbicacionesByBodega', { idBodega });
    } else {
      console.warn('No se puede obtener ubicaciones: el socket no está conectado');
    }
  }
  
  // Método para recibir las ubicaciones según el id de la bodega
  loadUbicacionesByBodega(idBodega: string): Observable<any> {
    return this.socket.fromEvent(`${idBodega}-ubicaciones`);
  }
  

  onUbicacionCreada(): Observable<any> {
    return this.socket.fromEvent('ubicacionCreada');
  }

  // Método para escuchar la eliminación de ubicaciones
  onUbicacionEliminada(): Observable<any> {
    return this.socket.fromEvent('ubicacionEliminada');
  }
}
