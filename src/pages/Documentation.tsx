import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Table, 
  BarChart3, 
  ShieldCheck, 
  Map, 
  Database,
  Rocket,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
  Edit3,
  Lock,
  AlertTriangle,
  Send,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Documentation = () => {
  const { logEvent } = useAuditLog();

  useEffect(() => {
    logEvent('page_view', 'Visited Documentation page', 'Docs');
  }, [logEvent]);

  const quickStartSteps = [
    {
      step: 1,
      title: "Complete the Wizard",
      description: "Answer a quick questionnaire about your data region and consent before proceeding with data upload.",
      icon: CheckCircle2,
      tips: ["Select your country & region", "Confirm data consent", "Enables compliant data handling"]
    },
    {
      step: 2,
      title: "Upload or Select Data",
      description: "Choose from 10+ sample datasets or upload your own CSV file. Geographical data enables the interactive map feature.",
      icon: Upload,
      tips: ["Drag & drop or browse files", "10 sample datasets available", "Geo data unlocks Map tab"]
    },
    {
      step: 3,
      title: "Review & Edit Data",
      description: "View your data in an interactive table. Click any cell to edit values directly, just like a spreadsheet.",
      icon: Edit3,
      tips: ["Click cells to edit inline", "Changes save automatically", "Scroll horizontally for wide datasets"]
    },
    {
      step: 4,
      title: "Mark PII Fields",
      description: "Identify sensitive data by marking columns as PII (Personally Identifiable Information) using the lock icon.",
      icon: Lock,
      tips: ["Click the lock icon on column headers", "PII columns are highlighted", "Track sensitive data easily"]
    },
    {
      step: 5,
      title: "Explore Charts & Stats",
      description: "Switch to Stats for summary metrics or Charts for dynamic visualizations—histograms, pie charts, scatter plots, and more.",
      icon: BarChart3,
      tips: ["7 chart types available", "Auto-adapts to data types", "Interactive tooltips & legends"]
    },
    {
      step: 6,
      title: "Edit on Map (Geo Data)",
      description: "For geographical datasets, drag markers to update coordinates or use drawing tools to create points, lines, and polygons.",
      icon: Map,
      tips: ["OpenStreetMap integration", "Drag markers to move", "Draw new geometries"]
    },
    {
      step: 7,
      title: "Validate & Process",
      description: "Run validation checks for data quality issues, then process your data to send it to your platform.",
      icon: ShieldCheck,
      tips: ["Quality scores displayed", "Fix issues before processing", "One-click submission"]
    }
  ];

  const features = [
    {
      category: "Data Input",
      items: [
        {
          title: "CSV File Upload",
          description: "Upload CSV files via drag-and-drop or file browser. The system automatically detects column types and headers.",
          icon: FileSpreadsheet
        },
        {
          title: "Sample Databases",
          description: "Choose from 10 pre-built datasets including geographical data (landmarks, territories) and business data (employees, products, sales).",
          icon: Database
        },
        {
          title: "Upload Wizard",
          description: "Complete a pre-upload questionnaire to capture region and consent information for compliant data handling.",
          icon: Sparkles
        }
      ]
    },
    {
      category: "Data Editing",
      items: [
        {
          title: "Inline Editing",
          description: "Click any cell to edit its value. Changes are saved automatically and reflected across all views.",
          icon: Edit3
        },
        {
          title: "PII Tagging",
          description: "Mark columns containing sensitive personal data. Tagged columns are visually highlighted for easy identification.",
          icon: Lock
        },
        {
          title: "Map-Based Editing",
          description: "For geographical data, drag markers on the OpenStreetMap to update coordinates. Draw new points, polygons, and lines.",
          icon: Map
        }
      ]
    },
    {
      category: "Analytics & Visualization",
      items: [
        {
          title: "Statistics Panel",
          description: "View key metrics including row count, column count, data types distribution, and missing value percentage.",
          icon: Table
        },
        {
          title: "Dynamic Charts",
          description: "7 chart types that adapt to your data: Distribution, Categories (Pie), Correlation (Scatter), Trend, Grouped, Radar, and Boolean.",
          icon: BarChart3
        }
      ]
    },
    {
      category: "Data Quality",
      items: [
        {
          title: "Validation Checks",
          description: "Automated checks for missing values, duplicates, outliers, formatting issues, and invalid data patterns.",
          icon: AlertTriangle
        },
        {
          title: "Quality Scores",
          description: "Get scores for Completeness, Consistency, Validity, and Uniqueness with an overall quality rating.",
          icon: CheckCircle2
        }
      ]
    }
  ];

  const faqs = [
    {
      question: "What file formats are supported?",
      answer: "Currently, BYOD supports CSV (Comma-Separated Values) files. The system automatically detects delimiters and header rows."
    },
    {
      question: "How do I edit geographical data?",
      answer: "If your dataset contains latitude and longitude columns, a Map tab will appear. You can drag markers to update coordinates, or use the drawing tools to create new points and polygons. BYOD uses OpenStreetMap, so no API key is required."
    },
    {
      question: "What is PII tagging?",
      answer: "PII (Personally Identifiable Information) tagging allows you to mark columns that contain sensitive personal data like names, emails, or phone numbers. This helps ensure proper data handling and compliance."
    },
    {
      question: "How does data validation work?",
      answer: "The validation system checks for common data quality issues including: missing values, duplicate rows, statistical outliers, negative values where unexpected, inconsistent text casing, whitespace issues, and invalid email formats."
    },
    {
      question: "What does the quality score mean?",
      answer: "The overall quality score is calculated from four components: Completeness (no missing values), Consistency (uniform formatting), Validity (correct data formats), and Uniqueness (no duplicates). A score above 80% is considered good."
    },
    {
      question: "What sample datasets are available?",
      answer: "BYOD includes 10 sample datasets: World Landmarks, Country Territories, Global Cities, Sales Data, Product Inventory, Employee Directory, Customer Feedback, Weather Stations, Financial Transactions, and Healthcare Records."
    },
    {
      question: "What chart types are available?",
      answer: "Based on your data, BYOD offers: Distribution (histogram), Categories (pie chart), Correlation (scatter plot), Trend (area chart), Grouped (bar chart by category), Radar (multi-metric comparison), and Boolean (true/false distribution)."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Documentation - BYOD</title>
        <meta name="description" content="Learn how to use BYOD for data upload, editing, visualization, and quality validation." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Documentation</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Learn BYOD</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about uploading, editing, visualizing, and validating your data with Bring Your Own Data.
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
                    Get up and running with BYOD in just a few steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {quickStartSteps.map((step, index) => (
                      <div 
                        key={step.step} 
                        className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
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
                            {step.tips.map((tip, tipIndex) => (
                              <span 
                                key={tipIndex}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                              >
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {tip}
                              </span>
                            ))}
                          </div>
                        </div>
                        {index < quickStartSteps.length - 1 && (
                          <div className="hidden sm:flex items-center">
                            <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    ))}
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
              {features.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.items.map((item) => (
                        <div 
                          key={item.title}
                          className="flex gap-3 p-4 rounded-lg border bg-card"
                        >
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Common questions about using BYOD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border">
            <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Bring your own data and experience the power of BYOD
            </p>
            <Link to="/upload">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Open Data Studio
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default Documentation;