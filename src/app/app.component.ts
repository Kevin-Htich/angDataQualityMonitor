import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
    NgFor,
    AsyncPipe,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: 'analytics' },
    { label: 'Incidents', path: '/incidents', icon: 'warning' },
    { label: 'Rules', path: '/rules', icon: 'tune' }
  ];

  readonly isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly breakpointObserver: BreakpointObserver) {}

  trackByPath(_: number, item: { path: string }): string {
    return item.path;
  }
}
