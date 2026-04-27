import { DataColumn, DataRow } from '@/types/data';
import { safeEvaluate } from './safeEval';

export type ColumnRuleType =
  | 'not_null'
  | 'unique'
  | 'regex'
  | 'min'
  | 'max'
  | 'min_length'
  | 'max_length'
  | 'allowed_values';

export interface ColumnRule {
  id: string;
  kind: 'column';
  column: string;
  rule: ColumnRuleType;
  value?: string | number; // regex, min, max, min_length, max_length
  values?: string[]; // allowed_values
  severity: 'error' | 'warning';
  message?: string;
}

export interface RowRule {
  id: string;
  kind: 'row';
  // Optional condition — only enforced when condition evaluates truthy
  when?: string;
  // Required boolean expression that must be true for the row
  must: string;
  severity: 'error' | 'warning';
  message: string;
}

export type QualityRule = ColumnRule | RowRule;

export interface RuleViolation {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  rowIndex?: number;
  column?: string;
}

export interface RuleResult {
  total: number;
  passed: number;
  failed: number;
  violations: RuleViolation[];
}

/**
 * Substitute column references like {col_name} with literal values from the row,
 * then evaluate using the safe expression evaluator.
 */
function evalRowExpr(expr: string, row: DataRow): boolean {
  const substituted = expr.replace(/\{([^}]+)\}/g, (_, key) => {
    const v = row[key.trim()];
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? '1' : '0';
    // strings — wrap in quotes, escape internals
    return `"${String(v).replace(/"/g, '\\"')}"`;
  });
  try {
    const result = safeEvaluate(substituted);
    return Boolean(result);
  } catch {
    return false;
  }
}

export function evaluateRules(
  rules: QualityRule[],
  columns: DataColumn[],
  rows: DataRow[],
): RuleResult {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (rule.kind === 'column') {
      const col = rule.column;
      switch (rule.rule) {
        case 'not_null':
          rows.forEach((row, i) => {
            const v = row[col];
            if (v === null || v === undefined || v === '') {
              violations.push({
                ruleId: rule.id, severity: rule.severity, column: col, rowIndex: i,
                message: rule.message ?? `"${col}" must not be empty`,
              });
            }
          });
          break;
        case 'unique': {
          const seen = new Map<string, number>();
          rows.forEach((row, i) => {
            const v = row[col];
            if (v === null || v === undefined || v === '') return;
            const key = String(v);
            if (seen.has(key)) {
              violations.push({
                ruleId: rule.id, severity: rule.severity, column: col, rowIndex: i,
                message: rule.message ?? `"${col}" must be unique (duplicate of row ${seen.get(key)! + 1})`,
              });
            } else {
              seen.set(key, i);
            }
          });
          break;
        }
        case 'regex': {
          let re: RegExp | null = null;
          try { re = new RegExp(String(rule.value ?? '')); } catch { re = null; }
          if (!re) break;
          rows.forEach((row, i) => {
            const v = row[col];
            if (v === null || v === undefined || v === '') return;
            if (!re!.test(String(v))) {
              violations.push({
                ruleId: rule.id, severity: rule.severity, column: col, rowIndex: i,
                message: rule.message ?? `"${col}" does not match pattern ${rule.value}`,
              });
            }
          });
          break;
        }
        case 'min':
        case 'max': {
          const limit = Number(rule.value);
          if (Number.isNaN(limit)) break;
          rows.forEach((row, i) => {
            const v = row[col];
            if (v === null || v === undefined || v === '') return;
            const n = Number(v);
            if (Number.isNaN(n)) return;
            if ((rule.rule === 'min' && n < limit) || (rule.rule === 'max' && n > limit)) {
              violations.push({
                ruleId: rule.id, severity: rule.severity, column: col, rowIndex: i,
                message: rule.message ?? `"${col}" must be ${rule.rule === 'min' ? '>=' : '<='} ${limit}`,
              });
            }
          });
          break;
        }
        case 'min_length':
        case 'max_length': {
          const limit = Number(rule.value);
          if (Number.isNaN(limit)) break;
          rows.forEach((row, i) => {
            const v = row[col];
            if (v === null || v === undefined) return;
            const len = String(v).length;
            if ((rule.rule === 'min_length' && len < limit) || (rule.rule === 'max_length' && len > limit)) {
              violations.push({
                ruleId: rule.id, severity: rule.severity, column: col, rowIndex: i,
                message: rule.message ?? `"${col}" length must be ${rule.rule === 'min_length' ? '>=' : '<='} ${limit}`,
              });
            }
          });
          break;
        }
        case 'allowed_values': {
          const allowed = new Set((rule.values ?? []).map((v) => String(v)));
          rows.forEach((row, i) => {
            const v = row[col];
            if (v === null || v === undefined || v === '') return;
            if (!allowed.has(String(v))) {
              violations.push({
                ruleId: rule.id, severity: rule.severity, column: col, rowIndex: i,
                message: rule.message ?? `"${col}" must be one of: ${[...allowed].join(', ')}`,
              });
            }
          });
          break;
        }
      }
    } else {
      // Row rule
      rows.forEach((row, i) => {
        if (rule.when && rule.when.trim()) {
          if (!evalRowExpr(rule.when, row)) return;
        }
        const ok = evalRowExpr(rule.must, row);
        if (!ok) {
          violations.push({
            ruleId: rule.id, severity: rule.severity, rowIndex: i,
            message: rule.message,
          });
        }
      });
    }
  }

  // total = number of (rule × row) checks roughly; use rules*rows for completeness rate
  const total = rules.length * rows.length || rules.length;
  const failed = violations.length;
  const passed = Math.max(0, total - failed);
  return { total, passed, failed, violations };
}
