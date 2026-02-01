import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Settings, 
  TestTube,
  Snowflake,
  Server,
  Cloud
} from 'lucide-react';
import { useDataSourceStore, SnowflakeConnection } from '@/hooks/useDataSourceStore';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Mock databases and schemas for demo
const mockDatabases = ['ANALYTICS_DB', 'RAW_DATA', 'STAGING', 'PRODUCTION', 'DEV_SANDBOX'];
const mockSchemas = ['PUBLIC', 'RAW', 'TRANSFORMED', 'STAGING', 'REPORTS', 'ARCHIVE'];

function ConnectionCard({ 
  connection, 
  isActive,
  onSelect,
  onTest,
  onDelete,
  onEdit,
}: { 
  connection: SnowflakeConnection;
  isActive: boolean;
  onSelect: () => void;
  onTest: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    await onTest();
    setIsTesting(false);
  };

  return (
    <Card className={`relative transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Snowflake className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{connection.name}</CardTitle>
              <CardDescription className="text-xs font-mono">
                {connection.account}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connection.isConnected ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <XCircle className="w-3 h-3 mr-1" />
                Not tested
              </Badge>
            )}
            {isActive && (
              <Badge className="bg-primary">Active</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Upload Target</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {connection.uploadDatabase}.{connection.uploadSchema}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Update Target</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {connection.updateDatabase}.{connection.updateSchema}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t">
          {!isActive && (
            <Button size="sm" onClick={onSelect} className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Set Active
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleTest} disabled={isTesting} className="gap-1">
            {isTesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <TestTube className="w-3 h-3" />
            )}
            Test
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1">
            <Settings className="w-3 h-3" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete connection?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{connection.name}" connection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConnectionFormData {
  name: string;
  account: string;
  username: string;
  password: string;
  warehouse: string;
  role: string;
  uploadDatabase: string;
  uploadSchema: string;
  updateDatabase: string;
  updateSchema: string;
}

const defaultFormData: ConnectionFormData = {
  name: '',
  account: '',
  username: '',
  password: '',
  warehouse: '',
  role: 'ACCOUNTADMIN',
  uploadDatabase: '',
  uploadSchema: '',
  updateDatabase: '',
  updateSchema: '',
};

export function DataSourceConfig() {
  const {
    config,
    isLoading,
    addConnection,
    updateConnection,
    deleteConnection,
    setActiveConnection,
    testConnection,
  } = useDataSourceStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SnowflakeConnection | null>(null);
  const [formData, setFormData] = useState<ConnectionFormData>(defaultFormData);
  const [formStep, setFormStep] = useState<'credentials' | 'targets'>('credentials');

  const handleOpenDialog = (connection?: SnowflakeConnection) => {
    if (connection) {
      setEditingConnection(connection);
      setFormData({
        name: connection.name,
        account: connection.account,
        username: connection.username,
        password: '', // Never show password
        warehouse: connection.warehouse,
        role: connection.role,
        uploadDatabase: connection.uploadDatabase,
        uploadSchema: connection.uploadSchema,
        updateDatabase: connection.updateDatabase,
        updateSchema: connection.updateSchema,
      });
    } else {
      setEditingConnection(null);
      setFormData(defaultFormData);
    }
    setFormStep('credentials');
    setDialogOpen(true);
  };

  const handleSaveConnection = () => {
    if (!formData.name || !formData.account || !formData.username) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.uploadDatabase || !formData.uploadSchema || !formData.updateDatabase || !formData.updateSchema) {
      toast.error('Please select database and schema targets');
      return;
    }

    if (editingConnection) {
      updateConnection(editingConnection.id, {
        name: formData.name,
        account: formData.account,
        username: formData.username,
        warehouse: formData.warehouse,
        role: formData.role,
        uploadDatabase: formData.uploadDatabase,
        uploadSchema: formData.uploadSchema,
        updateDatabase: formData.updateDatabase,
        updateSchema: formData.updateSchema,
        isConnected: false, // Reset connection status after edit
      });
      toast.success('Connection updated');
    } else {
      addConnection({
        name: formData.name,
        account: formData.account,
        username: formData.username,
        warehouse: formData.warehouse,
        role: formData.role,
        uploadDatabase: formData.uploadDatabase,
        uploadSchema: formData.uploadSchema,
        updateDatabase: formData.updateDatabase,
        updateSchema: formData.updateSchema,
      });
      toast.success('Connection added');
    }
    setDialogOpen(false);
  };

  const handleTestConnection = async (id: string) => {
    const success = await testConnection(id);
    if (success) {
      toast.success('Connection successful!');
    } else {
      toast.error('Connection failed. Please check your credentials.');
    }
  };

  const handleDeleteConnection = (id: string) => {
    deleteConnection(id);
    toast.success('Connection deleted');
  };

  const handleSetActive = (id: string) => {
    setActiveConnection(id);
    toast.success('Active connection updated');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Platform
          </CardTitle>
          <CardDescription>
            Select and configure your data warehouse connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Snowflake className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">Snowflake</p>
                  <p className="text-xs text-muted-foreground">Cloud Data Platform</p>
                </div>
              </div>
              <Badge className="mt-2">Selected</Badge>
            </div>
            
            <div className="p-4 rounded-xl border-2 border-dashed border-muted cursor-not-allowed opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Server className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold">Databricks</p>
                  <p className="text-xs text-muted-foreground">Lakehouse Platform</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
            </div>
            
            <div className="p-4 rounded-xl border-2 border-dashed border-muted cursor-not-allowed opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Cloud className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">BigQuery</p>
                  <p className="text-xs text-muted-foreground">Google Cloud</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Snowflake Connections</CardTitle>
              <CardDescription>
                Manage your Snowflake warehouse connections
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingConnection ? 'Edit Connection' : 'Add Snowflake Connection'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure your Snowflake connection details
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={formStep} onValueChange={(v) => setFormStep(v as 'credentials' | 'targets')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="credentials">Credentials</TabsTrigger>
                    <TabsTrigger value="targets">Database Targets</TabsTrigger>
                  </TabsList>

                  <TabsContent value="credentials" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="conn-name">Connection Name *</Label>
                      <Input
                        id="conn-name"
                        placeholder="Production Snowflake"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account">Account Identifier *</Label>
                      <Input
                        id="account"
                        placeholder="xy12345.us-east-1"
                        value={formData.account}
                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your Snowflake account identifier (e.g., xy12345.us-east-1)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          placeholder="your_username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warehouse">Warehouse</Label>
                        <Input
                          id="warehouse"
                          placeholder="COMPUTE_WH"
                          value={formData.warehouse}
                          onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          placeholder="ACCOUNTADMIN"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        className="w-full" 
                        onClick={() => setFormStep('targets')}
                        disabled={!formData.name || !formData.account || !formData.username}
                      >
                        Next: Configure Targets
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="targets" className="space-y-4 mt-4">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-sm font-medium mb-1">Upload Target</p>
                      <p className="text-xs text-muted-foreground">
                        Database and schema for new data uploads
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Database</Label>
                        <Select 
                          value={formData.uploadDatabase} 
                          onValueChange={(v) => setFormData({ ...formData, uploadDatabase: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select database" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockDatabases.map((db) => (
                              <SelectItem key={db} value={db}>{db}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Schema</Label>
                        <Select 
                          value={formData.uploadSchema} 
                          onValueChange={(v) => setFormData({ ...formData, uploadSchema: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select schema" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSchemas.map((schema) => (
                              <SelectItem key={schema} value={schema}>{schema}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-sm font-medium mb-1">Update Target</p>
                      <p className="text-xs text-muted-foreground">
                        Database and schema for data updates
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Database</Label>
                        <Select 
                          value={formData.updateDatabase} 
                          onValueChange={(v) => setFormData({ ...formData, updateDatabase: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select database" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockDatabases.map((db) => (
                              <SelectItem key={db} value={db}>{db}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Schema</Label>
                        <Select 
                          value={formData.updateSchema} 
                          onValueChange={(v) => setFormData({ ...formData, updateSchema: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select schema" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSchemas.map((schema) => (
                              <SelectItem key={schema} value={schema}>{schema}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveConnection}
                    disabled={formStep === 'credentials'}
                  >
                    {editingConnection ? 'Save Changes' : 'Add Connection'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {config.connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No connections configured</p>
              <p className="text-sm">Add a Snowflake connection to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {config.connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  isActive={config.activeConnectionId === conn.id}
                  onSelect={() => handleSetActive(conn.id)}
                  onTest={() => handleTestConnection(conn.id)}
                  onDelete={() => handleDeleteConnection(conn.id)}
                  onEdit={() => handleOpenDialog(conn)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Settings className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-warning">Security Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                For production use, credentials should be stored securely using Lovable Cloud. 
                Currently, connection metadata is stored locally. Enable Cloud for secure credential management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
