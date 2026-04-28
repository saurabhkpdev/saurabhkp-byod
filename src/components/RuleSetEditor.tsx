import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { DataColumn } from '@/types/data';
import { QualityRule, ColumnRuleType } from '@/lib/qualityRules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName?: string;
  initialDescription?: string;
  initialRules: QualityRule[];
  columns: DataColumn[];
  onSave: (data: { name: string; description: string; rules: QualityRule[] }) => Promise<unknown>;
}

const COLUMN_RULE_OPTIONS: { value: ColumnRuleType; label: string; needsValue?: boolean; needsList?: boolean }[] = [
  { value: 'not_null', label: 'Not empty' },
  { value: 'unique', label: 'Unique' },
  { value: 'regex', label: 'Matches regex', needsValue: true },
  { value: 'min', label: 'Min number', needsValue: true },
  { value: 'max', label: 'Max number', needsValue: true },
  { value: 'min_length', label: 'Min length', needsValue: true },
  { value: 'max_length', label: 'Max length', needsValue: true },
  { value: 'allowed_values', label: 'Allowed values', needsList: true },
];

const newId = () => Math.random().toString(36).slice(2, 10);

export function RuleSetEditor({
  open, onOpenChange, initialName = '', initialDescription = '', initialRules, columns, onSave,
}: Props) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [rules, setRules] = useState<QualityRule[]>(initialRules);
  const [saving, setSaving] = useState(false);

  const addColumnRule = () => {
    setRules((r) => [...r, {
      id: newId(), kind: 'column', column: columns[0]?.name ?? '',
      rule: 'not_null', severity: 'error',
    }]);
  };

  const addRowRule = () => {
    setRules((r) => [...r, {
      id: newId(), kind: 'row', when: '', must: '',
      severity: 'error', message: 'Row rule violated',
    }]);
  };

  const update = (id: string, patch: Partial<QualityRule>) => {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } as QualityRule : r)));
  };

  const remove = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), rules });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quality Rule Set</DialogTitle>
          <DialogDescription>
            Define column-level rules and row-level conditional checks. Reference columns in row rules with <code className="text-xs bg-muted px-1 rounded">{`{column_name}`}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Customer data v1" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-medium">Rules ({rules.length})</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addColumnRule}>
                <Plus className="w-3 h-3 mr-1" /> Column rule
              </Button>
              <Button size="sm" variant="outline" onClick={addRowRule}>
                <Plus className="w-3 h-3 mr-1" /> Row rule
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-3">
            <div className="space-y-2">
              {rules.length === 0 && (
                <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No rules yet. Add a column or row rule to get started.
                </CardContent></Card>
              )}
              {rules.map((rule) => (
                <Card key={rule.id} className="border-muted">
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.kind === 'column' ? 'secondary' : 'outline'}>
                        {rule.kind === 'column' ? 'Column' : 'Row'}
                      </Badge>
                      <Select value={rule.severity} onValueChange={(v) => update(rule.id, { severity: v as 'error' | 'warning' })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => remove(rule.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {rule.kind === 'column' ? (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Select value={rule.column} onValueChange={(v) => update(rule.id, { column: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Column" /></SelectTrigger>
                            <SelectContent>
                              {columns.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Select value={rule.rule} onValueChange={(v) => update(rule.id, { rule: v as ColumnRuleType, value: undefined, values: undefined })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {COLUMN_RULE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          {(() => {
                            const opt = COLUMN_RULE_OPTIONS.find((o) => o.value === rule.rule);
                            if (opt?.needsValue) {
                              return (
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="Value"
                                  value={rule.value ?? ''}
                                  onChange={(e) => update(rule.id, { value: e.target.value })}
                                />
                              );
                            }
                            if (opt?.needsList) {
                              return (
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="comma,separated,values"
                                  value={(rule.values ?? []).join(',')}
                                  onChange={(e) => update(rule.id, { values: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="col-span-12">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Custom message (optional)"
                            value={rule.message ?? ''}
                            onChange={(e) => update(rule.id, { message: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">When (optional condition)</Label>
                          <Input
                            className="h-8 text-xs font-mono"
                            placeholder="{status} == 'active'"
                            value={rule.when ?? ''}
                            onChange={(e) => update(rule.id, { when: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Must be true</Label>
                          <Input
                            className="h-8 text-xs font-mono"
                            placeholder="{age} >= 18 && {country} == 'US'"
                            value={rule.must}
                            onChange={(e) => update(rule.id, { must: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Message</Label>
                          <Input
                            className="h-8 text-xs"
                            value={rule.message}
                            onChange={(e) => update(rule.id, { message: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            <Save className="w-4 h-4 mr-1" /> Save rule set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
