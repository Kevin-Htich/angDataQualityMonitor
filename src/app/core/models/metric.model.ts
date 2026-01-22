export interface MetricPoint {
  id: string;
  feedId: string;
  timestamp: string;
  errorRate: number;
  latencyMs: number;
  volume: number;
}
