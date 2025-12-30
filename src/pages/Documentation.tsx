import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
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
  Eye,
  Lock,
  AlertTriangle,
  Send
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
      title: "Upload or Select Data",
      description: "Start by uploading a CSV file or selecting from our sample datasets. We support both geographical and non-geographical data.",
      icon: Upload,
      tips: ["Drag & drop or click to browse", "CSV format supported", "Sample datasets available for testing"]
    },
    {
      step: 2,
      title: "Review & Edit Data",
      description: "View your data in an interactive table. Click any cell to edit values directly, just like a spreadsheet.",
      icon: Edit3,
      tips: ["Click cells to edit inline", "Changes save automatically", "Scroll horizontally for wide datasets"]
    },
    {
      step: 3,
      title: "Mark PII Fields",
      description: "Identify sensitive data by marking columns as PII (Personally Identifiable Information) using the lock icon.",
      icon: Lock,
      tips: ["Click the lock icon on column headers", "PII columns are highlighted", "Track sensitive data easily"]
    },
    {
      step: 4,
      title: "Explore Visualizations",
      description: "Switch to the Charts tab to see automatic visualizations based on your data types.",
      icon: BarChart3,
      tips: ["Charts adapt to data types", "Interactive tooltips", "Multiple chart types available"]
    },
    {
      step: 5,
      title: "Validate Data Quality",
      description: "Run validation checks to identify issues like missing values, duplicates, and format errors.",
      icon: ShieldCheck,
      tips: ["Click 'Run Validation'", "Review issue details", "Fix issues before processing"]
    },
    {
      step: 6,
      title: "Process & Export",
      description: "Once validation passes, process your data to send it to your data platform.",
      icon: Send,
      tips: ["Green checkmark means ready", "Process with one click", "Data sent to platform"]
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
          description: "For geographical data, drag markers on the map to update coordinates. Draw new points, polygons, and lines.",
          icon: Map
        }
      ]
    },
    {
      category: "Analytics",
      items: [
        {
          title: "Statistics Panel",
          description: "View key metrics including row count, column count, data types distribution, and missing value percentage.",
          icon: Table
        },
        {
          title: "Dynamic Visualizations",
          description: "Charts automatically adapt to your data: histograms for numbers, pie charts for categories, time series for dates.",
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
      answer: "Currently, DataLens supports CSV (Comma-Separated Values) files. The system automatically detects delimiters and header rows."
    },
    {
      question: "How do I edit geographical data?",
      answer: "If your dataset contains latitude and longitude columns, a Map tab will appear. You can drag markers to update coordinates, or use the drawing tools to create new points and polygons."
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
      question: "Can I use my own Mapbox token?",
      answer: "Yes! When you first access the Map tab, you'll be prompted to enter your Mapbox public access token. This enables the interactive map features."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Documentation - DataLens</title>
        <meta name="description" content="Learn how to use DataLens for data upload, editing, visualization, and quality validation." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Documentation</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Learn DataLens</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about uploading, editing, visualizing, and validating your data.
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
                    Get up and running with DataLens in just a few steps
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
                        Start Now
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
                    <div className="grid sm:grid-cols-2 gap-4">
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
                    Common questions about using DataLens
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
              Upload your data and experience the power of DataLens
            </p>
            <Link to="/upload">
              <Button size="lg" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Data
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default Documentation;
