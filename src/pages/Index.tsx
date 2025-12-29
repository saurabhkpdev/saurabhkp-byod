import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUsageStats } from '@/hooks/useUsageStats';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Shield, Clock, Activity, FileUp } from 'lucide-react';
const Index = () => {
  const {
    totalVisits,
    totalUploads,
    getLastVisitFormatted
  } = useUsageStats();
  const features = [{
    icon: Upload,
    title: 'Easy Upload',
    description: 'Drag and drop your CSV files or choose from sample datasets'
  }, {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Automatic statistics and visualizations for your data'
  }, {
    icon: Shield,
    title: 'PII Protection',
    description: 'Mark and track sensitive personal information columns'
  }];
  return <>
      <Helmet>
        <title>DataLens - Your Data Analysis Platform</title>
        <meta name="description" content="Upload, analyze, and protect your data with DataLens. View statistics, create visualizations, and manage PII columns." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to <span className="gradient-text">BYOD</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Your powerful platform for uploading, analyzing, and protecting data. 
              Get insights with statistics, visualizations, and PII management.
            </p>
            <Link to="/upload">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                <FileUp className="w-5 h-5" />
                Start Uploading Data
              </Button>
            </Link>
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
            <h2 className="text-3xl font-bold text-center mb-10">
              What You Can Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map(feature => {
              const Icon = feature.icon;
              return <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>;
            })}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-12 px-8 rounded-2xl glass border">
            <h2 className="text-2xl font-bold mb-4">Ready to analyze your data?</h2>
            <p className="text-muted-foreground mb-6">
              Upload your CSV file and get instant insights with statistics and visualizations.
            </p>
            <Link to="/upload">
              <Button variant="outline" size="lg" className="gap-2">
                <Upload className="w-4 h-4" />
                Go to Data Upload
              </Button>
            </Link>
          </section>
        </main>
      </div>
    </>;
};
export default Index;