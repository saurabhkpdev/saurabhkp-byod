import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Calendar, Clock, FileUp, Eye, Trash2, RefreshCw, Palette, Database, Globe, Settings2, Upload } from "lucide-react";
import { useAuditLog, actionLabels, actionColors, AuditAction } from "@/hooks/useAuditLog";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { DataSourceConfig } from "@/components/DataSourceConfig";
import LanguageSettings from "@/components/LanguageSettings";
import LoadConfigPanel from "@/components/LoadConfigPanel";
import { useUsageStats } from "@/hooks/useUsageStats";


const Admin = () => {
  const {
    events,
    clearLogs,
    getStats
  } = useAuditLog();
  const stats = getStats();
  const { totalVisits, totalUploads, getLastVisitFormatted } = useUsageStats();
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today, ${format(date, 'HH:mm:ss')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'HH:mm:ss')}`;
    }
    return format(date, 'MMM d, yyyy HH:mm:ss');
  };
  const handleClearLogs = () => {
    clearLogs();
    toast.success("Audit logs cleared successfully");
  };
  const handleRefresh = () => {
    window.location.reload();
  };

  // Sort events by most recent first
  const sortedEvents = [...events].reverse();

  // Get top actions
  const topActions = Object.entries(stats.actionCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  // Get top pages
  const topPages = Object.entries(stats.pageCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  return <>
      <Helmet>
        <title>Admin Dashboard - BYOD</title>
        <meta name="description" content="Admin dashboard for auditing user activity on the BYOD platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              
              <h1 className="text-3xl font-bold">Platform <span className="gradient-text">Activity</span></h1>
              <p className="text-muted-foreground">Monitor and audit all user actions on the platform</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Clear Logs
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all audit logs?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All audit logs will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear Logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="events" className="gap-2">
                <Clock className="h-4 w-4" />
                Event Log
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="customization" className="gap-2">
                <Palette className="h-4 w-4" />
                Customization
              </TabsTrigger>
              <TabsTrigger value="datasources" className="gap-2">
                <Database className="h-4 w-4" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="languages" className="gap-2">
                <Globe className="h-4 w-4" />
                Languages
              </TabsTrigger>
              <TabsTrigger value="loadconfig" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Load Settings
              </TabsTrigger>
            </TabsList>

            {/* Event Log Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    All user actions recorded on the platform (most recent first)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedEvents.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No events recorded yet</p>
                      <p className="text-sm">Activity will appear here as users interact with the platform</p>
                    </div> : <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead className="w-[150px]">Action</TableHead>
                            <TableHead className="w-[100px]">Page</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedEvents.map(event => <TableRow key={event.id}>
                              <TableCell className="font-mono text-xs">
                                <div className="flex flex-col">
                                  <span>{formatTimestamp(event.timestamp)}</span>
                                  <span className="text-muted-foreground">
                                    {formatDistanceToNow(new Date(event.timestamp), {
                                addSuffix: true
                              })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={actionColors[event.action as AuditAction]}>
                                  {actionLabels[event.action as AuditAction] || event.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {event.page && <span className="text-sm text-muted-foreground">{event.page}</span>}
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate">
                                {event.details}
                              </TableCell>
                            </TableRow>)}
                        </TableBody>
                      </Table>
                    </ScrollArea>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              {/* Event Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalEvents}</p>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.todayEvents}</p>
                      <p className="text-sm text-muted-foreground">Today's Events</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FileUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.actionCounts['data_upload'] || 0}</p>
                      <p className="text-sm text-muted-foreground">Uploads</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.actionCounts['page_view'] || 0}</p>
                      <p className="text-sm text-muted-foreground">Page Views</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalVisits}</p>
                      <p className="text-sm text-muted-foreground">Total Visits</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalUploads}</p>
                      <p className="text-sm text-muted-foreground">Files Uploaded</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{getLastVisitFormatted()}</p>
                      <p className="text-sm text-muted-foreground">Last Visit</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Actions</CardTitle>
                    <CardDescription>Most frequent user actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topActions.length === 0 ? <p className="text-muted-foreground text-center py-8">No data available</p> : <div className="space-y-4">
                        {topActions.map(([action, count]) => <div key={action} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className={actionColors[action as AuditAction]}>
                                {actionLabels[action as AuditAction] || action}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{
                            width: `${count / stats.totalEvents * 100}%`
                          }} />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{count}</span>
                            </div>
                          </div>)}
                      </div>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Page Activity</CardTitle>
                    <CardDescription>Views by page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPages.length === 0 ? <p className="text-muted-foreground text-center py-8">No data available</p> : <div className="space-y-4">
                        {topPages.map(([page, count]) => <div key={page} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{page}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{
                            width: `${count / stats.totalEvents * 100}%`
                          }} />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{count}</span>
                            </div>
                          </div>)}
                      </div>}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Action Breakdown</CardTitle>
                    <CardDescription>All tracked actions and their counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(actionLabels).map(([action, label]) => <div key={action} className="p-4 rounded-lg border bg-card text-center">
                          <p className="text-2xl font-bold">{stats.actionCounts[action] || 0}</p>
                          <Badge variant="secondary" className={`${actionColors[action as AuditAction]} mt-2`}>
                            {label}
                          </Badge>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Customization Tab */}
            <TabsContent value="customization">
              <ThemeCustomizer />
            </TabsContent>

            {/* Data Sources Tab */}
            <TabsContent value="datasources">
              <DataSourceConfig />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            {/* User Login Details Tab */}
            <TabsContent value="login-details">
              <UserLoginDetails />
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <RoleManagement />
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages">
              <LanguageSettings />
            </TabsContent>

            {/* Load Settings Tab */}
            <TabsContent value="loadconfig">
              <LoadConfigPanel />
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </>;
};
export default Admin;