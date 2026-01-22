import { Anomaly } from '../models';

const now = Date.now();

export const initialAnomalies: Anomaly[] = [
  {
    id: 'anomaly-1',
    feedId: 'feed-1',
    type: 'Data Drift',
    severity: 'Low',
    detectedAt: new Date(now - 20 * 60000).toISOString(),
    description: 'Slight schema drift detected in optional metadata fields.',
    acknowledged: false
  },
  {
    id: 'anomaly-2',
    feedId: 'feed-2',
    type: 'Latency Spike',
    severity: 'High',
    detectedAt: new Date(now - 45 * 60000).toISOString(),
    description: 'Latency exceeded 600ms for 5-minute window.',
    acknowledged: false
  },
  {
    id: 'anomaly-3',
    feedId: 'feed-2',
    type: 'Volume Drop',
    severity: 'Medium',
    detectedAt: new Date(now - 70 * 60000).toISOString(),
    description: 'Event volume dropped by 20% versus baseline.',
    acknowledged: true
  },
  {
    id: 'anomaly-4',
    feedId: 'feed-3',
    type: 'Latency Spike',
    severity: 'Critical',
    detectedAt: new Date(now - 35 * 60000).toISOString(),
    description: 'Latency breached critical threshold for 15 minutes.',
    acknowledged: false,
    incidentId: 'incident-1'
  },
  {
    id: 'anomaly-5',
    feedId: 'feed-3',
    type: 'Data Drift',
    severity: 'High',
    detectedAt: new Date(now - 90 * 60000).toISOString(),
    description: 'Unexpected null values in required price field.',
    acknowledged: false,
    incidentId: 'incident-1'
  }
];
