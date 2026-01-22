import { MetricPoint, Rule } from '../../core/models';

export function evaluateRuleCondition(rule: Rule, metric: MetricPoint): boolean {
  const value = rule.metric === 'Latency'
    ? metric.latencyMs
    : rule.metric === 'ErrorRate'
      ? metric.errorRate
      : metric.volume;

  switch (rule.operator) {
    case '>':
      return value > rule.threshold;
    case '>=':
      return value >= rule.threshold;
    case '<':
      return value < rule.threshold;
    case '<=':
      return value <= rule.threshold;
    default:
      return false;
  }
}
