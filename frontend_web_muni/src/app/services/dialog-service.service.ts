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

  constructor(private dialog: MatDialog, private enviarService: EnviarService) {
    // Escuchar cambios en localStorage para cerrar el diálogo
    window.addEventListener('storage', (event) => {
      if (event.key === 'closeSolicitudDialog' && event.newValue === 'true') {
        this.closeSolicitudDialog();
        localStorage.removeItem('closeSolicitudDialog'); // Restablecer el valor
      }
    });
  }

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

  // Método para cerrar el diálogo desde otros dispositivos o pestañas
  triggerCloseDialog() {
    localStorage.setItem('closeSolicitudDialog', 'true');
  }
}
