import { useEffect, useState } from 'react';
import { Check, ListChecks, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQualityRules } from '@/hooks/useQualityRules';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  resourceLabel: string;
  initialIds: string[];
  onSave: (ids: string[]) => Promise<boolean | null | unknown>;
}

export function RuleSetAttachDialog({ open, onOpenChange, resourceLabel, initialIds, onSave }: Props) {
  const { ruleSets, loading } = useQualityRules();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setSelected(new Set(initialIds)); }, [open, initialIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await onSave([...selected]);
      if (ok !== false && ok !== null) {
        toast.success('Quality rules updated');
        onOpenChange(false);
      }
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" /> Attach Quality Rules
          </DialogTitle>
          <DialogDescription>
            Select rule sets to attach to <span className="font-medium">{resourceLabel}</span>. Attached rules run automatically in the Validate tab.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : ruleSets.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No rule sets in the inventory yet. Create some in the Quality Rules menu first.
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-3">
            <div className="space-y-2">
              {ruleSets.map((rs) => {
                const checked = selected.has(rs.id);
                return (
                  <label
                    key={rs.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/40 cursor-pointer"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(rs.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{rs.name}</p>
                        <Badge variant="outline" className="text-xs">{rs.rules.length} rules</Badge>
                      </div>
                      {rs.description && (
                        <p className="text-xs text-muted-foreground truncate">{rs.description}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Check className="w-4 h-4 mr-1" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
