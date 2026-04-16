import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Users, 
  ShoppingCart, 
  Database, 
  MapPin, 
  Building2,
  Check,
  ArrowRight,
  Plus,
  Sparkles,
  FileText,
  Receipt,
  ScrollText,
  UserSquare,
  FileSignature,
  HeartPulse
} from 'lucide-react';
import { useTemplateStore, CustomTemplate } from '@/hooks/useTemplateStore';
import { SampleDownloadButton } from './SampleDownloadButton';
import { getAvailableFormats } from '@/lib/sampleGenerators';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  requiredColumns: string[];
  optionalColumns?: string[];
  sampleData: Record<string, unknown>[];
  category: 'general' | 'geographical' | 'unstructured';
  isCustom?: boolean;
  isUnstructured?: boolean;
  supportedFormats?: string[];
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onBack?: () => void;
}

export const systemTemplates: Template[] = [
  {
    id: 'employee-directory',
    name: 'Employee Directory',
    description: 'Standard employee records with personal and organizational data',
    icon: Users,
    category: 'general',
    requiredColumns: ['id', 'name', 'email', 'department'],
    optionalColumns: ['salary', 'hire_date', 'location', 'phone', 'manager'],
    sampleData: [
      { id: 1, name: 'John Smith', email: 'john.smith@company.com', department: 'Engineering', salary: 75000, hire_date: '2022-03-15', location: 'New York' },
      { id: 2, name: 'Sarah Johnson', email: 'sarah.j@company.com', department: 'Marketing', salary: 65000, hire_date: '2021-07-22', location: 'Los Angeles' },
      { id: 3, name: 'Michael Chen', email: 'mchen@company.com', department: 'Engineering', salary: 85000, hire_date: '2020-01-10', location: 'San Francisco' },
      { id: 4, name: 'Emily Davis', email: 'emily.d@company.com', department: 'HR', salary: 55000, hire_date: '2023-02-28', location: 'Chicago' },
      { id: 5, name: 'James Wilson', email: 'jwilson@company.com', department: 'Sales', salary: 70000, hire_date: '2022-11-05', location: 'Boston' },
    ],
  },
  {
    id: 'sales-transactions',
    name: 'Sales Transactions',
    description: 'Transaction records with products, amounts, and dates',
    icon: ShoppingCart,
    category: 'general',
    requiredColumns: ['order_id', 'product', 'quantity', 'total', 'date'],
    optionalColumns: ['category', 'unit_price', 'region', 'customer_id', 'discount'],
    sampleData: [
      { order_id: 'ORD-001', product: 'Laptop Pro', category: 'Electronics', quantity: 2, unit_price: 1299.99, total: 2599.98, date: '2024-01-15', region: 'North' },
      { order_id: 'ORD-002', product: 'Wireless Mouse', category: 'Electronics', quantity: 5, unit_price: 29.99, total: 149.95, date: '2024-01-16', region: 'South' },
      { order_id: 'ORD-003', product: 'Office Chair', category: 'Furniture', quantity: 3, unit_price: 349.00, total: 1047.00, date: '2024-01-17', region: 'East' },
      { order_id: 'ORD-004', product: 'Monitor 27"', category: 'Electronics', quantity: 4, unit_price: 449.99, total: 1799.96, date: '2024-01-18', region: 'West' },
      { order_id: 'ORD-005', product: 'Keyboard Mechanical', category: 'Electronics', quantity: 8, unit_price: 89.99, total: 719.92, date: '2024-01-19', region: 'North' },
    ],
  },
  {
    id: 'product-inventory',
    name: 'Product Inventory',
    description: 'Inventory tracking with stock levels and supplier info',
    icon: Database,
    category: 'general',
    requiredColumns: ['sku', 'product_name', 'stock_quantity', 'unit_cost'],
    optionalColumns: ['category', 'reorder_level', 'supplier', 'last_restocked', 'warehouse'],
    sampleData: [
      { sku: 'SKU-001', product_name: 'Widget Alpha', category: 'Widgets', stock_quantity: 150, reorder_level: 50, unit_cost: 12.50, supplier: 'Acme Corp', last_restocked: '2024-01-10' },
      { sku: 'SKU-002', product_name: 'Gadget Beta', category: 'Gadgets', stock_quantity: 75, reorder_level: 25, unit_cost: 34.99, supplier: 'Tech Solutions', last_restocked: '2024-01-12' },
      { sku: 'SKU-003', product_name: 'Component X1', category: 'Components', stock_quantity: 500, reorder_level: 100, unit_cost: 2.25, supplier: 'Parts Plus', last_restocked: '2024-01-08' },
      { sku: 'SKU-004', product_name: 'Widget Deluxe', category: 'Widgets', stock_quantity: 45, reorder_level: 30, unit_cost: 28.00, supplier: 'Acme Corp', last_restocked: '2024-01-15' },
      { sku: 'SKU-005', product_name: 'Gadget Pro', category: 'Gadgets', stock_quantity: 120, reorder_level: 40, unit_cost: 56.75, supplier: 'Tech Solutions', last_restocked: '2024-01-11' },
    ],
  },
  {
    id: 'geo-locations',
    name: 'Geographic Locations',
    description: 'Location data with coordinates for mapping',
    icon: MapPin,
    category: 'geographical',
    requiredColumns: ['name', 'latitude', 'longitude'],
    optionalColumns: ['address', 'city', 'country', 'category', 'description', 'status'],
    sampleData: [
      { name: 'Central Office', latitude: 48.8566, longitude: 2.3522, address: '123 Main St', city: 'Paris', country: 'France', category: 'Office', status: 'Active' },
      { name: 'Warehouse A', latitude: 52.5200, longitude: 13.4050, address: '456 Industrial Rd', city: 'Berlin', country: 'Germany', category: 'Warehouse', status: 'Active' },
      { name: 'Distribution Center', latitude: 51.5074, longitude: -0.1278, address: '789 Logistics Ave', city: 'London', country: 'UK', category: 'Distribution', status: 'Active' },
      { name: 'Regional Hub', latitude: 41.9028, longitude: 12.4964, address: '321 Commerce Blvd', city: 'Rome', country: 'Italy', category: 'Hub', status: 'Pending' },
      { name: 'Retail Store', latitude: 40.4168, longitude: -3.7038, address: '654 Shopping Lane', city: 'Madrid', country: 'Spain', category: 'Retail', status: 'Active' },
    ],
  },
  {
    id: 'facility-data',
    name: 'Facility Registry',
    description: 'Facilities with location and operational details',
    icon: Building2,
    category: 'geographical',
    requiredColumns: ['facility_id', 'facility_name', 'lat', 'lng', 'type'],
    optionalColumns: ['capacity', 'status', 'manager', 'contact_email', 'opening_date'],
    sampleData: [
      { facility_id: 'FAC-001', facility_name: 'Manufacturing Plant A', lat: 47.3769, lng: 8.5417, type: 'Manufacturing', capacity: 500, status: 'Operational', manager: 'Hans Mueller' },
      { facility_id: 'FAC-002', facility_name: 'Research Lab', lat: 50.1109, lng: 8.6821, type: 'R&D', capacity: 100, status: 'Operational', manager: 'Dr. Anna Schmidt' },
      { facility_id: 'FAC-003', facility_name: 'Logistics Hub', lat: 52.3676, lng: 4.9041, type: 'Logistics', capacity: 300, status: 'Operational', manager: 'Jan de Vries' },
      { facility_id: 'FAC-004', facility_name: 'Training Center', lat: 48.2082, lng: 16.3738, type: 'Training', capacity: 150, status: 'Under Renovation', manager: 'Maria Weber' },
      { facility_id: 'FAC-005', facility_name: 'Data Center', lat: 59.3293, lng: 18.0686, type: 'IT', capacity: 50, status: 'Operational', manager: 'Erik Lindqvist' },
    ],
  },
  {
    id: 'lease-extraction',
    name: 'Lease Agreement Extraction',
    description: 'Extract lease terms, parties, dates, and rent details from lease contracts',
    icon: FileSignature,
    category: 'unstructured',
    isUnstructured: true,
    supportedFormats: ['PDF', 'DOCX', 'Image'],
    requiredColumns: [],
    optionalColumns: [],
    sampleData: [],
  },
  {
    id: 'invoice-extraction',
    name: 'Invoice Extraction',
    description: 'Pull invoice number, vendor, line items, totals, and due dates from invoices',
    icon: Receipt,
    category: 'unstructured',
    isUnstructured: true,
    supportedFormats: ['PDF', 'Image', 'DOCX'],
    requiredColumns: [],
    optionalColumns: [],
    sampleData: [],
  },
  {
    id: 'contract-extraction',
    name: 'Contract Analysis',
    description: 'Extract parties, effective dates, obligations, and termination clauses',
    icon: ScrollText,
    category: 'unstructured',
    isUnstructured: true,
    supportedFormats: ['PDF', 'DOCX', 'TXT'],
    requiredColumns: [],
    optionalColumns: [],
    sampleData: [],
  },
  {
    id: 'resume-parser',
    name: 'Resume Parser',
    description: 'Parse candidate names, contact info, skills, education, and work history',
    icon: UserSquare,
    category: 'unstructured',
    isUnstructured: true,
    supportedFormats: ['PDF', 'DOCX', 'TXT'],
    requiredColumns: [],
    optionalColumns: [],
    sampleData: [],
  },
  {
    id: 'medical-records',
    name: 'Medical Records Extraction',
    description: 'Structure patient info, diagnoses, prescriptions, and visit notes from records',
    icon: HeartPulse,
    category: 'unstructured',
    isUnstructured: true,
    supportedFormats: ['PDF', 'Image', 'DOCX'],
    requiredColumns: [],
    optionalColumns: [],
    sampleData: [],
  },
  {
    id: 'document-intelligence',
    name: 'General Document Extraction',
    description: 'Extract structured data from any document — flexible AI parsing for custom needs',
    icon: FileText,
    category: 'unstructured',
    isUnstructured: true,
    supportedFormats: ['PDF', 'DOCX', 'Image', 'TXT', 'MD'],
    requiredColumns: [],
    optionalColumns: [],
    sampleData: [],
  },
];

