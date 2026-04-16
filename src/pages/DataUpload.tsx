import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/hooks/useDataStore';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useDataVersions } from '@/hooks/useDataVersions';
import { useLoadConfig, LoadStrategy } from '@/hooks/useLoadConfig';
import { FileUpload } from '@/components/FileUpload';
import { UnstructuredUpload } from '@/components/UnstructuredUpload';
import { DataTable } from '@/components/DataTable';
import { StatsPanel } from '@/components/StatsPanel';
import { DataVisualization } from '@/components/DataVisualization';
import { DataQualityPanel } from '@/components/DataQualityPanel';
import { TopBar } from '@/components/TopBar';
import { UploadWizard } from '@/components/UploadWizard';
import { DatabaseSelector } from '@/components/DatabaseSelector';
import { Template } from '@/components/TemplateSelector';
import { VersionHistory } from '@/components/VersionHistory';
import LoadStrategyPicker from '@/components/LoadStrategyPicker';

import { LeafletMapEditor } from '@/components/LeafletMapEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, BarChart3, PieChart, MapPin, ShieldCheck, History } from 'lucide-react';
import { toast } from 'sonner';

interface WizardData {
  country: string;
  region: string;
  consent: boolean;
}

type SourceMode = 'select' | 'upload-file';

const CONSENT_SESSION_KEY = 'byod_wizard_consent';

