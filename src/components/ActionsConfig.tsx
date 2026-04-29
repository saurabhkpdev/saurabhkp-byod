import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Webhook, Trash2, Pencil, Zap, Cloud, Mail, Play, TestTube, FileSpreadsheet, Database } from "lucide-react";
import { toast } from "sonner";
import { 
  useActionsStore, 
  ActionConfig, 
  ActionType, 
  ActionScope,
  TriggerEvent, 
  WebhookConfig,
  AirflowConfig,
  SnowflakeConfig,
  EmailConfig,
  triggerEventLabels, 
  actionTypeLabels 
} from "@/hooks/useActionsStore";
import { useTemplateStore } from "@/hooks/useTemplateStore";
import { mockDatasets } from "@/hooks/useMockDatabase";

const defaultWebhookConfig: WebhookConfig = {
  url: "",
  method: "POST",
  headers: {},
  authType: "none",
  payloadTemplate: JSON.stringify({
    event: "{{event}}",
    timestamp: "{{timestamp}}",
    data: "{{data}}"
  }, null, 2),
};

const defaultAirflowConfig: AirflowConfig = {
  baseUrl: "",
  dagId: "",
  conf: {},
};

const defaultSnowflakeConfig: SnowflakeConfig = {
  taskName: "",
};

const defaultEmailConfig: EmailConfig = {
  recipients: [],
  subject: "Bring Your Data Notification: {{event}}",
  bodyTemplate: "An event occurred: {{event}}\n\nTimestamp: {{timestamp}}",
};

const actionTypeIcons: Record<ActionType, React.ReactNode> = {
  webhook: <Webhook className="w-4 h-4" />,
  airflow_dag: <Play className="w-4 h-4" />,
  snowflake_task: <Cloud className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
};

