
export interface SolicitudData {
    solicitante: {
      id: string;
      rut: string;
      email: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      imageUrl: string | null;
      isActive: boolean;
      roles: string[];
    };
    horaResolucion: string | null;
    id: string;
    fechaSolicitud: string;
    horaSolicitud: string;
    status: string;
    administrador: string | null;
    envioAsociado: string | null;
  }
  