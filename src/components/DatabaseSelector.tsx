import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Database, MapPin, Table2, Upload, Globe, FileText, Plus, Search } from 'lucide-react';
import { MockDataset, mockDatasets } from '@/hooks/useMockDatabase';
import { useTemplateStore, CustomTemplate } from '@/hooks/useTemplateStore';
import { Template, systemTemplates } from '@/components/TemplateSelector';
import { SampleDownloadButton } from '@/components/SampleDownloadButton';
import { getAvailableFormats } from '@/lib/sampleGenerators';

type SourceMode = 'upload' | 'existing';

interface DatabaseSelectorProps {
  onSelectDataset: (data: Record<string, unknown>[], fileName: string, hasGeoData: boolean) => void;
  onSelectTemplate: (template: Template) => void;
}

export const DatabaseSelector = ({ onSelectDataset, onSelectTemplate }: DatabaseSelectorProps) => {
  const navigate = useNavigate();
  const [sourceMode, setSourceMode] = useState<SourceMode>('upload');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'geographical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { customTemplates } = useTemplateStore();

  // Combine system and custom templates
  const allTemplates: Template[] = useMemo(() => [
    ...systemTemplates,
    ...customTemplates.map((ct: CustomTemplate) => ({
      ...ct,
      icon: ct.category === 'geographical' ? MapPin : FileText,
      optionalColumns: ct.optionalColumns,
    })),
  ], [customTemplates]);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let templates = selectedCategory === 'all'
      ? allTemplates
      : allTemplates.filter(t => t.category === 'geographical');
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query)
      );
    }
    return templates;
  }, [allTemplates, selectedCategory, searchQuery]);

  // Filter datasets by category and search
  const filteredDatasets = useMemo(() => {
    let datasets = selectedCategory === 'all' 
      ? mockDatasets 
      : mockDatasets.filter(d => d.hasGeoData);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      datasets = datasets.filter(d => 
        d.name.toLowerCase().includes(query) || 
        d.description.toLowerCase().includes(query)
      );
    }
    return datasets;
  }, [selectedCategory, searchQuery]);

  const handleSelectDataset = (dataset: MockDataset) => {
    onSelectDataset(dataset.data, dataset.name, dataset.hasGeoData);
  };


  const isCustomTemplate = (templateId: string) => {
    return customTemplates.some(ct => ct.id === templateId);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">
          <span className="gradient-text">Choose Your Data Source</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload new data using templates or browse existing datasets
        </p>
      </div>

      {/* Source Options - Toggle Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer border-2 transition-all ${
            sourceMode === 'upload' 
              ? 'border-primary/20 bg-primary/5' 
              : 'border-dashed hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setSourceMode('upload')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${sourceMode === 'upload' ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Upload New Data</h3>
              <p className="text-sm text-muted-foreground">
                Select a template and upload your data file
              </p>
            </div>
            {sourceMode === 'upload' && <Badge variant="secondary">Selected</Badge>}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-2 transition-all ${
            sourceMode === 'existing' 
              ? 'border-primary/20 bg-primary/5' 
              : 'border-dashed hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setSourceMode('existing')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${sourceMode === 'existing' ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Edit Existing Data</h3>
              <p className="text-sm text-muted-foreground">
                Browse and edit records from the database
              </p>
            </div>
            {sourceMode === 'existing' && <Badge variant="secondary">Selected</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={sourceMode === 'upload' ? 'Search templates...' : 'Search datasets...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="gap-2"
          >
            <Table2 className="w-4 h-4" />
            {sourceMode === 'upload' ? 'All Templates' : 'All Datasets'}
          </Button>
          <Button
            variant={selectedCategory === 'geographical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('geographical')}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            Geographical
          </Button>
        </div>
      </div>

      {/* Content based on selection */}
      {sourceMode === 'upload' ? (
        /* Templates Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Templates</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate('/templates')}
            >
              <Plus className="w-4 h-4" />
              Create Custom Template
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => onSelectTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isCustomTemplate(template.id) && (
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                      )}
                      {template.category === 'geographical' && (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Geo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {getAvailableFormats(template).map((format) => (
                      <Badge 
                        key={format.id} 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 h-5 font-medium"
                      >
                        {format.label}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{template.requiredColumns.length} columns</span>
                    <SampleDownloadButton 
                      template={template} 
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Datasets Grid */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Datasets</h3>
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
      )}
    </div>
  );
};
