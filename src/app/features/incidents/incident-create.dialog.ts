import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Feed, Anomaly } from '../../core/models';

export interface IncidentCreateDialogData {
  feeds: Feed[];
  anomalies: Anomaly[];
}

@Component({
  selector: 'app-incident-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Create Incident</h2>
    <form [formGroup]="form" mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline">
        <mat-label>Title</mat-label>
        <input matInput formControlName="title" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Feed</mat-label>
        <mat-select formControlName="feedId">
          <mat-option *ngFor="let feed of data.feeds; trackBy: trackById" [value]="feed.id">
            {{ feed.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Severity</mat-label>
        <mat-select formControlName="severity">
          <mat-option value="Low">Low</mat-option>
          <mat-option value="Medium">Medium</mat-option>
          <mat-option value="High">High</mat-option>
          <mat-option value="Critical">Critical</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Description</mat-label>
        <textarea matInput rows="3" formControlName="description"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Owner</mat-label>
        <input matInput formControlName="owner" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Link anomalies</mat-label>
        <mat-select formControlName="anomalyIds" multiple>
          <mat-option *ngFor="let anomaly of data.anomalies; trackBy: trackById" [value]="anomaly.id">
            {{ anomaly.type }} - {{ anomaly.description }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </form>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="form.value" [disabled]="form.invalid">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: grid;
        gap: 12px;
        width: 100%;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncidentCreateDialogComponent {
  readonly form = this.fb.group({
    title: ['', Validators.required],
    feedId: ['', Validators.required],
    severity: ['Medium', Validators.required],
    description: ['', Validators.required],
    owner: ['On-call'],
    anomalyIds: [[] as string[]]
  });

  constructor(
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public readonly data: IncidentCreateDialogData
  ) {}

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
