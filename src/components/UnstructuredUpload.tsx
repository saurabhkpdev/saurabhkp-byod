import { useCallback, useState } from 'react';
import { Upload, Sparkles, X, FileText, Image as ImageIcon, FileType, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { UNSTRUCTURED_ACCEPT, prepareUnstructured, isUnstructuredFile } from '@/lib/unstructuredParsers';
import type { Template } from '@/components/TemplateSelector';
import { UNSTRUCTURED_SAMPLE_ROWS } from '@/lib/unstructuredSampleData';

interface UnstructuredUploadProps {
  onDataLoaded: (data: Record<string, unknown>[], fileName: string) => void;
  onBack: () => void;
  template?: Template;
}

export const UnstructuredUpload = ({ onDataLoaded, onBack, template }: UnstructuredUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    if (!isUnstructuredFile(file.name)) {
      setError('Unsupported file. Use PDF, DOCX, TXT, MD, or an image (PNG/JPG/WEBP).');
      setIsLoading(false);
      return;
    }

    try {
      setStatusMessage('Reading file...');
      const payload = await prepareUnstructured(file);

      setStatusMessage('Extracting structured data with AI...');
      const { data, error: fnError } = await supabase.functions.invoke('extract-unstructured', {
        body: {
          fileName: file.name,
          hint: hint.trim() || undefined,
          ...(payload.kind === 'text'
            ? { text: payload.text }
            : { imageDataUrl: payload.imageDataUrl }),
        },
      });

      if (fnError) throw new Error(fnError.message || 'Extraction failed');
      if (data?.error) throw new Error(data.error);

      const rows: Record<string, unknown>[] = data?.rows || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('AI could not find any tabular data in this file.');
      }

      onDataLoaded(rows, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }, [onDataLoaded, hint]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Unstructured Data (AI-powered)</h3>
          <p className="text-sm text-muted-foreground">
            Upload a PDF, Word doc, image, or text file. AI will extract a structured table.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} disabled={isLoading}>
          Change Template
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="extraction-hint">Optional: tell the AI what to extract</Label>
        <Textarea
          id="extraction-hint"
          placeholder="e.g. Extract every invoice line with quantity, unit price, and total"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
        )}
      >
        <input
          type="file"
          accept={UNSTRUCTURED_ACCEPT}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
          <div className={cn(
            'p-4 rounded-2xl transition-all duration-300',
            isDragging ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted group-hover:bg-primary/10',
          )}>
            {isLoading ? (
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {isLoading ? statusMessage || 'Processing...' : 'Drop your file or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              AI will read the document and turn it into rows + columns
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><FileType className="w-3.5 h-3.5" /> PDF</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> DOCX, TXT, MD</span>
            <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> PNG, JPG, WEBP</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-scale-in">
          <X className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
};
