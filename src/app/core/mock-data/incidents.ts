import { Incident } from '../models';

const now = Date.now();

export const initialIncidents: Incident[] = [
  {
    id: 'incident-1',
    title: 'Price Feed Latency High',
    feedId: 'feed-3',
    severity: 'Critical',
    status: 'Investigating',
    owner: 'M. Patel',
    createdAt: new Date(now - 2 * 60 * 60000).toISOString(),
    updatedAt: new Date(now - 30 * 60000).toISOString(),
    description: 'Latency above 1200ms impacting downstream pricing calculations.',
    anomalies: ['anomaly-4', 'anomaly-5'],
    timeline: [
      {
        id: 'event-1',
        status: 'Open',
        timestamp: new Date(now - 2 * 60 * 60000).toISOString(),
        summary: 'Incident opened after SLA breach.'
      },
      {
        id: 'event-2',
        status: 'Investigating',
        timestamp: new Date(now - 90 * 60000).toISOString(),
        summary: 'On-call engaged and checking upstream services.'
      }
    ],
    comments: [
      {
        id: 'comment-1',
        author: 'M. Patel',
        message: 'Rerouting traffic to backup feed while investigating.',
        timestamp: new Date(now - 60 * 60000).toISOString()
      }
    ]
  },
  {
    id: 'incident-2',
    title: 'Trade Feed Errors',
    feedId: 'feed-2',
    severity: 'High',
    status: 'Open',
    owner: 'S. Lopez',
    createdAt: new Date(now - 3 * 60 * 60000).toISOString(),
    updatedAt: new Date(now - 120 * 60000).toISOString(),
    description: 'Error rate spiked above 5% for trade events feed.',
    anomalies: ['anomaly-2'],
    timeline: [
      {
        id: 'event-3',
        status: 'Open',
        timestamp: new Date(now - 3 * 60 * 60000).toISOString(),
        summary: 'Incident opened after error spike.'
      }
    ],
    comments: []
  }
];
