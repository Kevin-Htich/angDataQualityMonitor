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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SeverityChipComponent } from '../../shared/components/severity-chip/severity-chip.component';
import { DATA_API, DataApiService } from '../../core/services/data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Feed, Rule } from '../../core/models';
import { RuleDialogComponent } from './rule-dialog.component';

@Component({
  selector: 'app-rules-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    PageHeaderComponent,
    SeverityChipComponent
  ],
  templateUrl: './rules.page.html',
  styleUrl: './rules.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  readonly displayedColumns = [
    'name',
    'scope',
    'condition',
    'severity',
    'window',
    'enabled'
  ];

  readonly searchControl = new FormControl('', { nonNullable: true });

  dataSource = new MatTableDataSource<Rule>([]);
  feeds: Feed[] = [];
  loading = true;

  constructor(
    @Inject(DATA_API) private readonly api: DataApiService,
    private readonly notify: NotificationService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef
  ) {
    this.dataSource.filterPredicate = (data, filter) =>
      data.name.toLowerCase().includes(filter) ||
      `${data.metric} ${data.operator} ${data.threshold}`.toLowerCase().includes(filter);
  }

  ngOnInit(): void {
    this.loadData();
    this.searchControl.valueChanges
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

  openRuleDialog(): void {
    const dialogRef = this.dialog.open(RuleDialogComponent, {
      width: '560px',
      data: { feeds: this.feeds }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const rule: Rule = {
        ...result,
        id: `rule-${Date.now()}`,
        feedId: result.scope === 'feed' ? result.feedId : undefined
      };
      this.api.addRule(rule)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: () => {
          this.notify.success('Rule added.');
          this.loadRules();
        },
        error: () => this.notify.error('Unable to save rule.')
      });
    });
  }

  toggleRule(rule: Rule): void {
    const updated = { ...rule, enabled: !rule.enabled };
    this.api.updateRule(updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.notify.success('Rule updated.');
        this.loadRules();
      },
      error: () => this.notify.error('Unable to update rule.')
    });
  }

  getScopeLabel(rule: Rule): string {
    if (rule.scope === 'all') {
      return 'All feeds';
    }
    return this.feeds.find((feed) => feed.id === rule.feedId)?.name ?? 'Single feed';
  }

  private loadData(): void {
    this.api.getFeeds().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (feeds) => {
        this.feeds = feeds;
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Unable to load feeds.')
    });
    this.loadRules();
  }

  private loadRules(): void {
    this.loading = true;
    this.api.getRules().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rules) => {
        this.dataSource.data = rules;
        this.loading = false;
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Unable to load rules.');
        this.cdr.markForCheck();
      }
    });
  }

  private applyFilter(): void {
    const filter = this.searchControl.value.trim().toLowerCase();
    this.dataSource.filter = filter;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
