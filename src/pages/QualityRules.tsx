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

  return (
    <>
      <Helmet>
        <title>Quality Rules - BYOD</title>
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
            <Button onClick={startCreate}>
              <Plus className="w-4 h-4 mr-1" /> New rule set
            </Button>
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
    </>
  );
}

