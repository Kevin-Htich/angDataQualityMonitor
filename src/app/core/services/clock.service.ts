import { Injectable } from '@angular/core';
import { map, shareReplay, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now$ = timer(0, 1000).pipe(
    map(() => Date.now()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
