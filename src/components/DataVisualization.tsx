import { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, ScatterChart, Scatter, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { DataColumn, DataRow } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChartIcon, TrendingUp, ScatterChartIcon, Activity, Target } from 'lucide-react';

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
  'hsl(15, 85%, 55%)',
  'hsl(180, 60%, 45%)',
  'hsl(320, 75%, 50%)',
];

export const DataVisualization = ({ columns, rows }: DataVisualizationProps) => {
  const numericColumns = columns.filter(c => c.type === 'number');
  const categoricalColumns = columns.filter(c => c.type === 'string');
  const dateColumns = columns.filter(c => c.type === 'date' || c.name.toLowerCase().includes('date'));
  const booleanColumns = columns.filter(c => c.type === 'boolean');

  const [selectedNumericCol, setSelectedNumericCol] = useState<string>(
    numericColumns[0]?.name || ''
  );
  const [selectedCategoricalCol, setSelectedCategoricalCol] = useState<string>(
    categoricalColumns[0]?.name || ''
  );
  const [selectedXAxis, setSelectedXAxis] = useState<string>(
    numericColumns[0]?.name || ''
  );
  const [selectedYAxis, setSelectedYAxis] = useState<string>(
    numericColumns[1]?.name || numericColumns[0]?.name || ''
  );
  const [selectedTimeCol, setSelectedTimeCol] = useState<string>(
    dateColumns[0]?.name || categoricalColumns[0]?.name || ''
  );
  const [selectedMetricCol, setSelectedMetricCol] = useState<string>(
    numericColumns[0]?.name || ''
  );
  const [selectedGroupCol, setSelectedGroupCol] = useState<string>(
    categoricalColumns[0]?.name || ''
  );
  const [selectedRadarMetrics, setSelectedRadarMetrics] = useState<string[]>(
    numericColumns.slice(0, 5).map(c => c.name)
  );

  // Histogram data
  const histogramData = useMemo(() => {
    if (!selectedNumericCol) return [];
    
    const values = rows
      .map(r => r[selectedNumericCol])
      .filter((v): v is number => typeof v === 'number');
    
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binCount = Math.min(15, Math.ceil(Math.sqrt(values.length)));
    const binSize = range / binCount || 1;

    const bins: { range: string; count: number; binStart: number }[] = [];
    for (let i = 0; i < binCount; i++) {
      const binMin = min + i * binSize;
      const binMax = min + (i + 1) * binSize;
      const count = values.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;
      bins.push({
        range: `${binMin.toFixed(0)}`,
        count,
        binStart: binMin,
      });
    }

    return bins;
  }, [rows, selectedNumericCol]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (!selectedCategoricalCol) return [];
    
    const valueCounts: Record<string, number> = {};
    rows.forEach(row => {
      const value = row[selectedCategoricalCol];
      const key = value === null || value === '' ? '(empty)' : String(value);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });

    return Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [rows, selectedCategoricalCol]);

  // Scatter plot data
  const scatterData = useMemo(() => {
    if (!selectedXAxis || !selectedYAxis) return [];
    
    return rows
      .filter(row => 
        typeof row[selectedXAxis] === 'number' && 
        typeof row[selectedYAxis] === 'number'
      )
      .map((row, index) => ({
        x: row[selectedXAxis] as number,
        y: row[selectedYAxis] as number,
        index,
      }));
  }, [rows, selectedXAxis, selectedYAxis]);

  // Time series / trend data
  const trendData = useMemo(() => {
    if (!selectedTimeCol || !selectedMetricCol) return [];
    
    const sorted = [...rows].sort((a, b) => {
      const aVal = String(a[selectedTimeCol] || '');
      const bVal = String(b[selectedTimeCol] || '');
      return aVal.localeCompare(bVal);
    });

    return sorted.slice(0, 50).map((row, index) => ({
      time: String(row[selectedTimeCol] || `Point ${index + 1}`).slice(0, 15),
      value: typeof row[selectedMetricCol] === 'number' ? row[selectedMetricCol] : 0,
    }));
  }, [rows, selectedTimeCol, selectedMetricCol]);

  // Grouped bar chart data
  const groupedData = useMemo(() => {
    if (!selectedGroupCol || !selectedMetricCol) return [];
    
    const groups: Record<string, { sum: number; count: number }> = {};
    rows.forEach(row => {
      const group = String(row[selectedGroupCol] || '(empty)');
      const value = typeof row[selectedMetricCol] === 'number' ? row[selectedMetricCol] : 0;
      
      if (!groups[group]) {
        groups[group] = { sum: 0, count: 0 };
      }
      groups[group].sum += value;
      groups[group].count += 1;
    });

    return Object.entries(groups)
      .map(([name, { sum, count }]) => ({
        name: name.slice(0, 20),
        total: sum,
        average: sum / count,
        count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [rows, selectedGroupCol, selectedMetricCol]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (selectedRadarMetrics.length === 0 || rows.length === 0) return [];
    
    // Calculate normalized averages for each metric
    const metrics = selectedRadarMetrics.map(metric => {
      const values = rows
        .map(r => r[metric])
        .filter((v): v is number => typeof v === 'number');
      
      if (values.length === 0) return { metric, value: 0, fullMark: 100 };
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const normalized = max > 0 ? (avg / max) * 100 : 0;
      
      return {
        metric: metric.slice(0, 12),
        value: Math.round(normalized),
        fullMark: 100,
      };
    });

    return metrics;
  }, [rows, selectedRadarMetrics]);

  // Boolean distribution data
  const booleanData = useMemo(() => {
    return booleanColumns.map(col => {
      let trueCount = 0;
      let falseCount = 0;
      let nullCount = 0;

      rows.forEach(row => {
        const val = row[col.name];
        if (val === true) trueCount++;
        else if (val === false) falseCount++;
        else nullCount++;
      });

      return {
        column: col.name,
        true: trueCount,
        false: falseCount,
        null: nullCount,
      };
    });
  }, [rows, booleanColumns]);

  // Determine available chart types based on data
  const availableCharts = useMemo(() => {
    const charts: string[] = [];
    if (numericColumns.length > 0) charts.push('histogram');
    if (categoricalColumns.length > 0) charts.push('pie');
    if (numericColumns.length >= 2) charts.push('scatter');
    if ((dateColumns.length > 0 || categoricalColumns.length > 0) && numericColumns.length > 0) charts.push('trend');
    if (categoricalColumns.length > 0 && numericColumns.length > 0) charts.push('grouped');
    if (numericColumns.length >= 3) charts.push('radar');
    if (booleanColumns.length > 0) charts.push('boolean');
    return charts;
  }, [numericColumns, categoricalColumns, dateColumns, booleanColumns]);

  if (availableCharts.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No suitable columns for visualization</p>
        </CardContent>
      </Card>
    );
  }

  const chartIcons: Record<string, React.ReactNode> = {
    histogram: <BarChart3 className="w-4 h-4" />,
    pie: <PieChartIcon className="w-4 h-4" />,
    scatter: <ScatterChartIcon className="w-4 h-4" />,
    trend: <TrendingUp className="w-4 h-4" />,
    grouped: <Activity className="w-4 h-4" />,
    radar: <Target className="w-4 h-4" />,
    boolean: <BarChart3 className="w-4 h-4" />,
  };

  const chartLabels: Record<string, string> = {
    histogram: 'Distribution',
    pie: 'Categories',
    scatter: 'Correlation',
    trend: 'Trend',
    grouped: 'By Group',
    radar: 'Radar',
    boolean: 'Boolean',
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue={availableCharts[0]} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {availableCharts.map(chart => (
            <TabsTrigger key={chart} value={chart} className="flex items-center gap-2">
              {chartIcons[chart]}
              {chartLabels[chart]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Histogram */}
        <TabsContent value="histogram" className="mt-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Value Distribution</CardTitle>
                <CardDescription>Histogram showing frequency of values</CardDescription>
              </div>
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

        {/* Pie Chart */}
        <TabsContent value="pie" className="mt-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Category Distribution</CardTitle>
                <CardDescription>Breakdown by category (top 10)</CardDescription>
              </div>
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

        {/* Scatter Plot */}
        <TabsContent value="scatter" className="mt-6">
          <Card className="glass">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Correlation Plot</CardTitle>
                <CardDescription>Compare two numeric variables</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="X Axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Y Axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name={selectedXAxis}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name={selectedYAxis}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <Scatter 
                      data={scatterData} 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend / Time Series */}
        <TabsContent value="trend" className="mt-6">
          <Card className="glass">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Trend Analysis</CardTitle>
                <CardDescription>Track values over time or sequence</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedTimeCol} onValueChange={setSelectedTimeCol}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Time/Order" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...dateColumns, ...categoricalColumns].map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMetricCol} onValueChange={setSelectedMetricCol}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10 }}
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
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grouped Bar Chart */}
        <TabsContent value="grouped" className="mt-6">
          <Card className="glass">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Aggregated by Group</CardTitle>
                <CardDescription>Sum and average metrics by category</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedGroupCol} onValueChange={setSelectedGroupCol}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoricalColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMetricCol} onValueChange={setSelectedMetricCol}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
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
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="average" name="Average" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar Chart */}
        <TabsContent value="radar" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Multi-Metric Overview</CardTitle>
              <CardDescription>Normalized average values across metrics (0-100 scale)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Radar
                      name="Average"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boolean Distribution */}
        <TabsContent value="boolean" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Boolean Fields Distribution</CardTitle>
              <CardDescription>True/False/Null breakdown for boolean columns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={booleanData} 
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      type="category" 
                      dataKey="column" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="true" name="True" stackId="a" fill={COLORS[2]} />
                    <Bar dataKey="false" name="False" stackId="a" fill={COLORS[4]} />
                    <Bar dataKey="null" name="Null" stackId="a" fill={COLORS[5]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};