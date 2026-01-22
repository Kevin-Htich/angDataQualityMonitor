import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { DataStoreService } from '../services/data-store.service';
import { Rule } from '../models';

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  constructor(private readonly store: DataStoreService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith('/api')) {
      return next.handle(req);
    }

    try {
      const url = req.url.split('?')[0];
      const path = url.replace('/api/', '');
      const segments = path.split('/').filter(Boolean);
      const [resource, id, action] = segments;

      if (req.method === 'GET' && resource === 'feeds') {
        if (id) {
          const feed = this.store.getFeedById(id);
          return feed ? this.ok(feed) : this.notFound('Feed not found');
        }
        return this.ok(this.store.getFeeds());
      }

      if (req.method === 'GET' && resource === 'metrics') {
        const feedId = req.params.get('feedId') ?? undefined;
        return this.ok(this.store.getMetrics(feedId));
      }

      if (req.method === 'GET' && resource === 'anomalies') {
        const feedId = req.params.get('feedId') ?? undefined;
        return this.ok(this.store.getAnomalies(feedId));
      }

      if (req.method === 'POST' && resource === 'anomalies' && id && action === 'ack') {
        const { createIncident } = req.body as { createIncident?: boolean };
        const result = this.store.acknowledgeAnomaly(id, createIncident);
        if (!result.anomaly) {
          return this.notFound('Anomaly not found');
        }
        return this.ok(result.anomaly);
      }

      if (req.method === 'GET' && resource === 'incidents') {
        const feedId = req.params.get('feedId') ?? undefined;
        return this.ok(this.store.getIncidents(feedId));
      }

      if (req.method === 'POST' && resource === 'incidents') {
        const payload = req.body as {
          title: string;
          feedId: string;
          severity: string;
          owner: string;
          description: string;
          anomalyIds: string[];
        };
        const incident = this.store.createIncident({
          title: payload.title,
          feedId: payload.feedId,
          severity: payload.severity as any,
          owner: payload.owner,
          description: payload.description,
          anomalyIds: payload.anomalyIds ?? []
        });
        return this.ok(incident);
      }

      if (req.method === 'PATCH' && resource === 'incidents' && id) {
        const { status, summary } = req.body as { status: any; summary: string };
        const incident = this.store.updateIncidentStatus(id, status, summary ?? 'Status updated.');
        return incident ? this.ok(incident) : this.notFound('Incident not found');
      }

      if (req.method === 'POST' && resource === 'incidents' && id && action === 'comments') {
        const { author, message } = req.body as { author: string; message: string };
        const incident = this.store.addIncidentComment(id, author, message);
        return incident ? this.ok(incident) : this.notFound('Incident not found');
      }

      if (req.method === 'GET' && resource === 'rules') {
        return this.ok(this.store.getRules());
      }

      if (req.method === 'POST' && resource === 'rules') {
        const rule = req.body as Rule;
        return this.ok(this.store.addRule(rule));
      }

      if (req.method === 'PUT' && resource === 'rules' && id) {
        const rule = req.body as Rule;
        return this.ok(this.store.updateRule(rule));
      }

      if (req.method === 'POST' && resource === 'refresh') {
        this.store.triggerRefresh();
        return this.ok({});
      }

      return this.notFound('Route not found');
    } catch (error) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Mock backend error',
            error
          })
      );
    }
  }

  private ok<T>(body: T): Observable<HttpEvent<T>> {
    return of(new HttpResponse({ status: 200, body }));
  }

  private notFound(message: string): Observable<HttpEvent<unknown>> {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 404,
          statusText: message
        })
    );
  }
}
