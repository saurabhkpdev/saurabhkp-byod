import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Plus, Pencil, Trash2, Database, Key, ShieldCheck, History, Tag, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useLoadConfig, LoadStrategy, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS, ValidationRule, LoadConfig } from '@/hooks/useLoadConfig';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import { mockDatasets } from '@/hooks/useMockDatabase';

// Built-in template IDs for reference
const BUILT_IN_TEMPLATES = [
  { id: 'customer-data', name: 'Customer Data' },
  { id: 'sales-pipeline', name: 'Sales Pipeline' },
  { id: 'inventory', name: 'Inventory Management' },
  { id: 'hr-employees', name: 'HR Employees' },
  { id: 'geo-locations', name: 'Geographical Locations' },
  { id: 'geo-regions', name: 'Regional Boundaries' },
];

const BUILT_IN_DATASETS = mockDatasets.map(d => ({ id: `dataset-${d.id}`, name: d.name }));

interface ConfigEditorState {
  template_id: string;
  template_name: string;
  load_strategy: LoadStrategy;
  primary_key_columns: string[];
  validation_rules: ValidationRule[];
  auto_version: boolean;
  allow_user_override: boolean;
}

const emptyEditor: ConfigEditorState = {
  template_id: '',
  template_name: '',
  load_strategy: 'append_only',
  primary_key_columns: [],
  validation_rules: [],
  auto_version: true,
  allow_user_override: true,
};

