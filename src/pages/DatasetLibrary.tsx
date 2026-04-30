import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Database, MapPin, Globe, Table2, Search, Upload, Users2, Loader2, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/TopBar';
import { mockDatasets, MockDataset } from '@/hooks/useMockDatabase';
import { useLoadConfig, STRATEGY_LABELS } from '@/hooks/useLoadConfig';
import { useDataVersions } from '@/hooks/useDataVersions';
import { ShareToGroupsDialog } from '@/components/ShareToGroupsDialog';
import { RuleSetAttachDialog } from '@/components/RuleSetAttachDialog';
import { getDatasetRuleAttachments, setDatasetRuleAttachments } from '@/hooks/useQualityRules';
import { useDatasetRuleCounts } from '@/hooks/useRuleAttachmentCounts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface MyDatasetRow {
  id: string;
  dataset_name: string;
  version_number: number;
  row_count: number;
  column_count: number;
  created_at: string;
  shared_group_ids: string[];
}

export default function DatasetLibrary() {
  const navigate = useNavigate();
  const currentUser = useAuth((s) => s.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'geographical' | 'general'>('all');
  const { getConfigForTemplate } = useLoadConfig();
  const { setDatasetShares } = useDataVersions();

  const [myDatasets, setMyDatasets] = useState<MyDatasetRow[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [shareTarget, setShareTarget] = useState<MyDatasetRow | null>(null);
  const [rulesTarget, setRulesTarget] = useState<MyDatasetRow | null>(null);
  const [rulesInitialIds, setRulesInitialIds] = useState<string[]>([]);
  const isAdmin = !!currentUser?.roles.some((r) => ['sys_admin', 'role_admin', 'super_admin'].includes(r));

  const openAttachRules = async (d: MyDatasetRow) => {
    const ids = await getDatasetRuleAttachments(d.dataset_name);
    setRulesInitialIds(ids);
    setRulesTarget(d);
  };

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      setLoadingMine(true);
      const { data, error } = await supabase
        .from('data_versions')
        .select('id, dataset_name, version_number, row_count, column_count, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error || !data) {
        setMyDatasets([]);
        setLoadingMine(false);
        return;
      }
      // Latest version per dataset_name
      const seen = new Set<string>();
      const latest = data.filter((r: any) => {
        if (seen.has(r.dataset_name)) return false;
        seen.add(r.dataset_name);
        return true;
      });
      const ids = latest.map((r: any) => r.id);
      let shareMap: Record<string, string[]> = {};
      if (ids.length > 0) {
        const { data: shares } = await supabase
          .from('dataset_group_shares')
          .select('dataset_version_id, group_id')
          .in('dataset_version_id', ids);
        (shares ?? []).forEach((s: any) => {
          shareMap[s.dataset_version_id] = shareMap[s.dataset_version_id] ?? [];
          shareMap[s.dataset_version_id].push(s.group_id);
        });
      }
      setMyDatasets(
        latest.map((r: any) => ({
          ...r,
          shared_group_ids: shareMap[r.id] ?? [],
        })),
      );
      setLoadingMine(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id, shareTarget === null]);

  const filteredDatasets = useMemo(() => {
    let datasets = mockDatasets;

    if (activeTab === 'geographical') datasets = datasets.filter(d => d.hasGeoData);
    if (activeTab === 'general') datasets = datasets.filter(d => !d.hasGeoData);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      datasets = datasets.filter(d =>
        d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return datasets;
  }, [activeTab, searchQuery]);

  const filteredMine = useMemo(() => {
    if (!searchQuery.trim()) return myDatasets;
    const q = searchQuery.toLowerCase();
    return myDatasets.filter((d) => d.dataset_name.toLowerCase().includes(q));
  }, [myDatasets, searchQuery]);

  const geoCount = mockDatasets.filter(d => d.hasGeoData).length;
  const generalCount = mockDatasets.length - geoCount;

  const handleLoadDataset = (dataset: MockDataset) => {
    // Navigate to Data Studio with dataset pre-selected
    navigate('/upload', { state: { datasetId: dataset.id } });
  };

  return (
    <div className="flex flex-col h-full">
      <Helmet>
        <title>Datasets - Bring Your Data</title>
        <meta name="description" content="Browse and manage existing datasets in the Bring Your Data platform." />
      </Helmet>

      <TopBar />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Dataset</span> Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage existing datasets
            </p>
          </div>
          <Button onClick={() => navigate('/upload')} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload New Data
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Table2 className="w-4 h-4" />
              All ({mockDatasets.length})
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-2">
              <Users2 className="w-4 h-4" />
              My Datasets ({myDatasets.length})
            </TabsTrigger>
            <TabsTrigger value="geographical" className="gap-2">
              <Globe className="w-4 h-4" />
              Geographical ({geoCount})
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Database className="w-4 h-4" />
              General ({generalCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {activeTab === 'mine' ? (
              loadingMine ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMine.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Database className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No saved datasets yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Save a dataset version from Data Studio to see it here.
                    </p>
                    <Button onClick={() => navigate('/upload')} variant="outline" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Go to Data Studio
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMine.map((d) => (
                    <Card key={d.id} className="hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 rounded-xl bg-primary/10">
                            <Database className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              v{d.version_number}
                            </Badge>
                            {d.shared_group_ids.length > 0 && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Users2 className="w-3 h-3" />
                                {d.shared_group_ids.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-2 truncate">{d.dataset_name}</CardTitle>
                        <CardDescription className="text-xs">
                          Saved {format(new Date(d.created_at), 'PP')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{d.row_count} rows</span>
                          <span>{d.column_count} columns</span>
                        </div>
                        <div className="flex gap-2 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => setShareTarget(d)}
                          >
                            <Users2 className="w-4 h-4" />
                            Share
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => openAttachRules(d)}
                              title="Attach quality rules"
                            >
                              <ListChecks className="w-4 h-4" />
                              Rules
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : filteredDatasets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No datasets found</h3>
                  <p className="text-muted-foreground text-center">
                    Try adjusting your search or filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDatasets.map((dataset) => {
                  const loadConfig = getConfigForTemplate(`dataset-${dataset.id}`);
                  return (
                    <Card
                      key={dataset.id}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                      onClick={() => handleLoadDataset(dataset)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            {dataset.hasGeoData ? (
                              <MapPin className="w-5 h-5 text-primary" />
                            ) : (
                              <Database className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {dataset.hasGeoData && (
                              <Badge variant="secondary" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                Geo
                              </Badge>
                            )}
                            {loadConfig && (
                              <Badge variant="outline" className="text-xs">
                                {STRATEGY_LABELS[loadConfig.load_strategy]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-2">{dataset.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {dataset.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{dataset.data.length} records</span>
                          <span>{Object.keys(dataset.data[0] || {}).length} columns</span>
                        </div>
                        <div className="mt-3 text-xs text-primary group-hover:underline text-right">
                          Open in Data Studio →
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

      {shareTarget && (
        <ShareToGroupsDialog
          open={!!shareTarget}
          onOpenChange={(o) => !o && setShareTarget(null)}
          resourceLabel="dataset"
          resourceName={shareTarget.dataset_name}
          initialGroupIds={shareTarget.shared_group_ids}
          onSave={(ids) => setDatasetShares(shareTarget.id, ids)}
        />
      )}

      {rulesTarget && (
        <RuleSetAttachDialog
          open={!!rulesTarget}
          onOpenChange={(o) => !o && setRulesTarget(null)}
          resourceLabel={`dataset "${rulesTarget.dataset_name}"`}
          initialIds={rulesInitialIds}
          onSave={async (ids) => setDatasetRuleAttachments(rulesTarget.dataset_name, ids)}
        />
      )}
    </div>
  );
}
