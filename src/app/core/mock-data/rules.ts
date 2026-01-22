import { Rule } from '../models';

export const initialRules: Rule[] = [
  {
    id: 'rule-1',
    name: 'Latency > 800 ms',
    scope: 'all',
    metric: 'Latency',
    operator: '>',
    threshold: 800,
    window: '5m',
    severity: 'High',
    enabled: true
  },
  {
    id: 'rule-2',
    name: 'Error Rate > 4%',
    scope: 'feed',
    feedId: 'feed-2',
    metric: 'ErrorRate',
    operator: '>',
    threshold: 4,
    window: '15m',
    severity: 'Medium',
    enabled: true
  },
  {
    id: 'rule-3',
    name: 'Volume < 900',
    scope: 'feed',
    feedId: 'feed-1',
    metric: 'Volume',
    operator: '<',
    threshold: 900,
    window: '15m',
    severity: 'Low',
    enabled: false
  }
];
