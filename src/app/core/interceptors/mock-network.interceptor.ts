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
import { RngService } from '../services/rng.service';

@Injectable()
export class MockNetworkInterceptor implements HttpInterceptor {
  constructor(private readonly rng: RngService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith('/api')) {
      return next.handle(req);
    }

    const { minDelayMs, maxDelayMs, errorRate } = mockDataConfig.network;
    const delayMs = Math.round(this.rng.nextFloat(minDelayMs, maxDelayMs));
    const shouldError = this.rng.next() < errorRate;

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
