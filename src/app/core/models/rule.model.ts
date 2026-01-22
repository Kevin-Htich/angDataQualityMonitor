import { AnomalySeverity } from './anomaly.model';

export type RuleScope = 'all' | 'feed';
export type MetricType = 'Latency' | 'ErrorRate' | 'Volume';
export type RuleOperator = '>' | '>=' | '<' | '<=';

export interface Rule {
  id: string;
  name: string;
  scope: RuleScope;
  feedId?: string;
  metric: MetricType;
  operator: RuleOperator;
  threshold: number;
  window: '5m' | '15m' | '1h';
  severity: AnomalySeverity;
  enabled: boolean;
}
