import { TestBed } from '@angular/core/testing';
import { DataStoreService, POLLING_ENABLED, RULE_COOLDOWN_MS } from './data-store.service';
import { Rule } from '../models';

describe('DataStoreService', () => {
  let service: DataStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: POLLING_ENABLED, useValue: false },
        { provide: RULE_COOLDOWN_MS, useValue: 0 }
      ]
    });
    service = TestBed.inject(DataStoreService);
  });

  it('generates anomaly when rule condition is met', () => {
    const rule: Rule = {
      id: 'rule-test',
      name: 'Error Rate > 1',
      scope: 'feed',
      feedId: 'feed-1',
      metric: 'ErrorRate',
      operator: '>',
      threshold: 1,
      window: '5m',
      severity: 'High',
      enabled: true
    };

    service.addRule(rule);
    const before = service.getAnomalies().length;
    service.applyMetricPoint('feed-1', {
      id: 'metric-test',
      feedId: 'feed-1',
      timestamp: new Date().toISOString(),
      errorRate: 5.5,
      latencyMs: 200,
      volume: 1200
    });
    const after = service.getAnomalies().length;

    expect(after).toBeGreaterThan(before);
  });
});
