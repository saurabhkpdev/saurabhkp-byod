import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Shield, Sparkles, Map, Database, Edit3, PieChart, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
const Index = () => {
  const {
    logEvent
  } = useAuditLog();
  const { currentUser } = useAuth();
  const firstName = (currentUser?.username || '').trim().split(/\s+/)[0] || '';
  const { autoStartTour, startTour } = useOnboardingTour();
  useEffect(() => {
    logEvent('page_view', 'Visited Home page', 'Home');
  }, [logEvent]);
  useEffect(() => {
    return autoStartTour();
  }, [autoStartTour]);
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
        <title>Bring Your Data - Bring Your Data</title>
        <meta name="description" content="Upload, analyze, edit, and validate your data with Bring Your Data. Interactive charts, map editing, PII protection, and quality validation." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section */}
          <section className="text-center mb-10 sm:mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-sm">
              Bring Your Data
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6">
              Welcome <span className="gradient-text">{firstName || 'to Bring Your Data'}</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
              Your complete data studio for uploading, editing, visualizing, and validating data. 
              Work with sample datasets or bring your data files.
            </p>
            <div className="flex gap-4 justify-center flex-wrap" data-tour="hero-cta">
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
              <Button size="lg" variant="ghost" className="gap-2 text-lg px-8 py-6" onClick={startTour}>
                <HelpCircle className="w-5 h-5" />
                Take a Tour
              </Button>
            </div>
          </section>


          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-4">
              Everything You Need
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              A complete toolkit for data exploration, editing, and quality assurance
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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