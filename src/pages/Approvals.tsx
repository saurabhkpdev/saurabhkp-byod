import { Helmet } from "react-helmet-async";
import ApprovalWorkflow from "@/components/ApprovalWorkflow";

const Approvals = () => {
  return (
    <>
      <Helmet>
        <title>Approvals - BYOD</title>
        <meta name="description" content="Review and manage data upload and manipulation approval requests." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Approvals</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and manage data upload and manipulation requests
            </p>
          </div>

          {/* Approval Workflow Component */}
          <ApprovalWorkflow />
        </main>
      </div>
    </>
  );
};

export default Approvals;
