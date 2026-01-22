import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { MockApiService } from '../../core/services/mock-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Anomaly, Feed, FeedStatus, Incident, MetricPoint } from '../../core/models';

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
  readonly feedSelectControl = new FormControl('feed-1', { nonNullable: true });

  dataSource = new MatTableDataSource<Feed>([]);
  feeds: Feed[] = [];
  incidents: Incident[] = [];
  anomalies: Anomaly[] = [];

  loading = true;
  errorMessage = '';

  summary = {
    activeFeeds: 0,
    errorRateAvg: 0,
    incidents: 0,
    criticalIncidents: 0
  };

  lineChartData: ChartDataset<'line'>[] = [];
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
    private readonly api: MockApiService,
    private readonly notify: NotificationService,
    private readonly cdr: ChangeDetectorRef
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

    this.searchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.applyFilter());
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.applyFilter());
    this.feedSelectControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((feedId) => {
      this.loadMetrics(feedId);
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  refresh(): void {
    this.api.refresh().pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.loadData();
        this.notify.success('Dashboard refreshed.');
      },
      error: () => this.notify.error('Refresh failed. Try again.')
    });
  }

  private loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getFeeds().pipe(takeUntilDestroyed()).subscribe({
      next: (feeds) => {
        this.feeds = feeds;
        this.dataSource.data = feeds;
        if (!this.feedSelectControl.value && feeds.length) {
          this.feedSelectControl.setValue(feeds[0].id);
        }
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

    this.api.getIncidents().pipe(takeUntilDestroyed()).subscribe({
      next: (incidents) => {
        this.incidents = incidents;
        this.updateSummary();
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Unable to load incidents.');
      }
    });

    this.api.getAnomalies().pipe(takeUntilDestroyed()).subscribe({
      next: (anomalies) => {
        this.anomalies = anomalies;
        this.updateAnomalyChart();
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load anomalies.')
    });

    this.loadMetrics(this.feedSelectControl.value);
  }

  private loadMetrics(feedId: string): void {
    if (!feedId) {
      return;
    }
    this.api.getMetrics(feedId).pipe(takeUntilDestroyed()).subscribe({
      next: (metrics) => {
        this.updateLineChart(metrics);
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

  private updateLineChart(metrics: MetricPoint[]): void {
    const sorted = [...metrics].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    this.lineChartLabels = sorted.map((point) =>
      new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    this.lineChartData = [
      {
        data: sorted.map((point) => point.errorRate),
        label: 'Error Rate %',
        tension: 0.35,
        borderColor: '#d64545',
        backgroundColor: 'rgba(214, 69, 69, 0.18)'
      },
      {
        data: sorted.map((point) => point.latencyMs),
        label: 'Latency (ms)',
        tension: 0.35,
        borderColor: '#1b9aaa',
        backgroundColor: 'rgba(27, 154, 170, 0.18)'
      }
    ];
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

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
