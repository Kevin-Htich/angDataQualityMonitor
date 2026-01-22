import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-acknowledge-anomaly-dialog',
  standalone: true,
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Acknowledge anomaly</h2>
    <mat-dialog-content>
      <p>Mark this anomaly as acknowledged?</p>
      <mat-checkbox [formControl]="createIncidentControl">
        Create a new incident from this anomaly
      </mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="createIncidentControl.value">
        Confirm
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AcknowledgeAnomalyDialogComponent {
  readonly createIncidentControl = new FormControl(false, { nonNullable: true });
}
