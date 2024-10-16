import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlanificacionSocketService {
  private socketPlanificacion: Socket;

  constructor() {
    // Configuración del nuevo socket
    const configPlanificacion: SocketIoConfig = {
      url: 'http://34.176.26.41/planificacion', // URL del nuevo socket
      options: {} // Este socket no requiere autenticación, así que las opciones están vacías
    };

    // Instanciamos el socket con esta configuración
    this.socketPlanificacion = new Socket(configPlanificacion);

    // Inicializamos el socket y escuchamos los eventos necesarios
    this.initSocket();
  }

  // Inicializar el socket de planificación y escuchar eventos
  private initSocket() {
    this.socketPlanificacion.on('connect', () => {
      console.log('Conectado al socket de Planificación');
    });

    this.socketPlanificacion.on('disconnect', () => {
      console.log('Desconectado del socket de Planificación');
    });

    // Escuchar algún evento específico para planificación
    this.socketPlanificacion.on('loadAdminPlanificacionManage', (data: any) => {
      // Manejar los datos recibidos
    });
  }

  // Emitir evento relacionado con planificación
  getPlanificacion(lunes: string, viernes: string) {
    // Prepara el mensaje con las fechas que el backend espera
    const mensaje = {
      inicio: lunes,
      fin: viernes
    };
    console.log(mensaje)
    // Envía el mensaje a través del socket para solicitar la planificación
    this.socketPlanificacion.emit('adminPlanificacionManage', mensaje);
  }

  // Escuchar evento de respuesta de planificación
  onLoadPlanificacion(): Observable<any> {
    return this.socketPlanificacion.fromEvent('loadAdminPlanificacionManage');
  }

  // Método para desconectar el socket
  disconnectSocket() {
    this.socketPlanificacion.disconnect();
    console.log('Socket de planificación desconectado');
  }

  // Método para conectar el socket
  connectSocket() {
    this.socketPlanificacion.connect();
    console.log('Socket de planificación conectado');
  }
}
