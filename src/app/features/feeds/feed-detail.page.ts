import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { SeverityChipComponent } from '../../shared/components/severity-chip/severity-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { DATA_API, DataApiService } from '../../core/services/data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Anomaly, Feed, Incident, MetricPoint } from '../../core/models';
import { AcknowledgeAnomalyDialogComponent } from './acknowledge-anomaly.dialog';

@Component({
  selector: 'app-feed-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatChipsModule,
    NgChartsModule,
    PageHeaderComponent,
    StatusChipComponent,
    SeverityChipComponent,
    RelativeTimePipe
  ],
  templateUrl: './feed-detail.page.html',
  styleUrl: './feed-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedDetailPageComponent implements OnInit {
  feed?: Feed;
  metrics: MetricPoint[] = [];
  anomalies: Anomaly[] = [];
  incidents: Incident[] = [];

  loading = true;

  readonly displayedAnomalyColumns = ['type', 'severity', 'detectedAt', 'description', 'actions'];
  readonly displayedIncidentColumns = ['id', 'title', 'status', 'severity', 'owner', 'updatedAt'];

  lineChartData: ChartDataset<'line'>[] = [];
  lineChartLabels: string[] = [];
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  };

  constructor(
    private readonly route: ActivatedRoute,
    @Inject(DATA_API) private readonly api: DataApiService,
    private readonly notify: NotificationService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        if (id) {
          this.loadFeed(id);
        }
      });
  }

  acknowledge(anomaly: Anomaly): void {
    const dialogRef = this.dialog.open(AcknowledgeAnomalyDialogComponent, {
      width: '360px'
    });
    dialogRef.afterClosed().subscribe((createIncident) => {
      if (createIncident === undefined) {
        return;
      }
      this.api.acknowledgeAnomaly(anomaly.id, createIncident)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: () => {
          this.notify.success('Anomaly acknowledged.');
          if (this.feed) {
            this.loadFeed(this.feed.id);
          }
        },
        error: () => this.notify.error('Unable to acknowledge anomaly.')
      });
    });
  }

  private loadFeed(feedId: string): void {
    this.loading = true;

    this.api.getFeed(feedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (feed) => {
        this.feed = feed;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Unable to load feed.');
        this.cdr.markForCheck();
      }
    });

    this.api.getMetrics(feedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.updateChart(metrics);
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load metrics.')
    });

    this.api.getAnomalies(feedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (anomalies) => {
        this.anomalies = anomalies;
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load anomalies.')
    });

    this.api.getIncidents(feedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (incidents) => {
        this.incidents = incidents;
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load incidents.')
    });
  }

  private updateChart(metrics: MetricPoint[]): void {
    const sorted = [...metrics].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    this.lineChartLabels = sorted.map((point) =>
      new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    this.lineChartData = [
      {
        data: sorted.map((point) => point.latencyMs),
        label: 'Latency (ms)',
        borderColor: '#1b9aaa',
        backgroundColor: 'rgba(27, 154, 170, 0.18)',
        tension: 0.35
      },
      {
        data: sorted.map((point) => point.errorRate),
        label: 'Error Rate %',
        borderColor: '#d64545',
        backgroundColor: 'rgba(214, 69, 69, 0.18)',
        tension: 0.35
      }
    ];
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
