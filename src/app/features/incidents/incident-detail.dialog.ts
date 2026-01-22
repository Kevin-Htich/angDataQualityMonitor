import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Incident, IncidentStatus } from '../../core/models';
import { MockApiService } from '../../core/services/mock-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

export interface IncidentDetailDialogData {
  incident: Incident;
}

@Component({
  selector: 'app-incident-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    ReactiveFormsModule,
    RelativeTimePipe
  ],
  template: `
    <h2 mat-dialog-title>{{ incident.title }}</h2>
    <mat-dialog-content class="dialog-body">
      <section>
        <h4>Status</h4>
        <div class="status-row">
          <mat-form-field appearance="outline">
            <mat-label>Update status</mat-label>
            <mat-select [formControl]="statusControl">
              <mat-option value="Open">Open</mat-option>
              <mat-option value="Investigating">Investigating</mat-option>
              <mat-option value="In Progress">In Progress</mat-option>
              <mat-option value="Resolved">Resolved</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveStatus()">Update</button>
        </div>
        <p class="muted">Owner: {{ incident.owner }} · Updated {{ incident.updatedAt | relativeTime }}</p>
      </section>

      <mat-divider></mat-divider>

      <section>
        <h4>Timeline</h4>
        <div class="timeline">
          <div *ngFor="let event of incident.timeline; trackBy: trackById" class="timeline-item">
            <div class="dot"></div>
            <div>
              <strong>{{ event.status }}</strong>
              <div class="muted">{{ event.summary }}</div>
              <small class="muted">{{ event.timestamp | relativeTime }}</small>
            </div>
          </div>
        </div>
      </section>

      <mat-divider></mat-divider>

      <section>
        <h4>Comments</h4>
        <div class="comment" *ngFor="let comment of incident.comments; trackBy: trackById">
          <strong>{{ comment.author }}</strong>
          <span class="muted">{{ comment.timestamp | relativeTime }}</span>
          <p>{{ comment.message }}</p>
        </div>
        <mat-form-field appearance="outline" class="comment-box">
          <mat-label>Add comment</mat-label>
          <textarea matInput rows="2" [formControl]="commentControl"></textarea>
        </mat-form-field>
        <button mat-stroked-button color="primary" (click)="addComment()">Add Comment</button>
      </section>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-body {
        display: grid;
        gap: 16px;
      }
      .status-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .timeline {
        display: grid;
        gap: 12px;
      }
      .timeline-item {
        display: flex;
        gap: 12px;
      }
      .timeline-item .dot {
        width: 10px;
        height: 10px;
        background: var(--dq-accent);
        border-radius: 50%;
        margin-top: 6px;
      }
      .comment {
        padding: 8px 0;
      }
      .comment-box {
        width: 100%;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncidentDetailDialogComponent {
  incident: Incident;
  statusControl: FormControl<IncidentStatus>;
  commentControl = new FormControl('', { nonNullable: true });

  constructor(
    @Inject(MAT_DIALOG_DATA) data: IncidentDetailDialogData,
    private readonly api: MockApiService,
    private readonly notify: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.incident = structuredClone(data.incident);
    this.statusControl = new FormControl(this.incident.status, { nonNullable: true });
  }

  saveStatus(): void {
    const status = this.statusControl.value;
    this.api.updateIncidentStatus(this.incident.id, status, `Status set to ${status}.`).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.notify.success('Incident updated.');
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to update incident.')
    });
  }

  addComment(): void {
    const message = this.commentControl.value.trim();
    if (!message) {
      return;
    }
    this.api.addIncidentComment(this.incident.id, 'Admin', message).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.commentControl.setValue('');
        this.notify.success('Comment added.');
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to add comment.')
    });
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
