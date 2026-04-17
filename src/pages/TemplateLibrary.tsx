import { useState } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  Edit2, 
  Trash2, 
  Download, 
  Upload,
  Save,
  X,
  Wand2,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/TopBar';
import { useTemplateStore, generateSampleDataFromColumns, CustomTemplate } from '@/hooks/useTemplateStore';
import { systemTemplates, generateSampleCSV, Template } from '@/components/TemplateSelector';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

type SampleDataMode = 'auto' | 'upload';

export default function TemplateLibrary() {
  const { customTemplates, systemOverrides, addTemplate, updateTemplate, deleteTemplate, updateSystemTemplate, resetSystemTemplate, getSystemOverride, isLoading } = useTemplateStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [editingSystemTemplateId, setEditingSystemTemplateId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'custom'>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'general' | 'geographical'>('general');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: '', type: 'string', required: true }
  ]);
  const [sampleDataMode, setSampleDataMode] = useState<SampleDataMode>('auto');
  const [uploadedSampleData, setUploadedSampleData] = useState<Record<string, unknown>[] | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormCategory('general');
    setColumns([{ name: '', type: 'string', required: true }]);
    setSampleDataMode('auto');
    setUploadedSampleData(null);
    setEditingTemplate(null);
    setEditingSystemTemplateId(null);
  };

  const getEffectiveTemplate = (template: Template) => {
    const override = getSystemOverride(template.id);
    if (!override) return template;
    return { ...template, ...override };
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (template: CustomTemplate | (Template & { isCustom: false })) => {
    const effective = !template.isCustom ? getEffectiveTemplate(template as Template) : template;
    setFormName(effective.name);
    setFormDescription(effective.description);
    if (effective.category !== 'unstructured') {
      setFormCategory(effective.category);
    }
    
    const reqCols = effective.requiredColumns;
    const optCols = 'optionalColumns' in effective && effective.optionalColumns ? effective.optionalColumns : (template as Template).optionalColumns || [];
    const allColumns: ColumnDefinition[] = [
      ...reqCols.map(name => ({ name, type: 'string' as const, required: true })),
      ...optCols.map(name => ({ name, type: 'string' as const, required: false })),
    ];
    setColumns(allColumns.length > 0 ? allColumns : [{ name: '', type: 'string', required: true }]);
    setUploadedSampleData(effective.sampleData);
    setSampleDataMode('upload');
    
    if (template.isCustom) {
      setEditingTemplate(template as CustomTemplate);
      setEditingSystemTemplateId(null);
    } else {
      setEditingTemplate(null);
      setEditingSystemTemplateId(template.id);
    }
    setShowCreateDialog(true);
  };

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'string', required: false }]);
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
    }
  };

  const updateColumn = (index: number, updates: Partial<ColumnDefinition>) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], ...updates };
    setColumns(updated);
  };

  const handleSampleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          // Take up to 10 rows for sample
          const sampleRows = results.data.slice(0, 10) as Record<string, unknown>[];
          setUploadedSampleData(sampleRows);
          
          // Auto-populate columns from uploaded data
          const detectedColumns = Object.keys(sampleRows[0]).map(name => ({
            name,
            type: detectColumnType(sampleRows, name),
            required: true,
          }));
          setColumns(detectedColumns);
          
          toast.success(`Loaded ${sampleRows.length} sample rows from file`);
        }
      },
      error: (error) => {
        toast.error(`Failed to parse file: ${error.message}`);
      },
    });
    
    // Reset input
    event.target.value = '';
  };

  const detectColumnType = (data: Record<string, unknown>[], columnName: string): 'string' | 'number' | 'date' | 'boolean' => {
    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (values.length === 0) return 'string';
    
    // Check if all values are numbers
    if (values.every(v => !isNaN(Number(v)))) return 'number';
    
    // Check if all values are booleans
    if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean';
    
    // Check if all values look like dates
    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
    if (values.every(v => typeof v === 'string' && datePattern.test(v))) return 'date';
    
    return 'string';
  };

  const handleSave = () => {
    // Validation
    if (!formName.trim()) {
      toast.error('Template name is required');
      return;
    }

    const validColumns = columns.filter(c => c.name.trim());
    if (validColumns.length === 0) {
      toast.error('At least one column is required');
      return;
    }

    const requiredColumns = validColumns.filter(c => c.required).map(c => c.name.trim());
    const optionalColumns = validColumns.filter(c => !c.required).map(c => c.name.trim());

    // Generate or use uploaded sample data
    let sampleData: Record<string, unknown>[];
    if (sampleDataMode === 'upload' && uploadedSampleData) {
      sampleData = uploadedSampleData;
    } else {
      sampleData = generateSampleDataFromColumns(validColumns, 5);
    }

    const templateData = {
      name: formName.trim(),
      description: formDescription.trim() || `Custom template: ${formName}`,
      category: formCategory,
      requiredColumns,
      optionalColumns,
      sampleData,
    };

    try {
      if (editingSystemTemplateId) {
        updateSystemTemplate(editingSystemTemplateId, templateData);
        toast.success('System template updated successfully');
      } else if (editingTemplate) {
        updateTemplate(editingTemplate.id, templateData);
        toast.success('Template updated successfully');
      } else {
        addTemplate(templateData);
        toast.success('Template created successfully');
      }
      setShowCreateDialog(false);
      resetForm();
    } catch {
      toast.error('Failed to save template');
    }
  };

  const handleDelete = (id: string) => {
    if (deleteTemplate(id)) {
      toast.success('Template deleted');
    }
    setDeleteConfirmId(null);
  };

  const UNSTRUCTURED_SAMPLES: Record<string, string> = {
    'lease-extraction': '/samples/lease-agreement-sample.txt',
    'invoice-extraction': '/samples/invoice-sample.txt',
    'contract-extraction': '/samples/contract-sample.txt',
    'resume-parser': '/samples/resume-sample.txt',
    'medical-records': '/samples/medical-record-sample.txt',
  };

  const handleDownloadSample = (template: Template | CustomTemplate) => {
    // Unstructured templates: download the prebuilt sample document
    if ((template as Template).category === 'unstructured') {
      const samplePath = UNSTRUCTURED_SAMPLES[template.id];
      if (samplePath) {
        const a = document.createElement('a');
        a.href = samplePath;
        a.download = samplePath.split('/').pop() || 'sample.txt';
        a.click();
        toast.success('Sample document downloaded');
      } else {
        toast.info('No sample available for this template');
      }
      return;
    }
    const csv = generateSampleCSV(template as Template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  // Combine system and custom templates for display, applying overrides
  const allTemplates = [
    ...systemTemplates.map(t => {
      const override = getSystemOverride(t.id);
      return override 
        ? { ...t, ...override, isCustom: false as const, isOverridden: true }
        : { ...t, isCustom: false as const, isOverridden: false };
    }),
    ...customTemplates.map(t => ({ ...t, isOverridden: false })),
  ];

  const displayedTemplates = allTemplates.filter(t => {
    if (activeTab === 'system') return !t.isCustom;
    if (activeTab === 'custom') return t.isCustom;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Template Library</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage data templates for consistent file uploads
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All Templates ({allTemplates.length})</TabsTrigger>
            <TabsTrigger value="system">System ({systemTemplates.length})</TabsTrigger>
            <TabsTrigger value="custom">Custom ({customTemplates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {displayedTemplates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No custom templates yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first custom template to standardize data uploads
                  </p>
                  <Button onClick={openCreateDialog} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedTemplates.map((template) => {
                  const systemMatch = systemTemplates.find(s => s.id === template.id);
                  const isUnstructured = template.category === 'unstructured' || systemMatch?.category === 'unstructured';
                  const formats = isUnstructured
                    ? (systemMatch?.supportedFormats || ['PDF', 'DOCX', 'TXT', 'Image'])
                    : null;
                  return (
                  <Card key={template.id} className="hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl bg-primary/10`}>
                          {isUnstructured ? (
                            <Sparkles className="w-5 h-5 text-primary" />
                          ) : template.category === 'geographical' ? (
                            <MapPin className="w-5 h-5 text-primary" />
                          ) : (
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {template.category === 'geographical' && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MapPin className="w-3 h-3" />
                              Geo
                            </Badge>
                          )}
                          {isUnstructured && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="w-3 h-3" />
                              Unstructured
                            </Badge>
                          )}
                          {template.isCustom ? (
                            <Badge variant="secondary" className="text-xs">Custom</Badge>
                          ) : template.isOverridden ? (
                            <Badge variant="secondary" className="text-xs">Modified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{template.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnstructured ? (
                          formats!.map((fmt) => (
                            <Badge key={fmt} variant="secondary" className="text-[10px] px-1.5 py-0">{fmt}</Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {template.requiredColumns.length + (template.optionalColumns?.length || 0)} columns
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownloadSample(template)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Sample
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(template as any)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {template.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {!template.isCustom && template.isOverridden && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              resetSystemTemplate(template.id);
                              toast.success('Template reset to default');
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSystemTemplateId ? 'Edit System Template' : editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Define the structure and sample data for your template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Records"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as typeof formCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Data</SelectItem>
                    <SelectItem value="geographical">Geographical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this template is used for..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Column Definitions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Columns</Label>
                <Button variant="outline" size="sm" onClick={addColumn}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Column
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {columns.map((col, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Input
                      placeholder="Column name"
                      value={col.name}
                      onChange={(e) => updateColumn(index, { name: e.target.value })}
                      className="flex-1"
                    />
                    <Select 
                      value={col.type} 
                      onValueChange={(v) => updateColumn(index, { type: v as ColumnDefinition['type'] })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={col.required ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateColumn(index, { required: !col.required })}
                      className="w-24"
                    >
                      {col.required ? 'Required' : 'Optional'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColumn(index)}
                      disabled={columns.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Data */}
            <div className="space-y-3">
              <Label>Sample Data</Label>
              <div className="flex gap-2">
                <Button
                  variant={sampleDataMode === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSampleDataMode('auto')}
                  className="gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Auto-generate
                </Button>
                <Button
                  variant={sampleDataMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSampleDataMode('upload')}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Sample
                </Button>
              </div>

              {sampleDataMode === 'upload' && (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleSampleFileUpload}
                    className="cursor-pointer"
                  />
                  {uploadedSampleData && (
                    <p className="text-sm text-muted-foreground">
                      ✓ {uploadedSampleData.length} sample rows loaded
                    </p>
                  )}
                </div>
              )}

              {sampleDataMode === 'auto' && (
                <p className="text-sm text-muted-foreground">
                  Sample data will be auto-generated based on column names and types
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
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
