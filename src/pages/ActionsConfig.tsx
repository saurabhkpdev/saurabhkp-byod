import { Helmet } from "react-helmet-async";
import { ActionsConfig as ActionsConfigComponent } from "@/components/ActionsConfig";

const ActionsConfigPage = () => {
  return (
    <>
      <Helmet>
        <title>Actions Configuration | BYOD</title>
      </Helmet>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Actions Configuration</h1>
            <p className="text-muted-foreground">
              Configure automated actions triggered by data events
            </p>
          </div>
          <ActionsConfigComponent />
        </div>
      </div>
    </>
  );
};

export default ActionsConfigPage;
