import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { AnomalySeverity } from '../../../core/models';

@Component({
  selector: 'app-severity-chip',
  standalone: true,
  imports: [MatChipsModule, NgClass],
  template: ` <mat-chip [ngClass]="chipClass" class="severity-chip">{{ severity }}</mat-chip> `,
  styleUrl: './severity-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeverityChipComponent {
  @Input({ required: true }) severity!: AnomalySeverity;

  get chipClass(): string {
    switch (this.severity) {
      case 'Low':
        return 'severity-low';
      case 'Medium':
        return 'severity-medium';
      case 'High':
        return 'severity-high';
      default:
        return 'severity-critical';
    }
  }
}
