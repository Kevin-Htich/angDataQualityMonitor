import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { FeedStatus } from '../../../core/models';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatChipsModule, NgClass],
  template: ` <mat-chip [ngClass]="chipClass">{{ status }}</mat-chip> `,
  styleUrl: './status-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusChipComponent {
  @Input({ required: true }) status!: FeedStatus;

  get chipClass(): string {
    switch (this.status) {
      case 'Healthy':
        return 'chip-healthy';
      case 'Degraded':
        return 'chip-degraded';
      default:
        return 'chip-critical';
    }
  }
}
