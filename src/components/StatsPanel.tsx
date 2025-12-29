import { DataStats } from '@/types/data';
import { BarChart3, Hash, AlertCircle, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  stats: DataStats[];
  piiColumns: string[];
}

export const StatsPanel = ({ stats, piiColumns }: StatsPanelProps) => {
  const totalRows = stats[0]?.count || 0;
  const totalColumns = stats.length;
  const numericColumns = stats.filter(s => s.type === 'number').length;
  const totalNulls = stats.reduce((acc, s) => acc + s.nullCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Rows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Hash className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalColumns}</p>
                <p className="text-sm text-muted-foreground">Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNulls.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Null Values</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pii/10">
                <Fingerprint className="w-5 h-5 text-pii" />
              </div>
              <div>
                <p className="text-2xl font-bold">{piiColumns.length}</p>
                <p className="text-sm text-muted-foreground">PII Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Column Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {stats.map((stat) => (
                <div 
                  key={stat.column}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    piiColumns.includes(stat.column) 
                      ? "border-pii/30 bg-pii/5" 
                      : "border-border bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stat.column}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {stat.type}
                      </span>
                      {piiColumns.includes(stat.column) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pii/20 text-pii">
                          PII
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Unique</p>
                      <p className="font-medium">{stat.unique.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nulls</p>
                      <p className="font-medium">{stat.nullCount.toLocaleString()}</p>
                    </div>
                    {stat.type === 'number' && stat.mean !== undefined && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Mean</p>
                          <p className="font-medium">{stat.mean.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Range</p>
                          <p className="font-medium">{stat.min} - {stat.max}</p>
                        </div>
                      </>
                    )}
                    {stat.type !== 'number' && stat.min && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Min</p>
                          <p className="font-medium truncate">{String(stat.min).slice(0, 20)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max</p>
                          <p className="font-medium truncate">{String(stat.max).slice(0, 20)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
