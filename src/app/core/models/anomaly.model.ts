export type AnomalyType = 'Data Drift' | 'Latency Spike' | 'Volume Drop';
export type AnomalySeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Anomaly {
  id: string;
  feedId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  detectedAt: string;
  description: string;
  acknowledged: boolean;
  incidentId?: string;
}
