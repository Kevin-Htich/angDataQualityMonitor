export type IncidentStatus = 'Open' | 'Investigating' | 'In Progress' | 'Resolved';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IncidentTimelineEvent {
  id: string;
  status: IncidentStatus;
  timestamp: string;
  summary: string;
}

export interface IncidentComment {
  id: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  feedId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  anomalies: string[];
  timeline: IncidentTimelineEvent[];
  comments: IncidentComment[];
}
