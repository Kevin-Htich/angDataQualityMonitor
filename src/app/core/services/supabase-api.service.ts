import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, map, Observable, switchMap } from 'rxjs';
import {
  Anomaly,
  Feed,
  Incident,
  IncidentStatus,
  MetricPoint,
  Rule
} from '../models';
import { environment } from '../../../environments/environment';
import { DataApiService } from './data-api.service';

@Injectable({ providedIn: 'root' })
export class SupabaseApiService extends DataApiService {
  private readonly client: SupabaseClient;

  constructor() {
    super();
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  getFeeds(): Observable<Feed[]> {
    return this.fromSupabase<any[]>(this.client.from('feeds').select('*').order('name')).pipe(
      map((rows: any[]) => rows.map((row: any) => this.mapFeed(row)))
    );
  }

  getFeed(id: string): Observable<Feed> {
    return this.fromSupabase<any>(this.client.from('feeds').select('*').eq('id', id).single()).pipe(
      map((row: any) => this.mapFeed(row))
    );
  }

  getMetrics(feedId?: string): Observable<MetricPoint[]> {
    let query = this.client.from('metrics').select('*').order('timestamp');
    if (feedId) {
      query = query.eq('feed_id', feedId);
    }
    return this.fromSupabase<any[]>(query).pipe(
      map((rows: any[]) => rows.map((row: any) => this.mapMetric(row)))
    );
  }

  getAnomalies(feedId?: string): Observable<Anomaly[]> {
    let query = this.client.from('anomalies').select('*').order('detected_at', { ascending: false });
    if (feedId) {
      query = query.eq('feed_id', feedId);
    }
    return this.fromSupabase<any[]>(query).pipe(
      map((rows: any[]) => rows.map((row: any) => this.mapAnomaly(row)))
    );
  }

  acknowledgeAnomaly(id: string, createIncident = false): Observable<Anomaly> {
    if (!createIncident) {
      return this.fromSupabase<any>(
        this.client.from('anomalies').update({ acknowledged: true }).eq('id', id).select('*').single()
      ).pipe(map((row: any) => this.mapAnomaly(row)));
    }

    return this.fromSupabase<any>(this.client.from('anomalies').select('*').eq('id', id).single()).pipe(
      switchMap((row) => {
        const anomaly = this.mapAnomaly(row);
        return this.createIncident({
          title: `Incident for ${anomaly.type}`,
          feedId: anomaly.feedId,
          severity: anomaly.severity,
          owner: 'Auto-Assigned',
          description: anomaly.description,
          anomalyIds: [anomaly.id]
        }).pipe(
          switchMap((incident) =>
            this.fromSupabase<any>(
              this.client
                .from('anomalies')
                .update({ acknowledged: true, incident_id: incident.id })
                .eq('id', id)
                .select('*')
                .single()
            ).pipe(map((updated: any) => this.mapAnomaly(updated)))
          )
        );
      })
    );
  }

  getIncidents(feedId?: string): Observable<Incident[]> {
    let query = this.client.from('incidents').select('*').order('created_at', { ascending: false });
    if (feedId) {
      query = query.eq('feed_id', feedId);
    }
    return this.fromSupabase<any[]>(query).pipe(
      map((rows: any[]) => rows.map((row: any) => this.mapIncident(row)))
    );
  }

  createIncident(payload: {
    title: string;
    feedId: string;
    severity: string;
    owner: string;
    description: string;
    anomalyIds: string[];
  }): Observable<Incident> {
    const now = new Date().toISOString();
    const record = {
      id: `incident-${Date.now()}`,
      title: payload.title,
      feed_id: payload.feedId,
      severity: payload.severity,
      status: 'Open',
      owner: payload.owner,
      created_at: now,
      updated_at: now,
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
    return this.fromSupabase<any>(this.client.from('incidents').insert(record).select('*').single()).pipe(
      map((row: any) => this.mapIncident(row))
    );
  }

  updateIncidentStatus(id: string, status: IncidentStatus, summary: string): Observable<Incident> {
    return this.fromSupabase<any>(this.client.from('incidents').select('*').eq('id', id).single()).pipe(
      switchMap((row) => {
        const incident = this.mapIncident(row);
        const now = new Date().toISOString();
        const timeline = [
          { id: `event-${Date.now()}`, status, timestamp: now, summary },
          ...incident.timeline
        ];
        return this.fromSupabase<any>(
          this.client
            .from('incidents')
            .update({ status, updated_at: now, timeline })
            .eq('id', id)
            .select('*')
            .single()
        ).pipe(map((updated: any) => this.mapIncident(updated)));
      })
    );
  }

  addIncidentComment(id: string, author: string, message: string): Observable<Incident> {
    return this.fromSupabase<any>(this.client.from('incidents').select('*').eq('id', id).single()).pipe(
      switchMap((row) => {
        const incident = this.mapIncident(row);
        const now = new Date().toISOString();
        const comments = [
          { id: `comment-${Date.now()}`, author, message, timestamp: now },
          ...incident.comments
        ];
        return this.fromSupabase<any>(
          this.client
            .from('incidents')
            .update({ comments, updated_at: now })
            .eq('id', id)
            .select('*')
            .single()
        ).pipe(map((updated: any) => this.mapIncident(updated)));
      })
    );
  }

  getRules(): Observable<Rule[]> {
    return this.fromSupabase<any[]>(
      this.client.from('rules').select('*').order('created_at', { ascending: false })
    ).pipe(map((rows: any[]) => rows.map((row: any) => this.mapRule(row))));
  }

  addRule(rule: Rule): Observable<Rule> {
    const record = this.mapRuleToRow(rule);
    return this.fromSupabase<any>(this.client.from('rules').insert(record).select('*').single()).pipe(
      map((row: any) => this.mapRule(row))
    );
  }

  updateRule(rule: Rule): Observable<Rule> {
    const record = this.mapRuleToRow(rule);
    return this.fromSupabase<any>(
      this.client.from('rules').update(record).eq('id', rule.id).select('*').single()
    ).pipe(map((row: any) => this.mapRule(row)));
  }

  refresh(): Observable<void> {
    return from(Promise.resolve()).pipe(map(() => undefined));
  }

  private fromSupabase<T>(request: any): Observable<T> {
    return from(request as PromiseLike<{ data: T | null; error: any }>).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        if (data === null) {
          throw new Error('Supabase returned no data.');
        }
        return data;
      })
    );
  }

  private mapFeed(row: any): Feed {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      errorRate: row.error_rate ?? row.errorRate ?? 0,
      latencyMs: row.latency_ms ?? row.latencyMs ?? 0,
      anomalies: row.anomalies ?? [],
      lastUpdated: row.last_updated ?? row.lastUpdated ?? new Date().toISOString(),
      slo: {
        errorRate: row.slo_error_rate ?? row.slo?.errorRate ?? 0,
        latencyMs: row.slo_latency_ms ?? row.slo?.latencyMs ?? 0
      }
    };
  }

  private mapMetric(row: any): MetricPoint {
    return {
      id: row.id,
      feedId: row.feed_id ?? row.feedId,
      timestamp: row.timestamp,
      errorRate: row.error_rate ?? row.errorRate,
      latencyMs: row.latency_ms ?? row.latencyMs,
      volume: row.volume
    };
  }

  private mapAnomaly(row: any): Anomaly {
    return {
      id: row.id,
      feedId: row.feed_id ?? row.feedId,
      type: row.type,
      severity: row.severity,
      detectedAt: row.detected_at ?? row.detectedAt,
      description: row.description,
      acknowledged: row.acknowledged,
      incidentId: row.incident_id ?? row.incidentId
    };
  }

  private mapIncident(row: any): Incident {
    return {
      id: row.id,
      title: row.title,
      feedId: row.feed_id ?? row.feedId,
      severity: row.severity,
      status: row.status,
      owner: row.owner,
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
      description: row.description,
      anomalies: row.anomalies ?? [],
      timeline: row.timeline ?? [],
      comments: row.comments ?? []
    };
  }

  private mapRule(row: any): Rule {
    return {
      id: row.id,
      name: row.name,
      scope: row.scope,
      feedId: row.feed_id ?? row.feedId ?? undefined,
      metric: row.metric,
      operator: row.operator,
      threshold: row.threshold,
      window: row.window,
      severity: row.severity,
      enabled: row.enabled
    };
  }

  private mapRuleToRow(rule: Rule): any {
    return {
      id: rule.id,
      name: rule.name,
      scope: rule.scope,
      feed_id: rule.feedId ?? null,
      metric: rule.metric,
      operator: rule.operator,
      threshold: rule.threshold,
      window: rule.window,
      severity: rule.severity,
      enabled: rule.enabled,
      created_at: new Date().toISOString()
    };
  }
}
