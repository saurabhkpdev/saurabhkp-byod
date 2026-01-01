import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Template, validateAgainstTemplate, generateSampleCSV } from './TemplateSelector';

interface FileUploadProps {
  onDataLoaded: (data: Record<string, unknown>[], fileName: string) => void;
  template: Template;
  onBack: () => void;
}

export const FileUpload = ({ onDataLoaded, template, onBack }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ message: string; missingColumns: string[] } | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setValidationError(null);
    
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

        const data = results.data as Record<string, unknown>[];
        
        // Validate against template
        const validation = validateAgainstTemplate(data, template);
        
        if (!validation.isValid) {
          setValidationError({
            message: validation.message,
            missingColumns: validation.missingColumns
          });
          return;
        }

        onDataLoaded(data, file.name);
      },
      error: (err) => {
        setError(`Error reading file: ${err.message}`);
      },
    });
  }, [onDataLoaded, template]);

  const handleSampleData = () => {
    onDataLoaded(template.sampleData, `${template.name} Sample.csv`);
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV(template);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const Icon = template.icon;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Selected template info */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{template.name}</h3>
          <p className="text-sm text-muted-foreground">
            Required columns: {template.requiredColumns.join(', ')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          Change Template
        </Button>
      </div>

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
              Drag and drop a CSV file matching the {template.name} template
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

      {validationError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3 animate-scale-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Wrong File Format</p>
              <p className="text-sm text-destructive/80">{validationError.message}</p>
            </div>
          </div>
          {validationError.missingColumns.length > 0 && (
            <div className="pl-8">
              <p className="text-sm text-muted-foreground mb-2">
                Your file must include these columns:
              </p>
              <div className="flex flex-wrap gap-2">
                {validationError.missingColumns.map((col) => (
                  <span key={col} className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="pl-8 pt-2">
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              Download Template CSV
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or use sample data</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleSampleData}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Load {template.name} Sample Data
          </Button>
          <Button variant="ghost" onClick={handleDownloadSample}>
            Download Template CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
