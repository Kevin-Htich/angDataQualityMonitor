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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SeverityChipComponent } from '../../shared/components/severity-chip/severity-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { DATA_API, DataApiService } from '../../core/services/data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Anomaly, Feed, Incident } from '../../core/models';
import { IncidentCreateDialogComponent } from './incident-create.dialog';
import { IncidentDetailDialogComponent } from './incident-detail.dialog';

@Component({
  selector: 'app-incidents-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    PageHeaderComponent,
    SeverityChipComponent,
    RelativeTimePipe
  ],
  templateUrl: './incidents.page.html',
  styleUrl: './incidents.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncidentsPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  readonly displayedColumns = [
    'id',
    'title',
    'feed',
    'severity',
    'status',
    'owner',
    'createdAt',
    'updatedAt'
  ];

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly severityControl = new FormControl('All', { nonNullable: true });
  readonly statusControl = new FormControl('All', { nonNullable: true });

  dataSource = new MatTableDataSource<Incident>([]);
  feeds: Feed[] = [];
  anomalies: Anomaly[] = [];

  loading = true;

  constructor(
    @Inject(DATA_API) private readonly api: DataApiService,
    private readonly notify: NotificationService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef
  ) {
    this.dataSource.filterPredicate = (data, filter) => {
      const [search, severity, status] = filter.split('|');
      const matchesSearch = data.title.toLowerCase().includes(search) || data.id.toLowerCase().includes(search);
      const matchesSeverity = severity === 'all' || data.severity.toLowerCase() === severity;
      const matchesStatus = status === 'all' || data.status.toLowerCase() === status;
      return matchesSearch && matchesSeverity && matchesStatus;
    };
  }

  ngOnInit(): void {
    this.loadData();

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilter());
    this.severityControl.valueChanges
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

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(IncidentCreateDialogComponent, {
      width: '520px',
      data: {
        feeds: this.feeds,
        anomalies: this.anomalies
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.api.createIncident(result)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: () => {
          this.notify.success('Incident created.');
          this.loadIncidents();
        },
        error: () => this.notify.error('Unable to create incident.')
      });
    });
  }

  openDetails(incident: Incident): void {
    const dialogRef = this.dialog.open(IncidentDetailDialogComponent, {
      width: '680px',
      data: { incident }
    });
    dialogRef.afterClosed().subscribe(() => this.loadIncidents());
  }

  getFeedName(feedId: string): string {
    return this.feeds.find((feed) => feed.id === feedId)?.name ?? feedId;
  }

  private loadData(): void {
    this.loading = true;

    this.api.getFeeds().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (feeds) => {
        this.feeds = feeds;
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load feeds.')
    });

    this.api.getAnomalies().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (anomalies) => {
        this.anomalies = anomalies;
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load anomalies.')
    });

    this.loadIncidents();
  }

  private loadIncidents(): void {
    this.api.getIncidents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (incidents) => {
        this.dataSource.data = incidents;
        this.loading = false;
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Unable to load incidents.');
        this.cdr.markForCheck();
      }
    });
  }

  private applyFilter(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    const severity = this.severityControl.value.toLowerCase();
    const status = this.statusControl.value.toLowerCase();
    this.dataSource.filter = `${search}|${severity}|${status}`;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  statusClass(status: string): string {
    return `status-pill status-${status.toLowerCase().replace(' ', '-')}`;
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
