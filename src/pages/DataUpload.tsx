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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, BarChart3, PieChart } from 'lucide-react';

interface WizardData {
  country: string;
  region: string;
  consent: boolean;
}

const DataUpload = () => {
  const navigate = useNavigate();
  const [wizardComplete, setWizardComplete] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
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

  const handleDataLoaded = (data: Record<string, unknown>[], fileName: string) => {
    loadData(data, fileName);
    recordUpload();
  };

  const handleClear = () => {
    clearData();
    setWizardComplete(false);
    setWizardData(null);
  };

  const handleGoHome = () => {
    handleClear();
    navigate('/');
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
          ) : !data ? (
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
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          ) : (
            <div className="space-y-8 animate-slide-up">
              <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <Table2 className="w-4 h-4" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="visualize" className="flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Visualize
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
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default DataUpload;
