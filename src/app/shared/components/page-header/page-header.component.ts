import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
