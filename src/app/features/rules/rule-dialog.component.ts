import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Feed } from '../../core/models';

export interface RuleDialogData {
  feeds: Feed[];
}

@Component({
  selector: 'app-rule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Rule</h2>
    <form [formGroup]="form" mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline">
        <mat-label>Rule name</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Scope</mat-label>
        <mat-select formControlName="scope">
          <mat-option value="all">All feeds</mat-option>
          <mat-option value="feed">Single feed</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" *ngIf="form.value.scope === 'feed'">
        <mat-label>Feed</mat-label>
        <mat-select formControlName="feedId">
          <mat-option *ngFor="let feed of data.feeds; trackBy: trackById" [value]="feed.id">
            {{ feed.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>Metric</mat-label>
          <mat-select formControlName="metric">
            <mat-option value="Latency">Latency</mat-option>
            <mat-option value="ErrorRate">Error Rate</mat-option>
            <mat-option value="Volume">Volume</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Operator</mat-label>
          <mat-select formControlName="operator">
            <mat-option value=">">&gt;</mat-option>
            <mat-option value=">=">&gt;=</mat-option>
            <mat-option value="<">&lt;</mat-option>
            <mat-option value="<=">&lt;=</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Threshold</mat-label>
          <input matInput type="number" formControlName="threshold" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Window</mat-label>
        <mat-select formControlName="window">
          <mat-option value="5m">5m</mat-option>
          <mat-option value="15m">15m</mat-option>
          <mat-option value="1h">1h</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Alert severity</mat-label>
        <mat-select formControlName="severity">
          <mat-option value="Low">Low</mat-option>
          <mat-option value="Medium">Medium</mat-option>
          <mat-option value="High">High</mat-option>
          <mat-option value="Critical">Critical</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-slide-toggle formControlName="enabled">Enabled</mat-slide-toggle>
    </form>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="form.value" [disabled]="form.invalid">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: grid;
        gap: 12px;
      }

      .row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      @media (max-width: 680px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuleDialogComponent {
  readonly form = this.fb.group({
    name: ['', Validators.required],
    scope: ['all', Validators.required],
    feedId: [''],
    metric: ['Latency', Validators.required],
    operator: ['>', Validators.required],
    threshold: [500, Validators.required],
    window: ['5m', Validators.required],
    severity: ['Medium', Validators.required],
    enabled: [true]
  });

  constructor(
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public readonly data: RuleDialogData
  ) {}

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
