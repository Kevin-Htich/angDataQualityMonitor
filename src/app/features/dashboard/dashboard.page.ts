import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, timer } from 'rxjs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { DATA_API, DataApiService } from '../../core/services/data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Anomaly, Feed, FeedStatus, Incident, MetricPoint, Rule } from '../../core/models';
import { mockDataConfig } from '../../core/mock-data/mock-config';
import { ClockService } from '../../core/services/clock.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    NgChartsModule,
    PageHeaderComponent,
    StatusChipComponent,
    RelativeTimePipe
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  readonly displayedColumns = [
    'name',
    'status',
    'errorRate',
    'latency',
    'anomalies',
    'lastUpdated'
  ];

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<FeedStatus | 'All'>('All', { nonNullable: true });

  dataSource = new MatTableDataSource<Feed>([]);
  feeds: Feed[] = [];
  incidents: Incident[] = [];
  anomalies: Anomaly[] = [];
  rules: Rule[] = [];

  loading = true;
  errorMessage = '';
  countdownSeconds = Math.ceil(mockDataConfig.pollingIntervalMs / 1000);
  private readonly refreshIntervalMs = mockDataConfig.pollingIntervalMs;
  private lastRefreshAt = Date.now();
  readonly now$ = this.clock.now$;

  summary = {
    activeFeeds: 0,
    errorRateAvg: 0,
    incidents: 0,
    criticalIncidents: 0
  };

  errorRateChartData: ChartDataset<'line'>[] = [];
  latencyChartData: ChartDataset<'line'>[] = [];
  lineChartLabels: string[] = [];

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Data Drift', 'Latency Spike', 'Volume Drop'],
    datasets: [
      { data: [0, 0, 0], label: 'Anomalies' }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(
    @Inject(DATA_API) private readonly api: DataApiService,
    private readonly notify: NotificationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    private readonly clock: ClockService
  ) {
    this.dataSource.filterPredicate = (data, filter) => {
      const [search, status] = filter.split('|');
      const matchesSearch = data.name.toLowerCase().includes(search);
      const matchesStatus = status === 'all' || data.status.toLowerCase() === status;
      return matchesSearch && matchesStatus;
    };
  }

  ngOnInit(): void {
    this.loadData();
    this.startCountdown();
    this.startAutoRefresh();

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilter());
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilter());
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  refresh(showToast = true): void {
    this.api.refresh().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadData();
        if (showToast) {
          this.notify.success('Dashboard refreshed.');
        }
      },
      error: () => {
        if (showToast) {
          this.notify.error('Refresh failed. Try again.');
        }
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.lastRefreshAt = Date.now();
    this.countdownSeconds = Math.ceil(this.refreshIntervalMs / 1000);

    this.api.getFeeds().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (feeds) => {
        this.feeds = feeds;
        this.dataSource.data = feeds;
        this.applyFilter();
        this.updateSummary();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load feeds.';
        this.notify.error('Unable to load feeds.');
        this.cdr.markForCheck();
      }
    });

    this.api.getIncidents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (incidents) => {
        this.incidents = incidents;
        this.updateSummary();
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Unable to load incidents.');
      }
    });

    this.api.getAnomalies().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (anomalies) => {
        this.anomalies = anomalies;
        this.updateAnomalyChart();
        this.cdr.markForCheck();
      },
      //error: () => this.notify.error('Unable to load anomalies.')
    });

    this.api.getRules().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rules) => {
        this.rules = rules;
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load rules.')
    });

    this.loadMetrics();
  }

  private loadMetrics(): void {
    this.api.getMetrics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (metrics) => {
        this.updateLineCharts(metrics);
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load metrics.')
    });
  }

  private updateSummary(): void {
    const activeFeeds = this.feeds.length;
    const errorRateAvg =
      this.feeds.reduce((total, feed) => total + feed.errorRate, 0) / Math.max(1, this.feeds.length);
    const incidents = this.incidents.length;
    const criticalIncidents = this.incidents.filter((incident) => incident.severity === 'Critical').length;

    this.summary = {
      activeFeeds,
      errorRateAvg: Number(errorRateAvg.toFixed(2)),
      incidents,
      criticalIncidents
    };
  }

  private updateLineCharts(metrics: MetricPoint[]): void {
    const grouped = new Map<string, MetricPoint[]>();
    metrics.forEach((metric) => {
      if (!grouped.has(metric.feedId)) {
        grouped.set(metric.feedId, []);
      }
      grouped.get(metric.feedId)!.push(metric);
    });

    const palette = [
      { stroke: '#2f8f5b', fill: 'rgba(47, 143, 91, 0.08)' },
      { stroke: '#2563eb', fill: 'rgba(37, 99, 235, 0.08)' },
      { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.08)' },
      { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.08)' }
    ];

    const feedIds = Array.from(grouped.keys());
    const labelSource = grouped.get(feedIds[0] ?? '');
    if (!labelSource) {
      this.lineChartLabels = [];
      this.errorRateChartData = [];
      this.latencyChartData = [];
      return;
    }

    const baseSorted = [...labelSource].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const visible = baseSorted.slice(-6);
    this.lineChartLabels = visible.map((point) =>
      new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    this.errorRateChartData = [];
    this.latencyChartData = [];

    feedIds.forEach((feedId, index) => {
      const feedMetrics = [...(grouped.get(feedId) ?? [])].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const sliced = feedMetrics.slice(-6);
      const color = palette[index % palette.length];
      const feedName = this.feeds.find((feed) => feed.id === feedId)?.name ?? feedId;

      this.errorRateChartData.push({
        data: sliced.map((point) => point.errorRate),
        label: feedName,
        tension: 0.35,
        borderColor: color.stroke,
        backgroundColor: color.fill
      });

      this.latencyChartData.push({
        data: sliced.map((point) => point.latencyMs),
        label: feedName,
        tension: 0.35,
        borderColor: color.stroke,
        backgroundColor: color.fill
      });
    });
  }

  private updateAnomalyChart(): void {
    const counts = { 'Data Drift': 0, 'Latency Spike': 0, 'Volume Drop': 0 } as Record<string, number>;
    this.anomalies.forEach((anomaly) => {
      counts[anomaly.type] += 1;
    });
    this.barChartData = {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          label: 'Alerts',
          backgroundColor: ['#6c63ff', '#ff8a65', '#42a5f5']
        }
      ]
    };
  }

  private applyFilter(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    const status = this.statusControl.value.toLowerCase();
    this.dataSource.filter = `${search}|${status}`;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private startCountdown(): void {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const elapsed = Date.now() - this.lastRefreshAt;
        const remainingMs = this.refreshIntervalMs - (elapsed % this.refreshIntervalMs);
        this.countdownSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        this.cdr.markForCheck();
      });
  }

  private startAutoRefresh(): void {
    timer(this.refreshIntervalMs, this.refreshIntervalMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh(false));
  }

  incidentStatusClass(status: string): string {
    return `status-pill status-${status.toLowerCase().replace(' ', '-')}`;
  }

  anomalyLabel(count: number): string {
    if (count === 0) {
      return '—';
    }
    if (count <= 2) {
      return `${count} Warnings`;
    }
    if (count <= 5) {
      return `${count} Anomalies`;
    }
    return `${count} Alerts`;
  }

  ruleCondition(rule: Rule): string {
    return `${rule.metric} ${rule.operator} ${rule.threshold}`;
  }

  anomalyClass(count: number): string {
    if (count === 0) {
      return 'anomaly-chip anomaly-zero';
    }
    if (count <= 2) {
      return 'anomaly-chip anomaly-warn';
    }
    if (count <= 5) {
      return 'anomaly-chip anomaly-alert';
    }
    return 'anomaly-chip anomaly-critical';
  }

  severityClass(severity: string): string {
    return `status-pill severity-${severity.toLowerCase()}`;
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
