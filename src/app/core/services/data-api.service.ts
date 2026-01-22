import { InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Anomaly, Feed, Incident, IncidentStatus, MetricPoint, Rule } from '../models';
import { environment } from '../../../environments/environment';
import { MockApiService } from './mock-api.service';
import { SupabaseApiService } from './supabase-api.service';

export abstract class DataApiService {
  abstract getFeeds(): Observable<Feed[]>;
  abstract getFeed(id: string): Observable<Feed>;
  abstract getMetrics(feedId?: string): Observable<MetricPoint[]>;
  abstract getAnomalies(feedId?: string): Observable<Anomaly[]>;
  abstract acknowledgeAnomaly(id: string, createIncident?: boolean): Observable<Anomaly>;
  abstract getIncidents(feedId?: string): Observable<Incident[]>;
  abstract createIncident(payload: {
    title: string;
    feedId: string;
    severity: string;
    owner: string;
    description: string;
    anomalyIds: string[];
  }): Observable<Incident>;
  abstract updateIncidentStatus(id: string, status: IncidentStatus, summary: string): Observable<Incident>;
  abstract addIncidentComment(id: string, author: string, message: string): Observable<Incident>;
  abstract getRules(): Observable<Rule[]>;
  abstract addRule(rule: Rule): Observable<Rule>;
  abstract updateRule(rule: Rule): Observable<Rule>;
  abstract refresh(): Observable<void>;
}

export const DATA_API = new InjectionToken<DataApiService>('DATA_API');

export function dataApiFactory(): DataApiService {
  if (environment.supabase.enabled && environment.supabase.url && environment.supabase.anonKey) {
    return inject(SupabaseApiService);
  }
  return inject(MockApiService);
}
