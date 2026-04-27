import { useEffect, useState } from 'react';
import { Users2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShareToGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceLabel: string; // e.g. "template" or "dataset"
  resourceName: string;
  initialGroupIds: string[];
  onSave: (groupIds: string[]) => Promise<void>;
}

export function ShareToGroupsDialog({
  open,
  onOpenChange,
  resourceLabel,
  resourceName,
  initialGroupIds,
  onSave,
}: ShareToGroupsDialogProps) {
  const [groups, setGroups] = useState<{ id: string; name: string; description: string | null }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(initialGroupIds));
    setLoading(true);
    supabase
      .from('groups')
      .select('id, name, description')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load groups');
        } else {
          setGroups(data ?? []);
        }
        setLoading(false);
      });
  }, [open, initialGroupIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave([...selected]);
      toast.success('Sharing updated');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update sharing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="w-5 h-5" />
            Share {resourceLabel}
          </DialogTitle>
          <DialogDescription>
            Choose which groups can see <span className="font-medium">{resourceName}</span>.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No groups exist yet. Ask an admin to create groups in Access settings.
          </div>
        ) : (
          <ScrollArea className="max-h-72 pr-4">
            <div className="space-y-2">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(g.id)}
                    onCheckedChange={() => toggle(g.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
