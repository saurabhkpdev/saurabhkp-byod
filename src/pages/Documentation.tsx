import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Table, BarChart3, ShieldCheck, Map, Database, Rocket, BookOpen, Lightbulb, CheckCircle2, ArrowRight, FileSpreadsheet, Edit3, Lock, AlertTriangle, Send, Sparkles, Library, GitBranch, Users, Workflow, Zap, Shield, Bot, FileText, Calculator, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Documentation = () => {
  const {
    logEvent
  } = useAuditLog();
  useEffect(() => {
    logEvent('page_view', 'Visited Documentation page', 'Docs');
  }, [logEvent]);
  const quickStartSteps = [{
    step: 1,
    title: "Complete the Wizard",
    description: "Answer a quick questionnaire about your data region and consent before proceeding to Data Studio.",
    icon: CheckCircle2,
    tips: ["Select your country & region", "Confirm data consent", "Enables compliant data handling"]
  }, {
    step: 2,
    title: "Upload or Select Data",
    description: "Choose from 10+ sample datasets or upload your own files. Geographical data enables the interactive map feature.",
    icon: Upload,
    tips: ["Drag & drop or browse files", "10 sample datasets available", "Geo data unlocks Map tab"]
  }, {
    step: 3,
    title: "Review & Edit Data",
    description: "View your data in an interactive table. Click any cell to edit values directly, just like a spreadsheet.",
    icon: Edit3,
    tips: ["Click cells to edit inline", "Changes save automatically", "Scroll horizontally for wide datasets"]
  }, {
    step: 4,
    title: "Mark PII Fields",
    description: "Identify sensitive data by marking columns as PII (Personally Identifiable Information) using the lock icon.",
    icon: Lock,
    tips: ["Click the lock icon on column headers", "PII columns are highlighted", "Track sensitive data easily"]
  }, {
    step: 5,
    title: "Explore Charts & Stats",
    description: "Switch to Stats for summary metrics or Charts for dynamic visualizations—histograms, pie charts, scatter plots, and more.",
    icon: BarChart3,
    tips: ["7 chart types available", "Auto-adapts to data types", "Interactive tooltips & legends"]
  }, {
    step: 6,
    title: "Edit on Map (Geo Data)",
    description: "For geographical datasets, drag markers to update coordinates or use drawing tools to create points, lines, and polygons.",
    icon: Map,
    tips: ["OpenStreetMap integration", "Drag markers to move", "Draw new geometries"]
  }, {
    step: 7,
    title: "Validate & Process",
    description: "Run validation checks for data quality issues, then process your data to send it to your platform.",
    icon: ShieldCheck,
    tips: ["Quality scores displayed", "Fix issues before processing", "One-click submission"]
  }];
  const features = [{
    category: "Data Input",
    items: [{
      title: "Multi-Format File Upload",
      description: "Upload CSV, Excel, JSON, GeoJSON, XML, KML, or Shapefile via drag-and-drop or file browser. The system automatically detects column types and headers.",
      icon: FileSpreadsheet
    }, {
      title: "Unstructured Documents",
      description: "Ingest PDFs and other documents (contracts, invoices, resumes, leases, medical records). Lovable AI extracts structured fields you can edit and validate.",
      icon: FileText
    }, {
      title: "Sample Databases",
      description: "Choose from 10+ pre-built datasets including geographical data (landmarks, territories) and business data (employees, products, sales).",
      icon: Database
    }, {
      title: "Upload Wizard & Consent",
      description: "Mandatory pre-upload questionnaire captures country, region, and legal consent for compliant data handling.",
      icon: Sparkles
    }]
  }, {
    category: "Templates & Datasets",
    items: [{
      title: "Template Library",
      description: "Browse system and custom templates with predefined columns, types, PII tags, and attached quality rule sets. Save your own templates from any dataset.",
      icon: Library
    }, {
      title: "Dataset Library & Versioning",
      description: "Centralized library of saved datasets with full version history. Roll back, compare, and reload any prior version.",
      icon: GitBranch
    }, {
      title: "Groups & Sharing",
      description: "Share custom templates and dataset versions with groups you belong to. New artifacts auto-share with all of your groups by default.",
      icon: Users
    }]
  }, {
    category: "Data Editing",
    items: [{
      title: "Inline Editing",
      description: "Click any cell to edit its value. Changes are saved automatically and reflected across all views.",
      icon: Edit3
    }, {
      title: "Bulk Text Operations",
      description: "Apply trim, case changes, find-and-replace, and other transforms to entire columns in one action.",
      icon: Layers
    }, {
      title: "Custom Formulas",
      description: "Add computed columns with a safe expression evaluator — supports arithmetic, string, and conditional logic without injection risk.",
      icon: Calculator
    }, {
      title: "PII Tagging",
      description: "Mark columns containing sensitive personal data. Tagged columns are visually highlighted for easy identification.",
      icon: Lock
    }, {
      title: "Map-Based Editing",
      description: "For geographical data, drag markers on OpenStreetMap to update coordinates. Draw new points, polygons, and lines.",
      icon: Map
    }]
  }, {
    category: "Analytics & Visualization",
    items: [{
      title: "Statistics Panel",
      description: "View key metrics including row count, column count, data type distribution, and missing value percentage.",
      icon: Table
    }, {
      title: "Dynamic Charts",
      description: "7 chart types that adapt to your data: Distribution, Categories (Pie), Correlation (Scatter), Trend, Grouped, Radar, and Boolean.",
      icon: BarChart3
    }, {
      title: "Genie AI Assistant",
      description: "Ask questions about your dataset in natural language. Genie summarizes, explains columns, and suggests next steps.",
      icon: Bot
    }]
  }, {
    category: "Data Quality",
    items: [{
      title: "Quality Rules Inventory",
      description: "Admins manage a central library of column and row rule sets. Attach any rule set to multiple templates and datasets.",
      icon: ShieldCheck
    }, {
      title: "Attached Validation",
      description: "The Validate tab runs only the rule sets attached to your dataset or its template — no noisy generic checks.",
      icon: AlertTriangle
    }, {
      title: "Quality Scores",
      description: "Get scores for Completeness, Consistency, Validity, and Uniqueness with an overall quality rating.",
      icon: CheckCircle2
    }]
  }, {
    category: "Workflow & Automation",
    items: [{
      title: "Approvals",
      description: "Sensitive data manipulations route to a dedicated Approvals queue with full data preview before changes take effect.",
      icon: Workflow
    }, {
      title: "Action Triggers",
      description: "Admins configure webhooks, Airflow DAGs, Snowflake jobs, and email notifications to fire on data events.",
      icon: Zap
    }, {
      title: "Loading Strategies",
      description: "Admins set per-target load strategy (Truncate, Merge/Upsert, or Append) — applied automatically on processing.",
      icon: Send
    }]
  }, {
    category: "Security & Governance",
    items: [{
      title: "Role-Based Access",
      description: "Multiple roles per user (Super Admin, Sys Admin, Role Admin, Approver, User) with per-page access enforced by RLS.",
      icon: Shield
    }, {
      title: "Audit Log",
      description: "Centralized, sanitized audit trail of page views, edits, approvals, and admin actions.",
      icon: BookOpen
    }, {
      title: "Safe Expression Evaluator",
      description: "Custom formulas and quality rule expressions run through a sandboxed evaluator to prevent code injection.",
      icon: Lock
    }]
  }];
  const faqs = [{
    question: "What file formats are supported?",
    answer: "BYD supports CSV, TSV, Excel (.xlsx, .xls), JSON, GeoJSON, XML, KML, and Shapefile (.zip) for structured data, plus PDFs and other unstructured documents (contracts, invoices, resumes, leases, medical records) which are parsed by AI into structured fields."
  }, {
    question: "How do templates and datasets work together?",
    answer: "Templates define the expected schema, PII tags, and attached quality rules. When you upload data you can apply a template to validate against its rules. Saved datasets keep their own version history in the Dataset Library and can also have rule sets attached directly."
  }, {
    question: "How do I share my work with teammates?",
    answer: "Sharing is group-based. Any custom template or dataset version you create is automatically shared with all groups you belong to. You can adjust this from the Share dialog. Admins manage groups and memberships from the Admin section."
  }, {
    question: "Where do I manage data quality rules?",
    answer: "Admins manage all rule sets in the Quality Rules menu. Each rule set contains column-level checks (type, format, range) and row-level expressions. Rule sets can be attached to multiple templates and datasets, and the Validate tab runs only what's attached."
  }, {
    question: "What is the Approvals workflow?",
    answer: "Sensitive operations — like bulk edits or data manipulations — can be routed to the Approvals queue. Approvers see a before/after preview and can approve or reject before changes are applied to the dataset."
  }, {
    question: "What are Action Triggers?",
    answer: "Admins can configure automations (webhooks, Airflow DAGs, Snowflake jobs, email notifications) that fire automatically on data events such as upload, validation, or processing — useful for downstream pipelines."
  }, {
    question: "What load strategies are supported?",
    answer: "Admins choose per-target loading strategy: Truncate (replace all rows), Merge/Upsert (insert or update by key), or Append (add new rows only). The strategy is applied automatically when data is processed — users don't pick it during upload."
  }, {
    question: "How does role-based access work?",
    answer: "Each user can hold multiple roles (Super Admin, Sys Admin, Role Admin, Approver, User). Page access is enforced both client-side and at the database via Row Level Security, so users only see data they own or that's been shared with their groups."
  }, {
    question: "How do I edit geographical data?",
    answer: "If your dataset contains latitude and longitude columns, a Map tab will appear. You can drag markers to update coordinates, or use the drawing tools to create new points and polygons. BYD uses OpenStreetMap, so no API key is required."
  }, {
    question: "What is PII tagging?",
    answer: "PII (Personally Identifiable Information) tagging marks columns containing sensitive personal data like names, emails, or phone numbers. Tags travel with templates and help ensure proper handling and compliance."
  }, {
    question: "What does the quality score mean?",
    answer: "The overall quality score is calculated from four components: Completeness (no missing values), Consistency (uniform formatting), Validity (correct data formats), and Uniqueness (no duplicates). A score above 80% is considered good."
  }, {
    question: "What can the Genie AI assistant do?",
    answer: "Genie answers natural-language questions about your loaded dataset — summarizing, explaining columns, spotting anomalies, and suggesting next steps. It's available from the chat bubble on any page."
  }];
  return <>
      <Helmet>
        <title>Documentation - BYD</title>
        <meta name="description" content="Learn how to use BYD Data Studio for data editing, visualization, and quality validation." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            
            <h1 className="text-4xl font-bold mb-4">Learn <span className="gradient-text">BYD</span></h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about uploading, editing, visualizing, and validating your data with Bring Your Data.
            </p>
          </div>

          <Tabs defaultValue="quickstart" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="quickstart" className="gap-2">
                <Rocket className="h-4 w-4" />
                Quick Start
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Features
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <BookOpen className="h-4 w-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            {/* Quick Start Tab */}
            <TabsContent value="quickstart" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get up and running with BYD in just a few steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {quickStartSteps.map((step, index) => <div key={step.step} className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <step.icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Step {step.step}
                            </Badge>
                            <h3 className="font-semibold">{step.title}</h3>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {step.description}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {step.tips.map((tip, tipIndex) => <span key={tipIndex} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {tip}
                              </span>)}
                          </div>
                        </div>
                        {index < quickStartSteps.length - 1 && <div className="hidden sm:flex items-center">
                            <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                          </div>}
                      </div>)}
                  </div>

                  <div className="mt-8 text-center">
                    <Link to="/upload">
                      <Button size="lg" className="gap-2">
                        <Rocket className="h-4 w-4" />
                        Go to Data Studio
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              {features.map(category => <Card key={category.category}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.items.map(item => <div key={item.title} className="flex gap-3 p-4 rounded-lg border bg-card">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <item.icon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>)}
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Common questions about using BYD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>)}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          
        </main>
      </div>
    </>;
};
export default Documentation;