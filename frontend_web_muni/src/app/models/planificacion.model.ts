// models/planificacion.model.ts
export class PlanificacionModel {
  id: string;
  fecha: string;
  detalles: any[];

  constructor(data: any) {
    this.id = data.id;
    this.fecha = data.fecha;
    this.detalles = data.detalles || [];
  }
}
