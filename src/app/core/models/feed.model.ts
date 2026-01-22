export type FeedStatus = 'Healthy' | 'Degraded' | 'Critical';

export interface FeedSlo {
  errorRate: number;
  latencyMs: number;
}

export interface Feed {
  id: string;
  name: string;
  status: FeedStatus;
  errorRate: number;
  latencyMs: number;
  anomalies: string[];
  lastUpdated: string;
  slo: FeedSlo;
}