export function ActionsConfig() {
  const { actions, addAction, updateAction, deleteAction, toggleAction } = useActionsStore();
  const { customTemplates } = useTemplateStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionConfig | null>(null);
  const [scope, setScope] = useState<ActionScope>("template");
  const [scopeId, setScopeId] = useState("");
  const [scopeName, setScopeName] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<ActionType>("webhook");
  const [selectedEvents, setSelectedEvents] = useState<TriggerEvent[]>([]);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(defaultWebhookConfig);
  const [airflowConfig, setAirflowConfig] = useState<AirflowConfig>(defaultAirflowConfig);
  const [snowflakeConfig, setSnowflakeConfig] = useState<SnowflakeConfig>(defaultSnowflakeConfig);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(defaultEmailConfig);
  const [emailInput, setEmailInput] = useState("");

  const BUILT_IN_TEMPLATES = [
    { id: 'customer-data', name: 'Customer Data' },
    { id: 'sales-pipeline', name: 'Sales Pipeline' },
    { id: 'inventory', name: 'Inventory Management' },
    { id: 'hr-employees', name: 'HR Employees' },
    { id: 'geo-locations', name: 'Geographical Locations' },
    { id: 'geo-regions', name: 'Regional Boundaries' },
  ];

  const allTemplates = [
    ...BUILT_IN_TEMPLATES,
    ...customTemplates.map(t => ({ id: t.id, name: t.name })),
  ];

  const allDatasets = mockDatasets.map(d => ({ id: `dataset-${d.id}`, name: d.name }));

  const scopeItems = scope === 'template' ? allTemplates : allDatasets;

  const handleScopeItemSelect = (itemId: string) => {
    const item = scopeItems.find(i => i.id === itemId);
    if (item) {
      setScopeId(item.id);
      setScopeName(item.name);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setActionType("webhook");
    setSelectedEvents([]);
    setWebhookConfig(defaultWebhookConfig);
    setAirflowConfig(defaultAirflowConfig);
    setSnowflakeConfig(defaultSnowflakeConfig);
    setEmailConfig(defaultEmailConfig);
    setEmailInput("");
    setEditingAction(null);
    setScope("template");
    setScopeId("");
    setScopeName("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (action: ActionConfig) => {
    setEditingAction(action);
    setName(action.name);
    setDescription(action.description || "");
    setActionType(action.type);
    setSelectedEvents(action.triggerEvents);
    setScope(action.scope || "template");
    setScopeId(action.scopeId || "");
    setScopeName(action.scopeName || "");
    
    if (action.type === "webhook") {
      setWebhookConfig(action.config as WebhookConfig);
    } else if (action.type === "airflow_dag") {
      setAirflowConfig(action.config as AirflowConfig);
    } else if (action.type === "snowflake_task") {
      setSnowflakeConfig(action.config as SnowflakeConfig);
    } else if (action.type === "email") {
      const config = action.config as EmailConfig;
      setEmailConfig(config);
      setEmailInput(config.recipients.join(", "));
    }
    
    setIsDialogOpen(true);
  };

  const handleEventToggle = (event: TriggerEvent) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const getConfigForType = (): ActionConfig["config"] => {
    switch (actionType) {
      case "webhook":
        return webhookConfig;
      case "airflow_dag":
        return airflowConfig;
      case "snowflake_task":
        return snowflakeConfig;
      case "email":
        return { ...emailConfig, recipients: emailInput.split(",").map(e => e.trim()).filter(Boolean) };
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter an action name");
      return;
    }
    if (!scopeId) {
      toast.error(`Please select a ${scope}`);
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one trigger event");
      return;
    }

    const config = getConfigForType();

    // Validate config based on type
    if (actionType === "webhook" && !(config as WebhookConfig).url) {
      toast.error("Please enter a webhook URL");
      return;
    }
    if (actionType === "airflow_dag" && (!(config as AirflowConfig).baseUrl || !(config as AirflowConfig).dagId)) {
      toast.error("Please enter Airflow base URL and DAG ID");
      return;
    }
    if (actionType === "snowflake_task" && !(config as SnowflakeConfig).taskName) {
      toast.error("Please enter a Snowflake task name");
      return;
    }
    if (actionType === "email" && emailInput.trim() === "") {
      toast.error("Please enter at least one recipient email");
      return;
    }

    if (editingAction) {
      updateAction(editingAction.id, {
        name,
        description,
        type: actionType,
        triggerEvents: selectedEvents,
        config,
        scope,
        scopeId,
        scopeName,
      });
      toast.success("Action updated successfully");
    } else {
      addAction({
        name,
        description,
        enabled: true,
        type: actionType,
        triggerEvents: selectedEvents,
        config,
        scope,
        scopeId,
        scopeName,
      });
      toast.success("Action created successfully");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleTestAction = (action: ActionConfig) => {
    toast.info(`Testing "${action.name}"... (This is a placeholder - real execution coming soon)`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Actions
            </CardTitle>
            <CardDescription>
              Configure automated actions triggered by data events (uploads, manipulations, approvals)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Action
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAction ? "Edit Action" : "Create Action"}</DialogTitle>
                <DialogDescription>
                  Configure an automated action to run when specific events occur
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Scope Selection */}
                <div className="space-y-4">
                  <Label>Scope *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Select value={scope} onValueChange={(v) => { setScope(v as ActionScope); setScopeId(""); setScopeName(""); }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="template">
                            <div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Template</div>
                          </SelectItem>
                          <SelectItem value="dataset">
                            <div className="flex items-center gap-2"><Database className="w-4 h-4" /> Dataset</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select value={scopeId} onValueChange={handleScopeItemSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a ${scope}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {scopeItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Action Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Trigger ETL Pipeline"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Action Type *</Label>
                      <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(actionTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {actionTypeIcons[value as ActionType]}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description of what this action does"
                    />
                  </div>
                </div>

                {/* Trigger Events */}
                <div className="space-y-3">
                  <Label>Trigger Events *</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(triggerEventLabels).map(([event, label]) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={event}
                          checked={selectedEvents.includes(event as TriggerEvent)}
                          onCheckedChange={() => handleEventToggle(event as TriggerEvent)}
                        />
                        <label htmlFor={event} className="text-sm cursor-pointer">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type-specific configuration */}
                <Tabs value={actionType} className="w-full">
                  <TabsContent value="webhook" className="space-y-4 mt-0">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Webhook className="w-4 h-4" /> Webhook Configuration
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label>URL *</Label>
                          <Input
                            value={webhookConfig.url}
                            onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                            placeholder="https://api.example.com/webhook"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Method</Label>
                          <Select 
                            value={webhookConfig.method} 
                            onValueChange={(v) => setWebhookConfig({ ...webhookConfig, method: v as WebhookConfig["method"] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Auth Type</Label>
                          <Select 
                            value={webhookConfig.authType} 
                            onValueChange={(v) => setWebhookConfig({ ...webhookConfig, authType: v as WebhookConfig["authType"] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="bearer">Bearer Token</SelectItem>
                              <SelectItem value="basic">Basic Auth</SelectItem>
                              <SelectItem value="api_key">API Key Header</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {webhookConfig.authType !== "none" && (
                          <div className="space-y-2">
                            <Label>Auth Value</Label>
                            <Input
                              type="password"
                              value={webhookConfig.authValue || ""}
                              onChange={(e) => setWebhookConfig({ ...webhookConfig, authValue: e.target.value })}
                              placeholder={webhookConfig.authType === "basic" ? "username:password" : "token or key"}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Payload Template (JSON)</Label>
                        <Textarea
                          value={webhookConfig.payloadTemplate}
                          onChange={(e) => setWebhookConfig({ ...webhookConfig, payloadTemplate: e.target.value })}
                          placeholder='{"event": "{{event}}", "data": "{{data}}"}'
                          className="font-mono text-sm h-24"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available placeholders: {"{{event}}"}, {"{{timestamp}}"}, {"{{data}}"}, {"{{user}}"}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="airflow_dag" className="space-y-4 mt-0">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Play className="w-4 h-4" /> Airflow DAG Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Airflow Base URL *</Label>
                          <Input
                            value={airflowConfig.baseUrl}
                            onChange={(e) => setAirflowConfig({ ...airflowConfig, baseUrl: e.target.value })}
                            placeholder="https://airflow.example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>DAG ID *</Label>
                          <Input
                            value={airflowConfig.dagId}
                            onChange={(e) => setAirflowConfig({ ...airflowConfig, dagId: e.target.value })}
                            placeholder="my_etl_pipeline"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Auth Token</Label>
                        <Input
                          type="password"
                          value={airflowConfig.authToken || ""}
                          onChange={(e) => setAirflowConfig({ ...airflowConfig, authToken: e.target.value })}
                          placeholder="Bearer token for Airflow API"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="snowflake_task" className="space-y-4 mt-0">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cloud className="w-4 h-4" /> Snowflake Task Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Task Name *</Label>
                          <Input
                            value={snowflakeConfig.taskName}
                            onChange={(e) => setSnowflakeConfig({ ...snowflakeConfig, taskName: e.target.value })}
                            placeholder="MY_TASK"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Warehouse</Label>
                          <Input
                            value={snowflakeConfig.warehouse || ""}
                            onChange={(e) => setSnowflakeConfig({ ...snowflakeConfig, warehouse: e.target.value })}
                            placeholder="COMPUTE_WH"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Database</Label>
                          <Input
                            value={snowflakeConfig.database || ""}
                            onChange={(e) => setSnowflakeConfig({ ...snowflakeConfig, database: e.target.value })}
                            placeholder="MY_DATABASE"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Schema</Label>
                          <Input
                            value={snowflakeConfig.schema || ""}
                            onChange={(e) => setSnowflakeConfig({ ...snowflakeConfig, schema: e.target.value })}
                            placeholder="PUBLIC"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4 mt-0">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Configuration
                      </h4>
                      <div className="space-y-2">
                        <Label>Recipients * (comma-separated)</Label>
                        <Input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="admin@example.com, team@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          value={emailConfig.subject}
                          onChange={(e) => setEmailConfig({ ...emailConfig, subject: e.target.value })}
                          placeholder="Bring Your Data Notification: {{event}}"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body Template</Label>
                        <Textarea
                          value={emailConfig.bodyTemplate}
                          onChange={(e) => setEmailConfig({ ...emailConfig, bodyTemplate: e.target.value })}
                          placeholder="Event details..."
                          className="h-24"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingAction ? "Save Changes" : "Create Action"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No actions configured</p>
            <p className="text-sm">Create an action to automate workflows on data events</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Active</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <Switch
                        checked={action.enabled}
                        onCheckedChange={() => toggleAction(action.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{action.name}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs">
                        {action.scope === 'dataset' ? <Database className="h-3 w-3" /> : <FileSpreadsheet className="h-3 w-3" />}
                        {action.scopeName || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {actionTypeIcons[action.type]}
                        {actionTypeLabels[action.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {action.triggerEvents.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {triggerEventLabels[event]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTestAction(action)}
                        >
                          <TestTube className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(action)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete action?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the "{action.name}" action.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  deleteAction(action.id);
                                  toast.success("Action deleted");
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
