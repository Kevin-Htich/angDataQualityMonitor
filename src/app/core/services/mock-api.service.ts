import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Anomaly, Feed, Incident, IncidentStatus, MetricPoint, Rule } from '../models';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  constructor(private readonly http: HttpClient) {}

  getFeeds(): Observable<Feed[]> {
    return this.http.get<Feed[]>('/api/feeds');
  }

  getFeed(id: string): Observable<Feed> {
    return this.http.get<Feed>(`/api/feeds/${id}`);
  }

  getMetrics(feedId?: string): Observable<MetricPoint[]> {
    let params = new HttpParams();
    if (feedId) {
      params = params.set('feedId', feedId);
    }
    return this.http.get<MetricPoint[]>('/api/metrics', { params });
  }

  getAnomalies(feedId?: string): Observable<Anomaly[]> {
    let params = new HttpParams();
    if (feedId) {
      params = params.set('feedId', feedId);
    }
    return this.http.get<Anomaly[]>('/api/anomalies', { params });
  }

  acknowledgeAnomaly(id: string, createIncident = false): Observable<Anomaly> {
    return this.http.post<Anomaly>(`/api/anomalies/${id}/ack`, { createIncident });
  }

  getIncidents(feedId?: string): Observable<Incident[]> {
    let params = new HttpParams();
    if (feedId) {
      params = params.set('feedId', feedId);
    }
    return this.http.get<Incident[]>('/api/incidents', { params });
  }

  createIncident(payload: {
    title: string;
    feedId: string;
    severity: string;
    owner: string;
    description: string;
    anomalyIds: string[];
  }): Observable<Incident> {
    return this.http.post<Incident>('/api/incidents', payload);
  }

  updateIncidentStatus(id: string, status: IncidentStatus, summary: string): Observable<Incident> {
    return this.http.patch<Incident>(`/api/incidents/${id}`, { status, summary });
  }

  addIncidentComment(id: string, author: string, message: string): Observable<Incident> {
    return this.http.post<Incident>(`/api/incidents/${id}/comments`, { author, message });
  }

  getRules(): Observable<Rule[]> {
    return this.http.get<Rule[]>('/api/rules');
  }

  addRule(rule: Rule): Observable<Rule> {
    return this.http.post<Rule>('/api/rules', rule);
  }

  updateRule(rule: Rule): Observable<Rule> {
    return this.http.put<Rule>(`/api/rules/${rule.id}`, rule);
  }

  refresh(): Observable<void> {
    return this.http.post<void>('/api/refresh', {});
  }
}
