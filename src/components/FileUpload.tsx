import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onDataLoaded: (data: Record<string, unknown>[], fileName: string) => void;
}

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
    <div className="w-full max-w-2xl mx-auto">
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
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-scale-in">
          <X className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
};
