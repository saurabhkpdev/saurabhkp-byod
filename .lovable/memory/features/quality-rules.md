---
name: Quality Rules Engine
description: User-defined column + row rules persisted in backend, evaluated in Validate tab
type: feature
---
# Quality Rules Engine

## Storage
- Table `quality_rule_sets` (scope=template|dataset|global, scope_key, rules JSONB, owner_id)
- RLS: owner or admin can mutate; viewable by owner, admin, or global scope
- Rules are an array of `ColumnRule` or `RowRule` (see `src/lib/qualityRules.ts`)

## Rule types
- **Column rules**: not_null, unique, regex, min, max, min_length, max_length, allowed_values
- **Row rules**: optional `when` condition + required `must` boolean expression
  - Reference columns with `{column_name}` syntax
  - Evaluated by `safeEvaluate` (no eval/Function); supports comparisons, &&, ||, math, string equality

## UI
- `CustomRulesPanel` lives at the top of the Validate tab (`DataQualityPanel`)
- `RuleSetEditor` modal lets users add/remove rules with severity (error|warning) and custom messages
- Rule sets are scoped to the current dataset name by default
- Run individual rule sets or "Run all" to see violations inline (capped at 50 displayed)
