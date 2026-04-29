import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit2, Trash2, ListChecks, ShieldAlert, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { DEFAULT_RULE_SETS } from '@/lib/defaultRuleSets';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useQualityRules, RuleSet,
  getTemplateRuleAttachments, getDatasetRuleAttachments,
  setTemplateRuleAttachments, setDatasetRuleAttachments,
} from '@/hooks/useQualityRules';
import { useAuth } from '@/hooks/useAuth';
import { RuleSetEditor } from '@/components/RuleSetEditor';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_ROLES = ['sys_admin', 'role_admin', 'super_admin'];

interface Suggestion {
  key: string; // unique id template:<id> or dataset:<name>
  kind: 'template' | 'dataset';
  resourceId: string; // template uuid or dataset name
  resourceLabel: string;
  ruleSet: RuleSet;
  reason: string;
}

// Match a default rule set to a resource by checking column names + resource label
function matchScore(ruleSet: RuleSet, label: string, columns: string[]): string | null {
  const lc = label.toLowerCase();
  const cols = new Set(columns.map((c) => c.toLowerCase()));
  const ruleCols = ruleSet.rules
    .filter((r) => r.kind === 'column')
    .map((r: any) => String(r.column).toLowerCase());

  const hits = ruleCols.filter((c) => cols.has(c));
  if (hits.length >= 2) return `matches columns: ${hits.slice(0, 4).join(', ')}`;

  // Fallback: name keyword match
  const nameKey = ruleSet.name.toLowerCase();
  if (nameKey.includes('geo') && (cols.has('latitude') || cols.has('longitude') || lc.includes('geo') || lc.includes('location'))) return 'geo-related columns or name';
  if (nameKey.includes('sales') && (lc.includes('sale') || lc.includes('order') || lc.includes('invoice') || lc.includes('transaction'))) return 'sales-related resource name';
  if (nameKey.includes('identity') && (cols.has('email') || cols.has('id') || cols.has('name'))) return 'identity columns present';
  return null;
}

