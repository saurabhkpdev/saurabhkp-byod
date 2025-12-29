import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, MapPin, Table2, ArrowRight, Upload, Globe } from 'lucide-react';
import { MockDataset, mockDatasets } from '@/hooks/useMockDatabase';

interface DatabaseSelectorProps {
  onSelectDataset: (data: Record<string, unknown>[], fileName: string, hasGeoData: boolean) => void;
  onChooseUpload: () => void;
}

export const DatabaseSelector = ({ onSelectDataset, onChooseUpload }: DatabaseSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'geographical'>('all');

  const filteredDatasets = selectedCategory === 'all' 
    ? mockDatasets 
    : mockDatasets.filter(d => d.hasGeoData);

  const handleSelectDataset = (dataset: MockDataset) => {
    onSelectDataset(dataset.data, dataset.name, dataset.hasGeoData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">
          <span className="gradient-text">Choose Your Data Source</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Select from existing database records or upload your own data
        </p>
      </div>

      {/* Source Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-all"
          onClick={onChooseUpload}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Upload New Data</h3>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file or use sample datasets
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/20">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Use Existing Data</h3>
              <p className="text-sm text-muted-foreground">
                Browse and edit records from the database
              </p>
            </div>
            <Badge variant="secondary">Selected</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="gap-2"
        >
          <Table2 className="w-4 h-4" />
          All Datasets
        </Button>
        <Button
          variant={selectedCategory === 'geographical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('geographical')}
          className="gap-2"
        >
          <Globe className="w-4 h-4" />
          Geographical Data
        </Button>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDatasets.map((dataset) => (
          <Card 
            key={dataset.id}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => handleSelectDataset(dataset)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {dataset.hasGeoData ? (
                    <MapPin className="w-5 h-5 text-primary" />
                  ) : (
                    <Database className="w-5 h-5 text-primary" />
                  )}
                </div>
                {dataset.hasGeoData && (
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Geo
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base mt-2">{dataset.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {dataset.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{dataset.data.length} records</span>
                <span className="text-primary group-hover:underline">
                  Load dataset →
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
