import { useMemo, useState } from 'react';
import { Plus, Play, Edit2, Trash2, ListChecks, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { DataColumn, DataRow } from '@/types/data';
import { useQualityRules, RuleSet } from '@/hooks/useQualityRules';
import { evaluateRules, RuleResult } from '@/lib/qualityRules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RuleSetEditor } from './RuleSetEditor';

interface Props {
  columns: DataColumn[];
  rows: DataRow[];
  datasetName?: string;
}

export function CustomRulesPanel({ columns, rows, datasetName }: Props) {
  const { ruleSets, loading, saveRuleSet, deleteRuleSet } = useQualityRules({
    scope: 'dataset', scopeKey: datasetName ?? null,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RuleSet | null>(null);
  const [results, setResults] = useState<Record<string, RuleResult>>({});

  const total = ruleSets.length;
  const run = (rs: RuleSet) => {
    const result = evaluateRules(rs.rules, columns, rows);
    setResults((prev) => ({ ...prev, [rs.id]: result }));
  };

  const runAll = () => {
    const next: Record<string, RuleResult> = {};
    ruleSets.forEach((rs) => { next[rs.id] = evaluateRules(rs.rules, columns, rows); });
    setResults(next);
  };

  const startCreate = () => { setEditing(null); setEditorOpen(true); };
  const startEdit = (rs: RuleSet) => { setEditing(rs); setEditorOpen(true); };

  const aggregate = useMemo(() => {
    let errors = 0, warnings = 0;
    Object.entries(results).forEach(([id, r]) => {
      const rs = ruleSets.find((x) => x.id === id);
      if (!rs) return;
      r.violations.forEach((v) => {
        if (v.severity === 'error') errors++; else warnings++;
      });
    });
    return { errors, warnings };
  }, [results, ruleSets]);

  return (
    <>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Custom Rule Sets
            <div className="ml-auto flex gap-2">
              {total > 0 && (
                <Button size="sm" variant="outline" onClick={runAll}>
                  <Play className="w-3 h-3 mr-1" /> Run all
                </Button>
              )}
              <Button size="sm" onClick={startCreate}>
                <Plus className="w-3 h-3 mr-1" /> New rule set
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Define column and row-level rules tailored to this dataset. Saved to your account and reusable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading rule sets…</p>
          ) : total === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No custom rule sets yet. Create one to start enforcing your own checks.
            </div>
          ) : (
            <>
              {(aggregate.errors > 0 || aggregate.warnings > 0) && (
                <div className="flex gap-2 mb-3">
                  {aggregate.errors > 0 && (
                    <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{aggregate.errors} errors</Badge>
                  )}
                  {aggregate.warnings > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="w-3 h-3 mr-1" />{aggregate.warnings} warnings
                    </Badge>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {ruleSets.map((rs) => {
                  const r = results[rs.id];
                  const passed = r && r.failed === 0;
                  return (
                    <div key={rs.id} className="border border-border rounded-md p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{rs.name}</p>
                            <Badge variant="outline" className="text-xs">{rs.rules.length} rules</Badge>
                            {r && (
                              passed ? (
                                <Badge className="bg-green-500/90 text-white text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Passed</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">{r.failed} violations</Badge>
                              )
                            )}
                          </div>
                          {rs.description && (
                            <p className="text-xs text-muted-foreground truncate">{rs.description}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => run(rs)}>
                          <Play className="w-3 h-3 mr-1" /> Run
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(rs)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteRuleSet(rs.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {r && r.violations.length > 0 && (
                        <ScrollArea className="max-h-40 mt-2">
                          <ul className="space-y-1 text-xs">
                            {r.violations.slice(0, 50).map((v, idx) => (
                              <li key={idx} className="flex gap-2">
                                <Badge
                                  variant={v.severity === 'error' ? 'destructive' : 'secondary'}
                                  className="text-[10px] h-4 px-1"
                                >
                                  {v.severity}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {v.rowIndex !== undefined && `Row ${v.rowIndex + 1} · `}
                                  {v.column && `${v.column} · `}
                                  {v.message}
                                </span>
                              </li>
                            ))}
                            {r.violations.length > 50 && (
                              <li className="text-muted-foreground italic">…and {r.violations.length - 50} more</li>
                            )}
                          </ul>
                        </ScrollArea>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editorOpen && (
        <RuleSetEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          columns={columns}
          initialName={editing?.name ?? ''}
          initialDescription={editing?.description ?? ''}
          initialRules={editing?.rules ?? []}
          onSave={async ({ name, description, rules }) => {
            await saveRuleSet({
              id: editing?.id,
              name,
              description,
              rules,
              scope: 'dataset',
              scope_key: datasetName ?? null,
            });
          }}
        />
      )}
    </>
  );
}
