import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Settings2 } from "lucide-react";
import { ActionsConfig as ActionsConfigComponent } from "@/components/ActionsConfig";
import LoadConfigPanel from "@/components/LoadConfigPanel";

const ActionsConfigPage = () => {
  return (
    <>
      <Helmet>
        <title>Data Flows | Bring Your Data</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Data</span> Flows
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure data load strategies and automated actions triggered by data events
            </p>
          </div>

          <Tabs defaultValue="actions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="actions" className="gap-2">
                <Settings className="h-4 w-4" />
                Action Triggers
              </TabsTrigger>
              <TabsTrigger value="loadconfig" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Load Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actions">
              <ActionsConfigComponent />
            </TabsContent>

            <TabsContent value="loadconfig">
              <LoadConfigPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default ActionsConfigPage;