const getStoredConsent = (): WizardData | null => {
  try {
    const stored = sessionStorage.getItem(CONSENT_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

const DataUpload = () => {
  const navigate = useNavigate();
  const storedConsent = getStoredConsent();
  const [wizardComplete, setWizardComplete] = useState(!!storedConsent);
  const [wizardData, setWizardData] = useState<WizardData | null>(storedConsent);
  const [sourceMode, setSourceMode] = useState<SourceMode>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [hasGeoData, setHasGeoData] = useState(false);
  const { recordUpload } = useUsageStats();
  const { logEvent } = useAuditLog();
  const { versions, isLoading: versionsLoading, fetchVersions, saveVersion, restoreVersion, deleteVersion } = useDataVersions();
  const { configs, getConfigForTemplate } = useLoadConfig();
  const [loadStrategy, setLoadStrategy] = useState<LoadStrategy>('append_only');
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
    clearData,
    addFormulaColumn,
    bulkReplace,
    bulkSetValue,
    bulkTransform,
  } = useDataStore();

  // Fetch version history when data is loaded
  useEffect(() => {
    if (data?.fileName) {
      fetchVersions(data.fileName);
    }
  }, [data?.fileName, fetchVersions]);

  const stats = data ? getStats() : [];
  const piiColumns = data?.columns.filter(c => c.isPII).map(c => c.name) || [];

  const handleWizardComplete = (wizardInfo: WizardData) => {
    setWizardData(wizardInfo);
    setWizardComplete(true);
    sessionStorage.setItem(CONSENT_SESSION_KEY, JSON.stringify(wizardInfo));
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setHasGeoData(template.category === 'geographical');
    setSourceMode('upload-file');
    // Set load strategy from admin config default
    const config = getConfigForTemplate(template.id);
    if (config) {
      setLoadStrategy(config.load_strategy);
    } else {
      setLoadStrategy('append_only');
    }
    logEvent('template_selected', `Selected template: ${template.name}`, 'Data Studio', { templateId: template.id });
  };

  const handleDataLoaded = (rawData: Record<string, unknown>[], fileName: string, geoData: boolean = false) => {
    loadData(rawData, fileName);
    setHasGeoData(geoData || (selectedTemplate?.category === 'geographical'));
    recordUpload();
    logEvent('data_upload', `Uploaded file: ${fileName} (${rawData.length} rows)`, 'Data Studio', { fileName, rowCount: rawData.length, hasGeoData: geoData, templateId: selectedTemplate?.id });
  };

  const handleDatabaseSelect = (databaseData: Record<string, unknown>[], fileName: string, geoData: boolean) => {
    logEvent('dataset_selected', `Selected dataset: ${fileName}`, 'Data Studio', { fileName, hasGeoData: geoData });
    loadData(databaseData, fileName);
    setHasGeoData(geoData);
    recordUpload();
  };

  const handleClear = () => {
    clearData();
    setSourceMode('select');
    setSelectedTemplate(null);
    setHasGeoData(false);
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
      logEvent('coordinates_updated', `Updated coordinates for row ${rowIndex + 1}`, 'Data Studio', { rowIndex, lat, lng });
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
                  Please complete the following questionnaire to proceed
                </p>
              </div>
              <UploadWizard onComplete={handleWizardComplete} />
            </div>
          ) : sourceMode === 'select' && !data ? (
            /* Step 2: Choose source - shows templates or datasets based on selection */
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <DatabaseSelector 
                onSelectDataset={handleDatabaseSelect}
                onSelectTemplate={handleTemplateSelect}
                onBack={() => {
                  setWizardComplete(false);
                  setWizardData(null);
                  sessionStorage.removeItem(CONSENT_SESSION_KEY);
                }}
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
                  Upload a file matching the {selectedTemplate.name} template
                </p>
                {wizardData && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading from {wizardData.region}, {wizardData.country}
                  </p>
                )}
              </div>
              
              {selectedTemplate.isUnstructured ? (
                <UnstructuredUpload
                  onDataLoaded={(d, f) => handleDataLoaded(d, f, false)}
                  onBack={handleBackToSourceSelect}
                />
              ) : (
                <FileUpload 
                  onDataLoaded={(d, f) => handleDataLoaded(d, f, selectedTemplate.category === 'geographical')} 
                  template={selectedTemplate}
                  onBack={handleBackToSourceSelect}
                />
              )}
            </div>
          ) : data ? (
            /* Step 4: Data loaded - show tabs */
            <div className="space-y-8 animate-slide-up">
              <Tabs defaultValue="data" className="w-full">
                <TabsList className={`grid w-full max-w-3xl mx-auto`} style={{ gridTemplateColumns: `repeat(${hasGeoData ? 6 : 5}, minmax(0, 1fr))` }}>
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
                  <TabsTrigger value="versions" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Versions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="mt-6">
                  <DataTable 
                    columns={data.columns} 
                    rows={data.rows} 
                    onCellUpdate={updateCell} 
                    onTogglePII={togglePII}
                    onAddFormulaColumn={addFormulaColumn}
                    onBulkReplace={bulkReplace}
                    onBulkSetValue={bulkSetValue}
                    onBulkTransform={bulkTransform}
                  />
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
                    fileName={data.fileName}
                    onProcessData={() => {
                      logEvent('data_submitted', `Submitted ${data.rows.length} rows from "${data.fileName}" for approval`, 'Data Studio', { fileName: data.fileName, rowCount: data.rows.length });
                      // Stay in data studio - clear current data to allow new upload
                      clearData();
                      setSourceMode('select');
                      setSelectedTemplate(null);
                      setHasGeoData(false);
                      // Keep wizard complete so user doesn't need to redo consent
                    }}
                  />
                </TabsContent>

                <TabsContent value="versions" className="mt-6">
                  <VersionHistory
                    versions={versions}
                    isLoading={versionsLoading}
                    hasData={!!data}
                    onSave={(summary) => {
                      if (data) {
                        saveVersion(data.fileName, data.columns, data.rows, summary);
                      }
                    }}
                    onRestore={async (versionId) => {
                      const snapshot = await restoreVersion(versionId);
                      if (snapshot && data) {
                        loadData(
                          snapshot.rows as Record<string, unknown>[],
                          data.fileName
                        );
                      }
                    }}
                    onDelete={(versionId) => {
                      if (data) deleteVersion(versionId, data.fileName);
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
