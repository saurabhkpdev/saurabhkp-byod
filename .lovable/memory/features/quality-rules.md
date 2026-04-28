---
name: Quality Rules Engine
description: Centralized admin-managed inventory of quality rule sets, attachable many-to-many to templates and datasets
type: feature
---
# Quality Rules Engine

## Architecture
- **Inventory page**: `/quality-rules` — central catalog. Anyone signed in can browse; only admins (sys/role/super) can create, edit, delete (enforced by RLS).
- **Attachments**: many-to-many via `template_quality_rules` and `dataset_quality_rules` join tables. Dataset attachments key on `dataset_name` (string) so they survive new versions.
- **Validate tab**: runs the union of rule sets attached to the current template + dataset. No inline editor — `CustomRulesPanel` is now read/run only.

## Storage
- `quality_rule_sets` — owner_id, scope (kept for legacy; new ones are 'global'), rules JSONB
- `template_quality_rules` (template_id, rule_set_id) UNIQUE — admin only
- `dataset_quality_rules` (dataset_name, rule_set_id) UNIQUE — admin only

## Rule types
- **Column**: not_null, unique, regex, min, max, min_length, max_length, allowed_values
- **Row**: optional `when` + required `must` boolean expression. Reference columns with `{column_name}`. Evaluated by `safeEvaluate` (no eval/Function).

## UI entry points
- Sidebar: "Quality Rules" (ListChecks icon) → `/quality-rules` inventory
- Template Library: ListChecks button on each custom template (admin only) opens `RuleSetAttachDialog`
- Dataset Library "My Datasets" tab: Rules button on each card (admin only) opens `RuleSetAttachDialog`
- Data Studio Validate tab: `CustomRulesPanel` auto-loads attached rules via `fetchAttachedRuleSets({ templateId, datasetName })`

## Key files
- `src/pages/QualityRules.tsx` — inventory CRUD
- `src/components/RuleSetEditor.tsx` — create/edit dialog (used by inventory)
- `src/components/RuleSetAttachDialog.tsx` — checkbox picker for attachments
- `src/components/CustomRulesPanel.tsx` — runner shown in Validate tab
- `src/hooks/useQualityRules.ts` — inventory hook + attachment helpers (`getTemplateRuleAttachments`, `setTemplateRuleAttachments`, `getDatasetRuleAttachments`, `setDatasetRuleAttachments`, `fetchAttachedRuleSets`)
