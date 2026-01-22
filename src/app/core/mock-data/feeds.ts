import { Feed } from '../models';

export const initialFeeds: Feed[] = [
  {
    id: 'feed-1',
    name: 'Market Data Feed A',
    status: 'Healthy',
    errorRate: 0.9,
    latencyMs: 220,
    anomalies: ['anomaly-1'],
    lastUpdated: new Date().toISOString(),
    slo: { errorRate: 2, latencyMs: 500 }
  },
  {
    id: 'feed-2',
    name: 'Trade Events Feed',
    status: 'Degraded',
    errorRate: 4.8,
    latencyMs: 640,
    anomalies: ['anomaly-2', 'anomaly-3'],
    lastUpdated: new Date().toISOString(),
    slo: { errorRate: 3, latencyMs: 600 }
  },
  {
    id: 'feed-3',
    name: 'Price Update Feed',
    status: 'Critical',
    errorRate: 11.6,
    latencyMs: 1240,
    anomalies: ['anomaly-4', 'anomaly-5'],
    lastUpdated: new Date().toISOString(),
    slo: { errorRate: 4, latencyMs: 700 }
  },
  {
    id: 'feed-4',
    name: 'News Stream Feed',
    status: 'Healthy',
    errorRate: 0.3,
    latencyMs: 180,
    anomalies: [],
    lastUpdated: new Date().toISOString(),
    slo: { errorRate: 2.5, latencyMs: 450 }
  }
];
