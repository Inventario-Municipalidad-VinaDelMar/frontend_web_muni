// socket.service.ts
import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    const config: SocketIoConfig = {
      url: 'http://34.176.26.41/planificacion', // Asegúrate de usar la URL correcta
      options: {},
    };

    this.socket = new Socket(config);
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  fromEvent(event: string): Observable<any> {
    return this.socket.fromEvent(event);
  }
}
