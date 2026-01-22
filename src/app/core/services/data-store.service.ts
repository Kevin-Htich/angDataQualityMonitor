import { Inject, Injectable, InjectionToken } from '@angular/core';
import { BehaviorSubject, Subject, merge, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Anomaly,
  AnomalySeverity,
  AnomalyType,
  Feed,
  FeedStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  MetricPoint,
  Rule
} from '../models';
import { initialFeeds } from '../mock-data/feeds';
import { initialMetrics } from '../mock-data/metrics';
import { initialAnomalies } from '../mock-data/anomalies';
import { initialIncidents } from '../mock-data/incidents';
import { initialRules } from '../mock-data/rules';
import { mockDataConfig } from '../mock-data/mock-config';
import { RngService } from './rng.service';
import { evaluateRuleCondition } from '../../shared/utils/rule-utils';

export const POLLING_ENABLED = new InjectionToken<boolean>('POLLING_ENABLED');
export const RULE_COOLDOWN_MS = new InjectionToken<number>('RULE_COOLDOWN_MS');

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  private readonly feedsSubject = new BehaviorSubject<Feed[]>(structuredClone(initialFeeds));
  private readonly metricsSubject = new BehaviorSubject<MetricPoint[]>(structuredClone(initialMetrics));
  private readonly anomaliesSubject = new BehaviorSubject<Anomaly[]>(structuredClone(initialAnomalies));
  private readonly incidentsSubject = new BehaviorSubject<Incident[]>(structuredClone(initialIncidents));
  private readonly rulesSubject = new BehaviorSubject<Rule[]>(structuredClone(initialRules));
  private readonly refreshTrigger = new Subject<void>();
  private readonly ruleTriggerMap = new Map<string, number>();

  readonly feeds$ = this.feedsSubject.asObservable();
  readonly metrics$ = this.metricsSubject.asObservable();
  readonly anomalies$ = this.anomaliesSubject.asObservable();
  readonly incidents$ = this.incidentsSubject.asObservable();
  readonly rules$ = this.rulesSubject.asObservable();

  constructor(
    private readonly rng: RngService,
    @Inject(POLLING_ENABLED) private readonly pollingEnabled: boolean,
    @Inject(RULE_COOLDOWN_MS) private readonly ruleCooldownMs: number
  ) {
    this.rng.setSeed(42);
    if (this.pollingEnabled) {
      merge(timer(0, mockDataConfig.pollingIntervalMs), this.refreshTrigger)
        .pipe(takeUntilDestroyed())
        .subscribe(() => this.updateMetrics());
    }
  }

  triggerRefresh(): void {
    this.refreshTrigger.next();
  }

  getFeeds(): Feed[] {
    return structuredClone(this.feedsSubject.value);
  }

  getFeedById(id: string): Feed | undefined {
    return this.getFeeds().find((feed) => feed.id === id);
  }

  getMetrics(feedId?: string): MetricPoint[] {
    const metrics = this.metricsSubject.value;
    return structuredClone(feedId ? metrics.filter((m) => m.feedId === feedId) : metrics);
  }

  getAnomalies(feedId?: string): Anomaly[] {
    const anomalies = this.anomaliesSubject.value;
    return structuredClone(feedId ? anomalies.filter((a) => a.feedId === feedId) : anomalies);
  }

  getIncidents(feedId?: string): Incident[] {
    const incidents = this.incidentsSubject.value;
    return structuredClone(feedId ? incidents.filter((i) => i.feedId === feedId) : incidents);
  }

  getRules(): Rule[] {
    return structuredClone(this.rulesSubject.value);
  }

  addRule(rule: Rule): Rule {
    const rules = structuredClone(this.rulesSubject.value);
    rules.unshift(rule);
    this.rulesSubject.next(rules);
    return rule;
  }

  updateRule(updated: Rule): Rule {
    const rules = structuredClone(this.rulesSubject.value).map((rule) =>
      rule.id === updated.id ? updated : rule
    );
    this.rulesSubject.next(rules);
    return updated;
  }

  acknowledgeAnomaly(id: string, createIncident?: boolean): { anomaly?: Anomaly; incident?: Incident } {
    const anomalies = structuredClone(this.anomaliesSubject.value);
    const anomalyIndex = anomalies.findIndex((item) => item.id === id);
    if (anomalyIndex === -1) {
      return {};
    }
    anomalies[anomalyIndex] = { ...anomalies[anomalyIndex], acknowledged: true };
    this.anomaliesSubject.next(anomalies);

    let incident: Incident | undefined;
    if (createIncident) {
      incident = this.createIncident({
        title: `Incident for ${anomalies[anomalyIndex].type}`,
        feedId: anomalies[anomalyIndex].feedId,
        severity: this.mapSeverity(anomalies[anomalyIndex].severity),
        owner: 'Auto-Assigned',
        description: anomalies[anomalyIndex].description,
        anomalyIds: [anomalies[anomalyIndex].id]
      });
      anomalies[anomalyIndex] = { ...anomalies[anomalyIndex], incidentId: incident.id };
      this.anomaliesSubject.next(anomalies);
    }

    return { anomaly: anomalies[anomalyIndex], incident };
  }

  createIncident(payload: {
    title: string;
    feedId: string;
    severity: IncidentSeverity;
    owner: string;
    description: string;
    anomalyIds: string[];
  }): Incident {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      title: payload.title,
      feedId: payload.feedId,
      severity: payload.severity,
      status: 'Open',
      owner: payload.owner,
      createdAt: now,
      updatedAt: now,
      description: payload.description,
      anomalies: payload.anomalyIds,
      timeline: [
        {
          id: `event-${Date.now()}`,
          status: 'Open',
          timestamp: now,
          summary: 'Incident created.'
        }
      ],
      comments: []
    };
    const incidents = structuredClone(this.incidentsSubject.value);
    incidents.unshift(incident);
    this.incidentsSubject.next(incidents);
    return incident;
  }

  updateIncidentStatus(id: string, status: IncidentStatus, summary: string): Incident | undefined {
    const incidents = structuredClone(this.incidentsSubject.value);
    const idx = incidents.findIndex((incident) => incident.id === id);
    if (idx === -1) {
      return undefined;
    }
    const now = new Date().toISOString();
    const updated: Incident = {
      ...incidents[idx],
      status,
      updatedAt: now,
      timeline: [
        {
          id: `event-${Date.now()}`,
          status,
          timestamp: now,
          summary
        },
        ...incidents[idx].timeline
      ]
    };
    incidents[idx] = updated;
    this.incidentsSubject.next(incidents);
    return updated;
  }

  addIncidentComment(id: string, author: string, message: string): Incident | undefined {
    const incidents = structuredClone(this.incidentsSubject.value);
    const idx = incidents.findIndex((incident) => incident.id === id);
    if (idx === -1) {
      return undefined;
    }
    const now = new Date().toISOString();
    incidents[idx] = {
      ...incidents[idx],
      updatedAt: now,
      comments: [
        {
          id: `comment-${Date.now()}`,
          author,
          message,
          timestamp: now
        },
        ...incidents[idx].comments
      ]
    };
    this.incidentsSubject.next(incidents);
    return incidents[idx];
  }

  applyMetricPoint(feedId: string, point: MetricPoint): void {
    const metrics = structuredClone(this.metricsSubject.value);
    metrics.push(point);
    this.metricsSubject.next(this.trimMetrics(metrics));
    this.updateFeedFromMetric(feedId, point);
    this.evaluateRules(feedId, point);
  }

  private updateMetrics(): void {
    const feeds = structuredClone(this.feedsSubject.value);
    const metrics = structuredClone(this.metricsSubject.value);
    const now = new Date().toISOString();

    feeds.forEach((feed) => {
      const last = this.getLatestMetric(metrics, feed.id);
      const next = this.generateNextMetric(feed, last, now);
      metrics.push(next);
      this.updateFeedFromMetric(feed.id, next, feeds);
      this.evaluateRules(feed.id, next, metrics, feeds);
    });

    this.metricsSubject.next(this.trimMetrics(metrics));
    this.feedsSubject.next(feeds);
  }

  private updateFeedFromMetric(feedId: string, metric: MetricPoint, feeds = structuredClone(this.feedsSubject.value)): void {
    const feedIndex = feeds.findIndex((feed) => feed.id === feedId);
    if (feedIndex === -1) {
      return;
    }
    const anomalies = this.anomaliesSubject.value.filter(
      (anomaly) => anomaly.feedId === feedId && !anomaly.acknowledged
    );
    const status = this.evaluateStatus(feeds[feedIndex].slo, metric, anomalies);
    feeds[feedIndex] = {
      ...feeds[feedIndex],
      errorRate: Number(metric.errorRate.toFixed(2)),
      latencyMs: Math.round(metric.latencyMs),
      lastUpdated: metric.timestamp,
      status,
      anomalies: anomalies.map((item) => item.id)
    };
    this.feedsSubject.next(feeds);
  }

  private evaluateRules(
    feedId: string,
    metric: MetricPoint,
    metrics = structuredClone(this.metricsSubject.value),
    feeds = structuredClone(this.feedsSubject.value)
  ): void {
    const rules = this.rulesSubject.value.filter(
      (rule) => rule.enabled && (rule.scope === 'all' || rule.feedId === feedId)
    );

    if (!rules.length) {
      return;
    }

    const now = Date.now();
    const anomalies = structuredClone(this.anomaliesSubject.value);

    let triggered = false;

    rules.forEach((rule) => {
      if (!evaluateRuleCondition(rule, metric)) {
        return;
      }
      const key = `${rule.id}:${feedId}`;
      const lastTrigger = this.ruleTriggerMap.get(key) ?? 0;
      if (now - lastTrigger < this.ruleCooldownMs) {
        return;
      }
      this.ruleTriggerMap.set(key, now);
      const anomaly = this.buildAnomaly(feedId, rule, metric);
      anomalies.unshift(anomaly);
      triggered = true;
      const feedIndex = feeds.findIndex((feed) => feed.id === feedId);
      if (feedIndex !== -1) {
        feeds[feedIndex] = {
          ...feeds[feedIndex],
          anomalies: [anomaly.id, ...feeds[feedIndex].anomalies]
        };
      }
    });

    if (triggered) {
      const feedIndex = feeds.findIndex((feed) => feed.id === feedId);
      if (feedIndex !== -1) {
        const feedAnomalies = anomalies.filter(
          (item) => item.feedId === feedId && !item.acknowledged
        );
        feeds[feedIndex] = {
          ...feeds[feedIndex],
          status: this.evaluateStatus(feeds[feedIndex].slo, metric, feedAnomalies),
          anomalies: feedAnomalies.map((item) => item.id)
        };
      }
    }

    this.anomaliesSubject.next(anomalies);
    this.feedsSubject.next(feeds);
  }

  private buildAnomaly(feedId: string, rule: Rule, metric: MetricPoint): Anomaly {
    const typeMap: Record<string, AnomalyType> = {
      Latency: 'Latency Spike',
      ErrorRate: 'Data Drift',
      Volume: 'Volume Drop'
    };
    const description = `${rule.metric} ${rule.operator} ${rule.threshold} for ${rule.window}`;
    return {
      id: `anomaly-${Date.now()}-${this.rng.nextInt(100, 999)}`,
      feedId,
      type: typeMap[rule.metric],
      severity: rule.severity,
      detectedAt: metric.timestamp,
      description,
      acknowledged: false
    };
  }

  private mapSeverity(severity: AnomalySeverity): IncidentSeverity {
    switch (severity) {
      case 'Critical':
        return 'Critical';
      case 'High':
        return 'High';
      case 'Medium':
        return 'Medium';
      default:
        return 'Low';
    }
  }

  private evaluateStatus(slo: { errorRate: number; latencyMs: number }, metric: MetricPoint, anomalies: Anomaly[]): FeedStatus {
    const criticalAnomaly = anomalies.some((anomaly) => anomaly.severity === 'Critical');
    if (criticalAnomaly || metric.errorRate > slo.errorRate * 2 || metric.latencyMs > slo.latencyMs * 2) {
      return 'Critical';
    }
    if (metric.errorRate > slo.errorRate || metric.latencyMs > slo.latencyMs) {
      return 'Degraded';
    }
    return 'Healthy';
  }

  private getLatestMetric(metrics: MetricPoint[], feedId: string): MetricPoint | undefined {
    return metrics
      .filter((metric) => metric.feedId === feedId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  private generateNextMetric(feed: Feed, last: MetricPoint | undefined, timestamp: string): MetricPoint {
    const baseError = last?.errorRate ?? feed.errorRate;
    const baseLatency = last?.latencyMs ?? feed.latencyMs;
    const baseVolume = last?.volume ?? 1000;

    const errorRate = Math.max(0.1, baseError + this.rng.nextFloat(-0.8, 0.8));
    const latencyMs = Math.max(120, baseLatency + this.rng.nextFloat(-140, 180));
    const volume = Math.max(400, baseVolume + this.rng.nextFloat(-180, 200));

    return {
      id: `${feed.id}-metric-${Date.now()}`,
      feedId: feed.id,
      timestamp,
      errorRate: Number(errorRate.toFixed(2)),
      latencyMs: Math.round(latencyMs),
      volume: Math.round(volume)
    };
  }

  private trimMetrics(metrics: MetricPoint[]): MetricPoint[] {
    const cutoff = Date.now() - 24 * 60 * 60000;
    return metrics.filter((metric) => new Date(metric.timestamp).getTime() >= cutoff);
  }
}
