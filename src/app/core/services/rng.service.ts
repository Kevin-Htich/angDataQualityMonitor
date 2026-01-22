import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RngService {
  private seed = 123456789;

  setSeed(seed: number): void {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextFloat(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }
}
