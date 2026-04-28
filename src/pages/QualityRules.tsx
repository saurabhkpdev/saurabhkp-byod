import { useState } from 'react';
import { Plus, Edit2, Trash2, ListChecks, ShieldAlert } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQualityRules, RuleSet } from '@/hooks/useQualityRules';
import { useAuth } from '@/hooks/useAuth';
import { RuleSetEditor } from '@/components/RuleSetEditor';

const ADMIN_ROLES = ['sys_admin', 'role_admin', 'super_admin'];

export default function QualityRules() {
  const { ruleSets, loading, saveRuleSet, deleteRuleSet } = useQualityRules();
  const { currentUser } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RuleSet | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RuleSet | null>(null);

  const isAdmin = !!currentUser?.roles.some((r) => ADMIN_ROLES.includes(r));

  const startCreate = () => { setEditing(null); setEditorOpen(true); };
  const startEdit = (rs: RuleSet) => { setEditing(rs); setEditorOpen(true); };

  return (
    <div className="flex-1">
      <TopBar
        title="Quality Rules"
        description="Central inventory of data quality rule sets. Attach them to templates or datasets."
        icon={<ListChecks className="w-6 h-6 text-primary-foreground" />}
      />

      <div className="p-6 space-y-4">
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
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No quality rule sets yet.
              {isAdmin && <p className="mt-2">Click "New rule set" to define your first one.</p>}
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
    </div>
  );
}