export default function QualityRules() {
  const { ruleSets, loading, saveRuleSet, deleteRuleSet } = useQualityRules();
  const { currentUser } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RuleSet | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RuleSet | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isAdmin = !!currentUser?.roles.some((r) => ADMIN_ROLES.includes(r));

  const startCreate = () => { setEditing(null); setEditorOpen(true); };
  const startEdit = (rs: RuleSet) => { setEditing(rs); setEditorOpen(true); };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      let created = 0;
      for (const def of DEFAULT_RULE_SETS) {
        const exists = ruleSets.some((rs) => rs.name === def.name);
        if (exists) continue;
        const ok = await saveRuleSet({ name: def.name, description: def.description, rules: def.rules });
        if (ok) created++;
      }
      if (created > 0) toast.success(`Seeded ${created} default rule set${created === 1 ? '' : 's'}`);
      else toast.info('Default rule sets already exist');
    } finally {
      setSeeding(false);
    }
  };

  const openSuggestions = async () => {
    setSuggestOpen(true);
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      // Ensure defaults exist in inventory; suggestion only attaches existing rule sets.
      const available = ruleSets.filter((rs) =>
        DEFAULT_RULE_SETS.some((d) => d.name === rs.name)
      );
      if (available.length === 0) {
        toast.error('Import default rule sets first, then run suggestions.');
        setSuggestOpen(false);
        return;
      }

      // Fetch recent templates (own/shared visible by RLS) and datasets
      const [{ data: templates }, { data: versions }] = await Promise.all([
        supabase
          .from('custom_templates')
          .select('id,name,required_columns,optional_columns,updated_at')
          .order('updated_at', { ascending: false })
          .limit(10),
        supabase
          .from('data_versions')
          .select('id,dataset_name,snapshot,created_at')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const found: Suggestion[] = [];

      for (const t of templates ?? []) {
        const cols = [...(t.required_columns ?? []), ...(t.optional_columns ?? [])];
        const attached = new Set(await getTemplateRuleAttachments(t.id));
        for (const rs of available) {
          if (attached.has(rs.id)) continue;
          const reason = matchScore(rs, t.name, cols);
          if (reason) {
            found.push({
              key: `template:${t.id}:${rs.id}`,
              kind: 'template', resourceId: t.id, resourceLabel: t.name,
              ruleSet: rs, reason,
            });
          }
        }
      }

      // Dedup datasets by name (latest version wins)
      const seenDs = new Set<string>();
      for (const v of versions ?? []) {
        if (seenDs.has(v.dataset_name)) continue;
        seenDs.add(v.dataset_name);
        const snap: any = v.snapshot ?? {};
        const cols: string[] = Array.isArray(snap.columns)
          ? snap.columns.map((c: any) => c?.name ?? c).filter(Boolean)
          : [];
        const attached = new Set(await getDatasetRuleAttachments(v.dataset_name));
        for (const rs of available) {
          if (attached.has(rs.id)) continue;
          const reason = matchScore(rs, v.dataset_name, cols);
          if (reason) {
            found.push({
              key: `dataset:${v.dataset_name}:${rs.id}`,
              kind: 'dataset', resourceId: v.dataset_name, resourceLabel: v.dataset_name,
              ruleSet: rs, reason,
            });
          }
        }
        if (seenDs.size >= 10) break;
      }

      setSuggestions(found);
      setSelected(new Set(found.map((s) => s.key)));
    } finally {
      setSuggestLoading(false);
    }
  };

  const toggleSuggestion = (key: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const applySuggestions = async () => {
    setApplying(true);
    try {
      // Group selections by resource
      const tplGroups = new Map<string, Set<string>>();
      const dsGroups = new Map<string, Set<string>>();
      for (const s of suggestions) {
        if (!selected.has(s.key)) continue;
        const map = s.kind === 'template' ? tplGroups : dsGroups;
        const set = map.get(s.resourceId) ?? new Set<string>();
        set.add(s.ruleSet.id);
        map.set(s.resourceId, set);
      }

      let attached = 0;
      for (const [tplId, ids] of tplGroups) {
        const current = await getTemplateRuleAttachments(tplId);
        const next = Array.from(new Set([...current, ...ids]));
        const ok = await setTemplateRuleAttachments(tplId, next);
        if (ok) attached += ids.size;
      }
      for (const [dsName, ids] of dsGroups) {
        const current = await getDatasetRuleAttachments(dsName);
        const next = Array.from(new Set([...current, ...ids]));
        const ok = await setDatasetRuleAttachments(dsName, next);
        if (ok) attached += ids.size;
      }

      if (attached > 0) toast.success(`Attached ${attached} rule set${attached === 1 ? '' : 's'}`);
      else toast.info('No attachments were made');
      setSuggestOpen(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Quality Rules - BYD</title>
        <meta name="description" content="Central inventory of data quality rule sets to attach to templates and datasets." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ListChecks className="w-7 h-7 text-primary" />
              <span className="gradient-text">Quality Rules</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Central inventory of data quality rule sets. Attach them to templates or datasets.
            </p>
          </div>

          <div className="space-y-4">
        {!isAdmin && (
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="py-4 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-yellow-600" />
              <span>You can browse rule sets, but only admins can create, edit, or delete them.</span>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${ruleSets.length} rule set${ruleSets.length === 1 ? '' : 's'}`}
          </p>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openSuggestions}>
                <Wand2 className="w-4 h-4 mr-1" /> Suggest & attach
              </Button>
              <Button onClick={startCreate}>
                <Plus className="w-4 h-4 mr-1" /> New rule set
              </Button>
            </div>
          )}
        </div>

        {!loading && ruleSets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ListChecks className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No quality rules visible</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {isAdmin
                  ? 'Get started by importing a curated set of defaults (identity, geo, sales) or define your own rule set from scratch.'
                  : 'No rule sets are attached to templates or datasets you can access. Ask an admin to share or attach rule sets.'}
              </p>
              {isAdmin && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button onClick={seedDefaults} disabled={seeding}>
                    {seeding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    Import default rule sets
                  </Button>
                  <Button variant="outline" onClick={startCreate}>
                    <Plus className="w-4 h-4 mr-1" /> Create from scratch
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ruleSets.map((rs) => (
              <Card key={rs.id} className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="truncate">{rs.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs shrink-0">{rs.rules.length} rules</Badge>
                  </CardTitle>
                  {rs.description && <CardDescription className="line-clamp-2">{rs.description}</CardDescription>}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(['column', 'row'] as const).map((kind) => {
                      const n = rs.rules.filter((r) => r.kind === kind).length;
                      return n > 0 ? (
                        <Badge key={kind} variant="secondary" className="text-[10px]">
                          {n} {kind}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => startEdit(rs)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(rs)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {editorOpen && (
        <RuleSetEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          columns={[]}
          initialName={editing?.name ?? ''}
          initialDescription={editing?.description ?? ''}
          initialRules={editing?.rules ?? []}
          onSave={async ({ name, description, rules }) => {
            await saveRuleSet({ id: editing?.id, name, description, rules });
          }}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule set?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" will be removed. Any templates or datasets it is attached to will lose this rule set.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete) await deleteRuleSet(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" /> Suggested attachments
            </DialogTitle>
            <DialogDescription>
              Default rule sets matched to your most recent templates and datasets where they are not yet attached.
            </DialogDescription>
          </DialogHeader>

          {suggestLoading ? (
            <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : suggestions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No new suggestions. Either nothing matches or all matches are already attached.
            </div>
          ) : (
            <ScrollArea className="max-h-[420px] pr-3">
              <div className="space-y-2">
                {suggestions.map((s) => {
                  const checked = selected.has(s.key);
                  return (
                    <label
                      key={s.key}
                      className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleSuggestion(s.key)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] uppercase">{s.kind}</Badge>
                          <span className="text-sm font-medium truncate">{s.resourceLabel}</span>
                          <span className="text-xs text-muted-foreground">←</span>
                          <span className="text-sm">{s.ruleSet.name}</span>
                          <Badge variant="outline" className="text-[10px]">{s.ruleSet.rules.length} rules</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuggestOpen(false)}>Cancel</Button>
            <Button
              onClick={applySuggestions}
              disabled={applying || suggestLoading || selected.size === 0}
            >
              {applying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Attach {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