export function TemplateSelector({ onSelectTemplate, onBack }: TemplateSelectorProps) {
  const navigate = useNavigate();
  const { customTemplates, getSystemOverride, isLoading } = useTemplateStore();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState<'all' | 'general' | 'geographical' | 'unstructured'>('all');

  // Combine system templates (with overrides) with custom templates
  const allTemplates: Template[] = [
    ...systemTemplates.map(t => {
      const override = getSystemOverride(t.id);
      return override ? { ...t, ...override } : t;
    }),
    ...customTemplates.map((ct: CustomTemplate) => ({
      ...ct,
      icon: ct.category === 'geographical' ? MapPin : FileSpreadsheet,
      optionalColumns: ct.optionalColumns,
    })),
  ];

  const filteredTemplates = allTemplates.filter(t => 
    filter === 'all' || t.category === filter
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Select a Template</span>
        </h2>
        <p className="text-muted-foreground">
          Choose a data template that matches your file structure
        </p>
      </div>

      {/* Back button */}
      {onBack && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to data source selection
          </Button>
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Templates
        </Button>
        <Button
          variant={filter === 'general' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('general')}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          General Data
        </Button>
        <Button
          variant={filter === 'geographical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('geographical')}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Geographical
        </Button>
        <Button
          variant={filter === 'unstructured' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unstructured')}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Document Intelligence
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/templates')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Custom
        </Button>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg ${
                isSelected ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                    {Icon ? (
                      <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-primary'}`} />
                    ) : template.category === 'geographical' ? (
                      <MapPin className={`w-5 h-5 ${isSelected ? '' : 'text-primary'}`} />
                    ) : (
                      <FileSpreadsheet className={`w-5 h-5 ${isSelected ? '' : 'text-primary'}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {template.category === 'geographical' && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <MapPin className="w-3 h-3" />
                        Geo
                      </Badge>
                    )}
                    {template.category === 'unstructured' && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        Unstructured
                      </Badge>
                    )}
                    {template.isCustom && (
                      <Badge variant="secondary" className="text-xs">Custom</Badge>
                    )}
                    {isSelected && (
                      <div className="p-1 bg-primary rounded-full">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <h3 className="font-semibold text-base leading-tight">{template.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1 self-center">
                    Formats:
                  </span>
                  {(template.supportedFormats ?? (template.isUnstructured 
                    ? ['PDF', 'DOCX', 'Image', 'TXT'] 
                    : getAvailableFormats(template).map(f => f.label))
                  ).map((fmt) => (
                    <Badge key={fmt} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                      {fmt}
                    </Badge>
                  ))}
                </div>
                {!template.isUnstructured && (
                  <SampleDownloadButton 
                    template={template}
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-foreground"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Continue button */}
      {selectedTemplate && (
        <div className="flex justify-center pt-4 animate-fade-in">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => onSelectTemplate(selectedTemplate)}
          >
            Continue with {selectedTemplate.name}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Utility function to generate CSV from template sample data
export function generateSampleCSV(template: Template): string {
  const allColumns = [...template.requiredColumns, ...(template.optionalColumns || [])];
  const headers = allColumns.join(',');
  
  const rows = template.sampleData.map(row => 
    allColumns.map(col => {
      const value = row[col];
      if (value === undefined || value === null) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return String(value);
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// Utility function to validate uploaded data against template
export function validateAgainstTemplate(
  data: Record<string, unknown>[],
  template: Template
): { isValid: boolean; missingColumns: string[]; message: string } {
  if (data.length === 0) {
    return { isValid: false, missingColumns: [], message: 'No data found in file' };
  }

  const uploadedColumns = Object.keys(data[0]).map(col => col.toLowerCase().trim());
  const requiredColumns = template.requiredColumns.map(col => col.toLowerCase().trim());
  
  const missingColumns = requiredColumns.filter(col => !uploadedColumns.includes(col));

  if (missingColumns.length > 0) {
    return {
      isValid: false,
      missingColumns: template.requiredColumns.filter(col => 
        missingColumns.includes(col.toLowerCase().trim())
      ),
      message: `Missing required columns: ${missingColumns.join(', ')}`
    };
  }

  return { isValid: true, missingColumns: [], message: 'File matches template structure' };
}
