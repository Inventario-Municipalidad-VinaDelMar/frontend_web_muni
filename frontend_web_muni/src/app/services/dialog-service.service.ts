import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SolicitudData } from '../models/solicitud-data.model';
import { SolicitudDialogComponent } from '../components/solicitud-dialog/solicitud-dialog.component';
import { EnviarService } from './enviar.service';

@Injectable({
  providedIn: 'root',
})
export class SolicitudDialogService {
  private dialogRef: MatDialogRef<SolicitudDialogComponent> | null = null;

  constructor(private dialog: MatDialog) {}

  showSolicitudDialog(data: SolicitudData) {
    if (this.dialogRef) {
      this.closeSolicitudDialog();
    }

    this.dialogRef = this.dialog.open(SolicitudDialogComponent, {
      data: data,
      width: '50%',
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
    });

    return this.dialogRef.afterClosed();
  }

  closeSolicitudDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  // Método para verificar y cerrar si la solicitud ya fue procesada
  handleUpdatedSolicitud(data: SolicitudData) {
    if (this.dialogRef && data.status !== 'Pendiente') {
      this.closeSolicitudDialog();
    }
  }
}
