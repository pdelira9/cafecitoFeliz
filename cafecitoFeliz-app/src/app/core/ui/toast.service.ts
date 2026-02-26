import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}


  success(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-success'],
    });
  }


  error(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-error'],
    });
  }


  info(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-info'],
    });
  }
}
