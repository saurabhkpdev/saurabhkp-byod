import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/hooks/useDataStore';
import { useUsageStats } from '@/hooks/useUsageStats';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { StatsPanel } from '@/components/StatsPanel';
import { DataVisualization } from '@/components/DataVisualization';
import { Header } from '@/components/Header';
import { UploadWizard } from '@/components/UploadWizard';
import { DatabaseSelector } from '@/components/DatabaseSelector';
import { MapEditor } from '@/components/MapEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, BarChart3, PieChart, MapPin } from 'lucide-react';

interface WizardData {
  country: string;
  region: string;
  consent: boolean;
}

const DataUpload = () => {
  const navigate = useNavigate();
  const [wizardComplete, setWizardComplete] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [sourceMode, setSourceMode] = useState<'select' | 'upload' | 'database'>('select');
  const [hasGeoData, setHasGeoData] = useState(false);
  const { recordUpload } = useUsageStats();
  
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

  const handleDataLoaded = (data: Record<string, unknown>[], fileName: string, geoData: boolean = false) => {
    loadData(data, fileName);
    setHasGeoData(geoData);
    recordUpload();
  };

  const handleClear = () => {
    clearData();
    setWizardComplete(false);
    setWizardData(null);
    setSourceMode('select');
    setHasGeoData(false);
  };

  const handleGoHome = () => {
    handleClear();
    navigate('/');
  };

  const handleDatabaseSelect = (databaseData: Record<string, unknown>[], fileName: string, geoData: boolean) => {
    handleDataLoaded(databaseData, fileName, geoData);
  };

  const handleChooseUpload = () => {
    setSourceMode('upload');
  };

  const handleUpdateCoordinates = (rowIndex: number, lat: number, lng: number) => {
    // Find lat/lng column names
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
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Data - DataLens</title>
        <meta name="description" content="Upload your CSV data to analyze, visualize, and protect sensitive information." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header fileName={data?.fileName} onClear={handleClear} showHomeLink onGoHome={handleGoHome} />
        
        <main className="container mx-auto px-6 py-8">
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <DatabaseSelector 
                onSelectDataset={handleDatabaseSelect}
                onChooseUpload={handleChooseUpload}
              />
            </div>
          ) : sourceMode === 'upload' && !data ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  <span className="gradient-text">Bring Your Own Data</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Upload your CSV file to explore statistics, visualize patterns, and mark sensitive information
                </p>
                {wizardData && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading from {wizardData.region}, {wizardData.country}
                  </p>
                )}
              </div>
              <FileUpload onDataLoaded={(d, f) => handleDataLoaded(d, f, false)} />
            </div>
          ) : data ? (
            <div className="space-y-8 animate-slide-up">
              <Tabs defaultValue="data" className="w-full">
                <TabsList className={`grid w-full max-w-lg mx-auto ${hasGeoData ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
                    <MapEditor 
                      columns={data.columns} 
                      rows={data.rows} 
                      onUpdateCoordinates={handleUpdateCoordinates}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
};

export default DataUpload;
