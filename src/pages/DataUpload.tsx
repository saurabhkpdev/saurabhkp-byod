import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/hooks/useDataStore';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useAuditLog } from '@/hooks/useAuditLog';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { StatsPanel } from '@/components/StatsPanel';
import { DataVisualization } from '@/components/DataVisualization';
import { DataQualityPanel } from '@/components/DataQualityPanel';
import { TopBar } from '@/components/TopBar';
import { UploadWizard } from '@/components/UploadWizard';
import { DatabaseSelector } from '@/components/DatabaseSelector';
import { TemplateSelector, Template, generateSampleCSV } from '@/components/TemplateSelector';

import { LeafletMapEditor } from '@/components/LeafletMapEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, BarChart3, PieChart, MapPin, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface WizardData {
  country: string;
  region: string;
  consent: boolean;
}

type SourceMode = 'select' | 'upload-template' | 'upload-file';

const DataUpload = () => {
  const navigate = useNavigate();
  const [wizardComplete, setWizardComplete] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [hasGeoData, setHasGeoData] = useState(false);
  const { recordUpload } = useUsageStats();
  const { logEvent } = useAuditLog();
  
  // Log page view
  useEffect(() => {
    logEvent('page_view', 'Visited Data Studio page', 'Data Studio');
  }, [logEvent]);
  
  const {
    data,
    loadData,
    updateCell,
    togglePII,
    getStats,
    clearData
  } = useDataStore();

  const stats = data ? getStats() : [];
  const piiColumns = data?.columns.filter(c => c.isPII).map(c => c.name) || [];

  const handleWizardComplete = (wizardInfo: WizardData) => {
    setWizardData(wizardInfo);
    setWizardComplete(true);
  };

  const handleChooseUpload = () => {
    setSourceMode('upload-template');
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setHasGeoData(template.category === 'geographical');
    setSourceMode('upload-file');
    logEvent('template_selected', `Selected template: ${template.name}`, 'Data Upload', { templateId: template.id });
  };

  const handleDownloadSample = (template: Template) => {
    const csvContent = generateSampleCSV(template);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDataLoaded = (rawData: Record<string, unknown>[], fileName: string, geoData: boolean = false) => {
    loadData(rawData, fileName);
    setHasGeoData(geoData || (selectedTemplate?.category === 'geographical'));
    recordUpload();
    logEvent('data_upload', `Uploaded file: ${fileName} (${rawData.length} rows)`, 'Data Upload', { fileName, rowCount: rawData.length, hasGeoData: geoData, templateId: selectedTemplate?.id });
  };

  const handleDatabaseSelect = (databaseData: Record<string, unknown>[], fileName: string, geoData: boolean) => {
    logEvent('dataset_selected', `Selected dataset: ${fileName}`, 'Data Upload', { fileName, hasGeoData: geoData });
    loadData(databaseData, fileName);
    setHasGeoData(geoData);
    recordUpload();
  };

  const handleClear = () => {
    clearData();
    setWizardComplete(false);
    setWizardData(null);
    setSourceMode('select');
    setSelectedTemplate(null);
    setHasGeoData(false);
  };

  const handleBackToTemplates = () => {
    setSourceMode('upload-template');
    setSelectedTemplate(null);
  };

  const handleBackToSourceSelect = () => {
    setSourceMode('select');
    setSelectedTemplate(null);
  };

  const handleUpdateCoordinates = (rowIndex: number, lat: number, lng: number) => {
    const latColumn = data?.columns.find(c => 
      c.name.toLowerCase().includes('lat') || c.name.toLowerCase() === 'latitude'
    );
    const lngColumn = data?.columns.find(c => 
      c.name.toLowerCase().includes('lng') || 
      c.name.toLowerCase().includes('lon') || 
      c.name.toLowerCase() === 'longitude'
    );
    
    if (latColumn && lngColumn) {
      updateCell(rowIndex, latColumn.name, lat);
      updateCell(rowIndex, lngColumn.name, lng);
      logEvent('coordinates_updated', `Updated coordinates for row ${rowIndex + 1}`, 'Data Upload', { rowIndex, lat, lng });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar fileName={data?.fileName} onClear={handleClear} />
        
        <main className="flex-1 container mx-auto px-6 py-8">
          {/* Step 1: Wizard */}
          {!wizardComplete ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  <span className="gradient-text">Before You Begin</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Please complete the following questionnaire to proceed with data upload
                </p>
              </div>
              <UploadWizard onComplete={handleWizardComplete} />
            </div>
          ) : sourceMode === 'select' && !data ? (
            /* Step 2: Choose source - Upload new OR use existing */
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <DatabaseSelector 
                onSelectDataset={handleDatabaseSelect}
                onChooseUpload={handleChooseUpload}
              />
            </div>
          ) : sourceMode === 'upload-template' && !data ? (
            /* Step 3a: Select template for upload */
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <TemplateSelector 
                onSelectTemplate={handleTemplateSelect}
                onDownloadSample={handleDownloadSample}
                onBack={handleBackToSourceSelect}
              />
            </div>
          ) : sourceMode === 'upload-file' && selectedTemplate && !data ? (
            /* Step 3b: Upload file matching template */
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4">
                  <span className="gradient-text">Upload Your Data</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Upload a CSV file matching the {selectedTemplate.name} template
                </p>
                {wizardData && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading from {wizardData.region}, {wizardData.country}
                  </p>
                )}
              </div>
              <FileUpload 
                onDataLoaded={(d, f) => handleDataLoaded(d, f, selectedTemplate.category === 'geographical')} 
                template={selectedTemplate}
                onBack={handleBackToTemplates}
              />
            </div>
          ) : data ? (
            /* Step 4: Data loaded - show tabs */
            <div className="space-y-8 animate-slide-up">
              <Tabs defaultValue="data" className="w-full">
                <TabsList className={`grid w-full max-w-2xl mx-auto ${hasGeoData ? 'grid-cols-5' : 'grid-cols-4'}`}>
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <Table2 className="w-4 h-4" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="visualize" className="flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Charts
                  </TabsTrigger>
                  {hasGeoData && (
                    <TabsTrigger value="map" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Map
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="quality" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Validate
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="mt-6">
                  <DataTable columns={data.columns} rows={data.rows} onCellUpdate={updateCell} onTogglePII={togglePII} />
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                  <StatsPanel stats={stats} piiColumns={piiColumns} />
                </TabsContent>

                <TabsContent value="visualize" className="mt-6">
                  <DataVisualization columns={data.columns} rows={data.rows} />
                </TabsContent>

                {hasGeoData && (
                  <TabsContent value="map" className="mt-6">
                    <LeafletMapEditor 
                      columns={data.columns} 
                      rows={data.rows} 
                      onUpdateCoordinates={handleUpdateCoordinates}
                    />
                  </TabsContent>
                )}

                <TabsContent value="quality" className="mt-6">
                  <DataQualityPanel 
                    columns={data.columns} 
                    rows={data.rows} 
                    onProcessData={() => {
                      logEvent('data_processed', `Processed ${data.rows.length} rows from "${data.fileName}"`, 'Data Upload', { fileName: data.fileName, rowCount: data.rows.length });
                      toast.success('🎉 Congratulations! Data successfully processed!', {
                        description: `${data.rows.length} rows from "${data.fileName}" have been submitted to the platform. Redirecting to home...`
                      });
                      setTimeout(() => {
                        navigate('/');
                      }, 2000);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
};

export default DataUpload;
