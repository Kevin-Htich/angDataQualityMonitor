import { MetricPoint } from '../models';

const lcg = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
})();

const feedBases = {
  'feed-1': { errorRate: 1.2, latency: 240, volume: 1200 },
  'feed-2': { errorRate: 4.8, latency: 620, volume: 980 },
  'feed-3': { errorRate: 10.8, latency: 1180, volume: 880 },
  'feed-4': { errorRate: 0.6, latency: 180, volume: 1400 }
} as const;

const feeds = Object.keys(feedBases);
const points: MetricPoint[] = [];
const now = Date.now();

feeds.forEach((feedId) => {
  for (let i = 23; i >= 0; i -= 1) {
    const base = feedBases[feedId as keyof typeof feedBases];
    const timestamp = new Date(now - i * 60 * 60000).toISOString();
    const jitter = (value: number, variance: number) =>
      Math.max(0, value + (lcg() - 0.5) * variance);

    points.push({
      id: `${feedId}-metric-${i}`,
      feedId,
      timestamp,
      errorRate: Number(jitter(base.errorRate, base.errorRate * 0.6).toFixed(2)),
      latencyMs: Math.round(jitter(base.latency, base.latency * 0.4)),
      volume: Math.round(jitter(base.volume, base.volume * 0.3))
    });
  }
});

export const initialMetrics: MetricPoint[] = points;
