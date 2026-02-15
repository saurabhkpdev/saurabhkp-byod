import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Database, MapPin, Globe, Table2, Search, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/TopBar';
import { mockDatasets, MockDataset } from '@/hooks/useMockDatabase';
import { useLoadConfig, STRATEGY_LABELS } from '@/hooks/useLoadConfig';

export default function DatasetLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'geographical' | 'general'>('all');
  const { getConfigForTemplate } = useLoadConfig();

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

  const geoCount = mockDatasets.filter(d => d.hasGeoData).length;
  const generalCount = mockDatasets.length - geoCount;

  const handleLoadDataset = (dataset: MockDataset) => {
    // Navigate to Data Studio with dataset pre-selected
    navigate('/upload', { state: { datasetId: dataset.id } });
  };

  return (
    <div className="flex flex-col h-full">
      <Helmet>
        <title>Datasets - BYOD</title>
        <meta name="description" content="Browse and manage existing datasets in the BYOD platform." />
      </Helmet>

      <TopBar />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Dataset Library</span>
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
            {filteredDatasets.length === 0 ? (
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
    </div>
  );
}