const LoadConfigPanel = () => {
  const { configs, isLoading, saveConfig, deleteConfig } = useLoadConfig();
  const { customTemplates } = useTemplateStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editor, setEditor] = useState<ConfigEditorState>(emptyEditor);
  const [pkInput, setPkInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [configTab, setConfigTab] = useState<'templates' | 'datasets'>('templates');

  const allTemplates = [
    ...BUILT_IN_TEMPLATES,
    ...customTemplates.map(t => ({ id: t.id, name: t.name })),
  ];

  const allDatasets = BUILT_IN_DATASETS;

  // Configs filtered by type
  const templateConfigs = configs.filter(c => !c.template_id.startsWith('dataset-'));
  const datasetConfigs = configs.filter(c => c.template_id.startsWith('dataset-'));

  // Items available for new config (depending on active tab)
  const currentItems = configTab === 'templates' ? allTemplates : allDatasets;
  const currentConfigs = configTab === 'templates' ? templateConfigs : datasetConfigs;

  const availableItems = currentItems.filter(
    t => !currentConfigs.some(c => c.template_id === t.id) || editingId
  );

  const handleEdit = (config: LoadConfig) => {
    setEditor({
      template_id: config.template_id,
      template_name: config.template_name,
      load_strategy: config.load_strategy,
      primary_key_columns: config.primary_key_columns,
      validation_rules: config.validation_rules,
      auto_version: config.auto_version,
      allow_user_override: config.allow_user_override,
    });
    setPkInput(config.primary_key_columns.join(', '));
    setEditingId(config.id);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditor(emptyEditor);
    setPkInput('');
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleItemSelect = (itemId: string) => {
    const item = currentItems.find(t => t.id === itemId);
    if (item) {
      setEditor(prev => ({ ...prev, template_id: item.id, template_name: item.name }));
    }
  };

  const handleSave = async () => {
    if (!editor.template_id) {
      toast.error('Please select a template');
      return;
    }

    const pkCols = pkInput.split(',').map(s => s.trim()).filter(Boolean);

    if (editor.load_strategy === 'merge_upsert' && pkCols.length === 0) {
      toast.error('Merge/Upsert requires at least one primary key column');
      return;
    }

    await saveConfig({
      template_id: editor.template_id,
      template_name: editor.template_name,
      load_strategy: editor.load_strategy,
      primary_key_columns: pkCols,
      validation_rules: editor.validation_rules,
      auto_version: editor.auto_version,
      allow_user_override: editor.allow_user_override,
    });

    toast.success(`Load config ${editingId ? 'updated' : 'created'} for ${editor.template_name}`);
    setDialogOpen(false);
  };

  const handleDelete = async (config: LoadConfig) => {
    const ok = await deleteConfig(config.id);
    if (ok) toast.success(`Removed load config for ${config.template_name}`);
  };

  const strategyBadgeColor: Record<LoadStrategy, string> = {
    truncate_load: 'bg-red-500/10 text-red-700 dark:text-red-400',
    merge_upsert: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    append_only: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Load Configuration
            </CardTitle>
            <CardDescription>
              Define how data should be loaded for each template or dataset — strategy, keys, validation, and versioning
            </CardDescription>
          </div>
          <Button onClick={handleNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Config
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={configTab} onValueChange={(v) => setConfigTab(v as 'templates' | 'datasets')} className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="datasets" className="gap-2">
              <Database className="h-4 w-4" />
              Datasets
            </TabsTrigger>
          </TabsList>

          {['templates', 'datasets'].map((tab) => {
            const tabConfigs = tab === 'templates' ? templateConfigs : datasetConfigs;
            const nameLabel = tab === 'templates' ? 'Template' : 'Dataset';
            return (
              <TabsContent key={tab} value={tab}>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading configurations...</p>
                ) : tabConfigs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No {nameLabel.toLowerCase()} configurations yet</p>
                    <p className="text-sm">Add a configuration to control how data loads into each {nameLabel.toLowerCase()}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{nameLabel}</TableHead>
                          <TableHead>Strategy</TableHead>
                          <TableHead>Primary Keys</TableHead>
                          <TableHead>Auto-Version</TableHead>
                          <TableHead>User Override</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabConfigs.map(config => (
                          <TableRow key={config.id}>
                            <TableCell className="font-medium">{config.template_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={strategyBadgeColor[config.load_strategy]}>
                                {STRATEGY_LABELS[config.load_strategy]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {config.primary_key_columns.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {config.primary_key_columns.map(col => (
                                    <Badge key={col} variant="outline" className="text-xs">
                                      <Key className="h-3 w-3 mr-1" />{col}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={config.auto_version ? 'default' : 'secondary'} className="text-xs">
                                {config.auto_version ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={config.allow_user_override ? 'default' : 'secondary'} className="text-xs">
                                {config.allow_user_override ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(config)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(config)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Editor Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'New'} Load Configuration</DialogTitle>
              <DialogDescription>
                Configure how data is loaded for a specific {configTab === 'templates' ? 'template' : 'dataset'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Item Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {configTab === 'templates' ? 'Template' : 'Dataset'}
                </Label>
                <Select value={editor.template_id} onValueChange={handleItemSelect} disabled={!!editingId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${configTab === 'templates' ? 'template' : 'dataset'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Load Strategy */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Database className="h-4 w-4" />Load Strategy</Label>
                <Select value={editor.load_strategy} onValueChange={(v) => setEditor(prev => ({ ...prev, load_strategy: v as LoadStrategy }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STRATEGY_LABELS) as LoadStrategy[]).map(s => (
                      <SelectItem key={s} value={s}>
                        <div>
                          <span className="font-medium">{STRATEGY_LABELS[s]}</span>
                          <span className="text-xs text-muted-foreground ml-2">— {STRATEGY_DESCRIPTIONS[s]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Key Columns */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Primary Key Columns
                  {editor.load_strategy === 'merge_upsert' && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </Label>
                <Input
                  placeholder="e.g. id, email (comma-separated)"
                  value={pkInput}
                  onChange={(e) => setPkInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Columns used to identify unique records for merge/upsert</p>
              </div>

              <Separator />

              {/* Toggle options */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2"><History className="h-4 w-4" />Auto-Version</Label>
                  <p className="text-xs text-muted-foreground">Save a snapshot before each load</p>
                </div>
                <Switch checked={editor.auto_version} onCheckedChange={(v) => setEditor(prev => ({ ...prev, auto_version: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Allow User Override</Label>
                  <p className="text-xs text-muted-foreground">Let users change strategy at upload time</p>
                </div>
                <Switch checked={editor.allow_user_override} onCheckedChange={(v) => setEditor(prev => ({ ...prev, allow_user_override: v }))} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LoadConfigPanel;
