import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Settings2 } from "lucide-react";
import { ActionsConfig as ActionsConfigComponent } from "@/components/ActionsConfig";
import LoadConfigPanel from "@/components/LoadConfigPanel";

const ActionsConfigPage = () => {
  return (
    <>
      <Helmet>
        <title>Data Flows | BYOD</title>
      </Helmet>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Flows</h1>
            <p className="text-muted-foreground">
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
        </div>
      </div>
    </>
  );
};

export default ActionsConfigPage;
