import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, BarChart3, Shield, Clock, Activity, Sparkles, Map, Database, Edit3, PieChart, ShieldCheck, ArrowRight } from 'lucide-react';
const Index = () => {
  const {
    totalVisits,
    totalUploads,
    getLastVisitFormatted
  } = useUsageStats();
  const {
    logEvent
  } = useAuditLog();
  useEffect(() => {
    logEvent('page_view', 'Visited Home page', 'Home');
  }, [logEvent]);
  const features = [{
    icon: Database,
    title: '10+ Sample Datasets',
    description: 'Choose from landmarks, cities, sales data, and more—or upload your own files'
  }, {
    icon: Edit3,
    title: 'Inline Data Editing',
    description: 'Click any cell to edit values directly in the interactive data table'
  }, {
    icon: BarChart3,
    title: '7 Chart Types',
    description: 'Distribution, pie, scatter, trend, grouped, radar, and boolean visualizations'
  }, {
    icon: Map,
    title: 'Map Integration',
    description: 'Drag markers and draw geometries on OpenStreetMap for geo data'
  }, {
    icon: Shield,
    title: 'PII Protection',
    description: 'Mark and track sensitive personal information columns with one click'
  }, {
    icon: ShieldCheck,
    title: 'Data Validation',
    description: 'Quality scores for completeness, consistency, validity, and uniqueness'
  }];
  return <>
      <Helmet>
        <title>BYOD - Bring Your Own Data</title>
        <meta name="description" content="Upload, analyze, edit, and validate your data with BYOD. Interactive charts, map editing, PII protection, and quality validation." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-sm">
              Bring Your Own Data
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Welcome to <span className="gradient-text">BYOD</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Your complete data studio for uploading, editing, visualizing, and validating data. 
              Work with sample datasets or bring your own data files.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/upload">
                <Button size="lg" className="gap-2 text-lg px-8 py-6">
                  <Sparkles className="w-5 h-5" />
                  Open Data Studio
                </Button>
              </Link>
              <Link to="/docs">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                  Learn More
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="glass border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{totalVisits}</p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-success/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-xl bg-success/10">
                  <Upload className="w-8 h-8 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{totalUploads}</p>
                  <p className="text-sm text-muted-foreground">Files Uploaded</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-warning/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-xl bg-warning/10">
                  <Clock className="w-8 h-8 text-warning" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{getLastVisitFormatted()}</p>
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-4">
              Everything You Need
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              A complete toolkit for data exploration, editing, and quality assurance
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(feature => {
              const Icon = feature.icon;
              return <Card key={feature.title} className="hover:shadow-lg transition-shadow hover:border-primary/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>;
            })}
            </div>
          </section>

          {/* Workflow Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[{
              step: 1,
              title: 'Select Data',
              icon: Database,
              desc: 'Choose a sample dataset or upload files'
            }, {
              step: 2,
              title: 'Edit & Tag',
              icon: Edit3,
              desc: 'Modify cells and mark PII columns'
            }, {
              step: 3,
              title: 'Visualize',
              icon: PieChart,
              desc: 'Explore charts, stats, and maps'
            }, {
              step: 4,
              title: 'Validate',
              icon: ShieldCheck,
              desc: 'Check quality and process data'
            }].map((item, idx) => <div key={item.step} className="text-center relative">
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <Badge variant="secondary" className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2">
                    {item.step}
                  </Badge>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>)}
            </div>
          </section>

          {/* CTA Section */}
          
        </main>
      </div>
    </>;
};
export default Index;