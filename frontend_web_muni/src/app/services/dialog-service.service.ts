import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SolicitudData } from '../solicitud-data.model';
import { SolicitudDialogComponent } from '../components/solicitud-dialog/solicitud-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class SolicitudDialogService {
  constructor(private dialog: MatDialog) {}

  showSolicitudDialog(data: SolicitudData) {
    console.log('Datos que se envían al diálogo:', data);
    const dialogRef = this.dialog.open(SolicitudDialogComponent, {
      data: data,
      width: '50%',
    });

    return dialogRef.afterClosed(); // Esto devolverá un Observable con el resultado
  }
}