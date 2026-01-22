import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { mockDataConfig } from '../mock-data/mock-config';

@Injectable()
export class MockNetworkInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith('/api')) {
      return next.handle(req);
    }

    const { minDelayMs, maxDelayMs, errorRate } = mockDataConfig.network;
    const delayMs = Math.round(minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
    const shouldError = Math.random() < errorRate;

    if (shouldError) {
      return timer(delayMs).pipe(
        mergeMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 503,
                statusText: 'Mock network error',
                url: req.url
              })
          )
        )
      );
    }

    return next.handle(req).pipe(delay(delayMs));
  }
}
