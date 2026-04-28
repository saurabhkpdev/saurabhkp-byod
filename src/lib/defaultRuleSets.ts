import { QualityRule } from './qualityRules';

export interface DefaultRuleSet {
  name: string;
  description: string;
  rules: QualityRule[];
}

/**
 * Reusable default rule sets that can be seeded into the inventory
 * when a user has no visible rule sets yet.
 */
export const DEFAULT_RULE_SETS: DefaultRuleSet[] = [
  {
    name: 'Common / Identity',
    description: 'Basic checks for id, name, email and phone columns.',
    rules: [
      { id: 'c1', kind: 'column', column: 'id', rule: 'not_null', severity: 'error' },
      { id: 'c2', kind: 'column', column: 'id', rule: 'unique', severity: 'error' },
      { id: 'c3', kind: 'column', column: 'name', rule: 'not_null', severity: 'error' },
      { id: 'c4', kind: 'column', column: 'email', rule: 'regex', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', severity: 'error', message: 'invalid email format' },
      { id: 'c5', kind: 'column', column: 'phone', rule: 'regex', value: '^[+0-9 ()\\-]{7,}$', severity: 'warning', message: 'unusual phone format' },
    ] as QualityRule[],
  },
  {
    name: 'Geo Data',
    description: 'Range checks for latitude and longitude.',
    rules: [
      { id: 'g1', kind: 'column', column: 'latitude', rule: 'min', value: -90, severity: 'error' },
      { id: 'g2', kind: 'column', column: 'latitude', rule: 'max', value: 90, severity: 'error' },
      { id: 'g3', kind: 'column', column: 'longitude', rule: 'min', value: -180, severity: 'error' },
      { id: 'g4', kind: 'column', column: 'longitude', rule: 'max', value: 180, severity: 'error' },
    ] as QualityRule[],
  },
  {
    name: 'Sales Transactions',
    description: 'Validates positive quantity/price and that totals match.',
    rules: [
      { id: 's1', kind: 'column', column: 'quantity', rule: 'not_null', severity: 'error' },
      { id: 's2', kind: 'column', column: 'unit_price', rule: 'not_null', severity: 'error' },
      { id: 's3', kind: 'column', column: 'quantity', rule: 'min', value: 1, severity: 'error' },
      { id: 's4', kind: 'column', column: 'unit_price', rule: 'min', value: 0, severity: 'error' },
      { id: 's5', kind: 'row', must: '{total} == {quantity} * {unit_price}', severity: 'warning', message: 'total does not match quantity x unit_price' },
    ] as QualityRule[],
  },
];
