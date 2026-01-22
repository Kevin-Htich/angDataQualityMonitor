import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 3000 });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000, panelClass: ['snack-error'] });
  }
}
