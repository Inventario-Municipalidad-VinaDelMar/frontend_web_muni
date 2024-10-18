import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SolicitudData } from '../../solicitud-data.model';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { EnviarService } from '../../services/enviar.service';
import { TokenService } from '../../services/auth-token.service';

@Component({
  standalone: true,
  selector: 'app-solicitud-dialog',
  templateUrl: './solicitud-dialog.component.html',
  styleUrls: ['./solicitud-dialog.component.scss'],
  imports: [ButtonModule, DialogModule], // Asegúrate de incluir ButtonModule aquí
})

export class SolicitudDialogComponent {
  visible: boolean = true;
    constructor(
      public dialogRef: MatDialogRef<SolicitudDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public solicitudData: SolicitudData // Asegúrate de que 'solicitudData' está bien tipado
    ) {}
  

  onConfirm(): void {
    //const token = this.tokenService.getToken();
    this.dialogRef.close(true);
    //if (!token) {
      // console.error('No hay token disponible.');
  
    // }
    

    //this.enviarService.authorizeSolicitud(token, this.solicitudData.id).subscribe(
    //  (res) => {
        // console.log('Solicitud autorizada:', res);
        // this.visible = false; // Cierra el diálogo
      // },
      // (error) => {
        // console.error('Error al autorizar la solicitud:', error);
        // console.error('Cuerpo del error:', error.error); // Imprime el cuerpo de la respuesta de error
        // console.error('Estado:', error.status);
        // console.error('Texto del estado:', error.statusText);
      // }
    // );
    
  }

  onCancel(): void {
    this.dialogRef.close(false); // Cierra el diálogo y devuelve `false` si se cancela
  }
}
