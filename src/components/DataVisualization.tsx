import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DataColumn, DataRow } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DataVisualizationProps {
  columns: DataColumn[];
  rows: DataRow[];
}

const COLORS = [
  'hsl(239, 84%, 67%)',
  'hsl(262, 83%, 58%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(339, 90%, 51%)',
  'hsl(200, 80%, 50%)',
  'hsl(280, 70%, 55%)',
];

export const DataVisualization = ({ columns, rows }: DataVisualizationProps) => {
  const numericColumns = columns.filter(c => c.type === 'number');
  const categoricalColumns = columns.filter(c => c.type === 'string');

  const [selectedNumericCol, setSelectedNumericCol] = useState<string>(
    numericColumns[0]?.name || ''
  );
  const [selectedCategoricalCol, setSelectedCategoricalCol] = useState<string>(
    categoricalColumns[0]?.name || ''
  );

  const histogramData = useMemo(() => {
    if (!selectedNumericCol) return [];
    
    const values = rows
      .map(r => r[selectedNumericCol])
      .filter((v): v is number => typeof v === 'number');
    
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binSize = range / binCount || 1;

    const bins: { range: string; count: number }[] = [];
    for (let i = 0; i < binCount; i++) {
      const binMin = min + i * binSize;
      const binMax = min + (i + 1) * binSize;
      const count = values.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;
      bins.push({
        range: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
        count,
      });
    }

    return bins;
  }, [rows, selectedNumericCol]);

  const pieData = useMemo(() => {
    if (!selectedCategoricalCol) return [];
    
    const valueCounts: Record<string, number> = {};
    rows.forEach(row => {
      const value = row[selectedCategoricalCol];
      const key = value === null ? '(null)' : String(value);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });

    return Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [rows, selectedCategoricalCol]);

  if (numericColumns.length === 0 && categoricalColumns.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No suitable columns for visualization</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={numericColumns.length > 0 ? "histogram" : "pie"} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="histogram" disabled={numericColumns.length === 0}>
          Distribution
        </TabsTrigger>
        <TabsTrigger value="pie" disabled={categoricalColumns.length === 0}>
          Categories
        </TabsTrigger>
      </TabsList>

      <TabsContent value="histogram" className="mt-6">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Value Distribution</CardTitle>
            <Select value={selectedNumericCol} onValueChange={setSelectedNumericCol}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pie" className="mt-6">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Category Distribution</CardTitle>
            <Select value={selectedCategoricalCol} onValueChange={setSelectedCategoricalCol}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {categoricalColumns.map(col => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
