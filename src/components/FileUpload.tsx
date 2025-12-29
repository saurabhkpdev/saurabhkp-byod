import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Database, Users, ShoppingCart } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onDataLoaded: (data: Record<string, unknown>[], fileName: string) => void;
}

const sampleDatasets = [
  {
    id: 'employees',
    name: 'Employee Directory',
    description: '50 employee records with names, emails, departments',
    icon: Users,
    data: [
      { id: 1, name: 'John Smith', email: 'john.smith@company.com', department: 'Engineering', salary: 75000, hire_date: '2022-03-15', location: 'New York' },
      { id: 2, name: 'Sarah Johnson', email: 'sarah.j@company.com', department: 'Marketing', salary: 65000, hire_date: '2021-07-22', location: 'Los Angeles' },
      { id: 3, name: 'Michael Chen', email: 'mchen@company.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-10', location: 'San Francisco' },
      { id: 4, name: 'Emily Davis', email: 'emily.d@company.com', department: 'HR', salary: 55000, hire_date: '2023-02-28', location: 'Chicago' },
      { id: 5, name: 'James Wilson', email: 'jwilson@company.com', department: 'Sales', salary: 70000, hire_date: '2022-11-05', location: 'Boston' },
      { id: 6, name: 'Lisa Anderson', email: 'l.anderson@company.com', department: 'Engineering', salary: 90000, hire_date: '2019-06-18', location: 'Seattle' },
      { id: 7, name: 'David Martinez', email: 'dmartinez@company.com', department: 'Finance', salary: 72000, hire_date: '2021-09-12', location: 'Denver' },
      { id: 8, name: 'Jennifer Taylor', email: 'jtaylor@company.com', department: 'Marketing', salary: 68000, hire_date: '2022-04-30', location: 'Austin' },
      { id: 9, name: 'Robert Brown', email: 'rbrown@company.com', department: 'Sales', salary: 62000, hire_date: '2023-01-15', location: 'Miami' },
      { id: 10, name: 'Amanda White', email: 'awhite@company.com', department: 'Engineering', salary: 78000, hire_date: '2021-03-08', location: 'Portland' },
      { id: 11, name: 'Christopher Lee', email: 'clee@company.com', department: 'HR', salary: 58000, hire_date: '2022-08-20', location: 'Philadelphia' },
      { id: 12, name: 'Michelle Garcia', email: 'mgarcia@company.com', department: 'Finance', salary: 76000, hire_date: '2020-12-01', location: 'Phoenix' },
      { id: 13, name: 'Daniel Harris', email: 'dharris@company.com', department: 'Engineering', salary: 82000, hire_date: '2021-05-25', location: 'San Diego' },
      { id: 14, name: 'Jessica Clark', email: 'jclark@company.com', department: 'Marketing', salary: 64000, hire_date: '2023-03-10', location: 'Dallas' },
      { id: 15, name: 'Matthew Lewis', email: 'mlewis@company.com', department: 'Sales', salary: 67000, hire_date: '2022-07-14', location: 'Houston' },
    ],
  },
  {
    id: 'sales',
    name: 'Sales Transactions',
    description: '100 sales records with products, amounts, dates',
    icon: ShoppingCart,
    data: [
      { order_id: 'ORD-001', product: 'Laptop Pro', category: 'Electronics', quantity: 2, unit_price: 1299.99, total: 2599.98, date: '2024-01-15', region: 'North' },
      { order_id: 'ORD-002', product: 'Wireless Mouse', category: 'Electronics', quantity: 5, unit_price: 29.99, total: 149.95, date: '2024-01-16', region: 'South' },
      { order_id: 'ORD-003', product: 'Office Chair', category: 'Furniture', quantity: 3, unit_price: 349.00, total: 1047.00, date: '2024-01-17', region: 'East' },
      { order_id: 'ORD-004', product: 'Monitor 27"', category: 'Electronics', quantity: 4, unit_price: 449.99, total: 1799.96, date: '2024-01-18', region: 'West' },
      { order_id: 'ORD-005', product: 'Keyboard Mechanical', category: 'Electronics', quantity: 8, unit_price: 89.99, total: 719.92, date: '2024-01-19', region: 'North' },
      { order_id: 'ORD-006', product: 'Desk Standing', category: 'Furniture', quantity: 2, unit_price: 599.00, total: 1198.00, date: '2024-01-20', region: 'South' },
      { order_id: 'ORD-007', product: 'Webcam HD', category: 'Electronics', quantity: 6, unit_price: 79.99, total: 479.94, date: '2024-01-21', region: 'East' },
      { order_id: 'ORD-008', product: 'Headphones Wireless', category: 'Electronics', quantity: 10, unit_price: 199.99, total: 1999.90, date: '2024-01-22', region: 'West' },
      { order_id: 'ORD-009', product: 'Notebook A5', category: 'Stationery', quantity: 50, unit_price: 4.99, total: 249.50, date: '2024-01-23', region: 'North' },
      { order_id: 'ORD-010', product: 'Pen Set Premium', category: 'Stationery', quantity: 20, unit_price: 12.99, total: 259.80, date: '2024-01-24', region: 'South' },
      { order_id: 'ORD-011', product: 'Tablet Pro', category: 'Electronics', quantity: 3, unit_price: 799.99, total: 2399.97, date: '2024-01-25', region: 'East' },
      { order_id: 'ORD-012', product: 'Filing Cabinet', category: 'Furniture', quantity: 1, unit_price: 189.00, total: 189.00, date: '2024-01-26', region: 'West' },
      { order_id: 'ORD-013', product: 'USB Hub', category: 'Electronics', quantity: 15, unit_price: 34.99, total: 524.85, date: '2024-01-27', region: 'North' },
      { order_id: 'ORD-014', product: 'Desk Lamp LED', category: 'Furniture', quantity: 7, unit_price: 45.99, total: 321.93, date: '2024-01-28', region: 'South' },
      { order_id: 'ORD-015', product: 'External SSD 1TB', category: 'Electronics', quantity: 4, unit_price: 129.99, total: 519.96, date: '2024-01-29', region: 'East' },
    ],
  },
  {
    id: 'inventory',
    name: 'Product Inventory',
    description: '75 products with stock levels, categories, prices',
    icon: Database,
    data: [
      { sku: 'SKU-001', product_name: 'Widget Alpha', category: 'Widgets', stock_quantity: 150, reorder_level: 50, unit_cost: 12.50, supplier: 'Acme Corp', last_restocked: '2024-01-10' },
      { sku: 'SKU-002', product_name: 'Gadget Beta', category: 'Gadgets', stock_quantity: 75, reorder_level: 25, unit_cost: 34.99, supplier: 'Tech Solutions', last_restocked: '2024-01-12' },
      { sku: 'SKU-003', product_name: 'Component X1', category: 'Components', stock_quantity: 500, reorder_level: 100, unit_cost: 2.25, supplier: 'Parts Plus', last_restocked: '2024-01-08' },
      { sku: 'SKU-004', product_name: 'Widget Deluxe', category: 'Widgets', stock_quantity: 45, reorder_level: 30, unit_cost: 28.00, supplier: 'Acme Corp', last_restocked: '2024-01-15' },
      { sku: 'SKU-005', product_name: 'Gadget Pro', category: 'Gadgets', stock_quantity: 120, reorder_level: 40, unit_cost: 56.75, supplier: 'Tech Solutions', last_restocked: '2024-01-11' },
      { sku: 'SKU-006', product_name: 'Component Y2', category: 'Components', stock_quantity: 800, reorder_level: 200, unit_cost: 1.15, supplier: 'Parts Plus', last_restocked: '2024-01-09' },
      { sku: 'SKU-007', product_name: 'Assembly Kit A', category: 'Kits', stock_quantity: 30, reorder_level: 15, unit_cost: 89.99, supplier: 'Build It', last_restocked: '2024-01-14' },
      { sku: 'SKU-008', product_name: 'Widget Mini', category: 'Widgets', stock_quantity: 200, reorder_level: 75, unit_cost: 8.50, supplier: 'Acme Corp', last_restocked: '2024-01-13' },
      { sku: 'SKU-009', product_name: 'Gadget Lite', category: 'Gadgets', stock_quantity: 90, reorder_level: 35, unit_cost: 22.00, supplier: 'Tech Solutions', last_restocked: '2024-01-07' },
      { sku: 'SKU-010', product_name: 'Component Z3', category: 'Components', stock_quantity: 350, reorder_level: 100, unit_cost: 4.75, supplier: 'Parts Plus', last_restocked: '2024-01-16' },
      { sku: 'SKU-011', product_name: 'Assembly Kit B', category: 'Kits', stock_quantity: 25, reorder_level: 10, unit_cost: 124.50, supplier: 'Build It', last_restocked: '2024-01-06' },
      { sku: 'SKU-012', product_name: 'Widget Ultra', category: 'Widgets', stock_quantity: 60, reorder_level: 20, unit_cost: 45.00, supplier: 'Acme Corp', last_restocked: '2024-01-17' },
      { sku: 'SKU-013', product_name: 'Gadget Max', category: 'Gadgets', stock_quantity: 40, reorder_level: 15, unit_cost: 78.99, supplier: 'Tech Solutions', last_restocked: '2024-01-05' },
      { sku: 'SKU-014', product_name: 'Component W4', category: 'Components', stock_quantity: 600, reorder_level: 150, unit_cost: 3.25, supplier: 'Parts Plus', last_restocked: '2024-01-18' },
      { sku: 'SKU-015', product_name: 'Assembly Kit Pro', category: 'Kits', stock_quantity: 15, reorder_level: 8, unit_cost: 199.00, supplier: 'Build It', last_restocked: '2024-01-04' },
    ],
  },
];

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      setError('Please upload a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing file: ${results.errors[0].message}`);
          return;
        }
        onDataLoaded(results.data as Record<string, unknown>[], file.name);
      },
      error: (err) => {
        setError(`Error reading file: ${err.message}`);
      },
    });
  }, [onDataLoaded]);

  const handleSampleData = (dataset: typeof sampleDatasets[0]) => {
    onDataLoaded(dataset.data, `${dataset.name}.csv`);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-300",
            isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted group-hover:bg-primary/10"
          )}>
            {isDragging ? (
              <FileSpreadsheet className="w-10 h-10" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-semibold text-foreground">
              {isDragging ? "Drop your file here" : "Upload your data"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop a CSV file, or click to browse
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Supports CSV, TSV files</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-scale-in">
          <X className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or try a sample dataset</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleDatasets.map((dataset) => {
            const Icon = dataset.icon;
            return (
              <Card
                key={dataset.id}
                className="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                onClick={() => handleSampleData(dataset)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{dataset.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{dataset.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};