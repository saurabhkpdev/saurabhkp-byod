import { useCallback, useState } from 'react';
import { Upload, Sparkles, X, FileText, Image as ImageIcon, FileType, CheckCircle2, Download, FileSearch, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { UNSTRUCTURED_ACCEPT, prepareUnstructured, isUnstructuredFile } from '@/lib/unstructuredParsers';
import type { Template } from '@/components/TemplateSelector';
import { UNSTRUCTURED_SAMPLE_DOCUMENTS } from '@/lib/unstructuredSamples';

interface UnstructuredUploadProps {
  onDataLoaded: (data: Record<string, unknown>[], fileName: string) => void;
  onBack: () => void;
  template: Template;
}

interface PreviewState {
  fileName: string;
  text: string;          // raw text for preview + extraction
  source: 'sample' | 'upload';
}

export const UnstructuredUpload = ({ onDataLoaded, onBack, template }: UnstructuredUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const schema = template.extractionSchema || [];
  const sampleDocument = UNSTRUCTURED_SAMPLE_DOCUMENTS[template.id];

  const extractFromPayload = useCallback(async (
    payload: { kind: 'text'; text: string } | { kind: 'image'; imageDataUrl: string },
    fileName: string,
  ) => {
    setStatusMessage(`Extracting ${schema.length} fields with AI...`);
    const { data, error: fnError } = await supabase.functions.invoke('extract-unstructured', {
      body: {
        fileName,
        templateName: template.name,
        schema,
        ...(payload.kind === 'text'
          ? { text: payload.text }
          : { imageDataUrl: payload.imageDataUrl }),
      },
    });

    if (fnError) throw new Error(fnError.message || 'Extraction failed');
    if (data?.error) throw new Error(data.error);

    const rows: Record<string, unknown>[] = data?.rows || [];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('AI could not extract the required fields from this document.');
    }
    return rows;
  }, [schema, template.name]);

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
      // Build a preview text representation
      const previewText = payload.kind === 'text'
        ? payload.text
        : '[Image document — preview not available. Click "Extract Data" to run AI extraction.]';
      setPreview({ fileName: file.name, text: previewText, source: 'upload' });
      // Stash payload via closure on extract button
      (window as unknown as { __unstructuredPayload?: typeof payload }).__unstructuredPayload = payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }, []);

  const handleLoadSampleDocument = useCallback(async () => {
    if (!sampleDocument) return;
    setError(null);
    setIsLoading(true);
    setStatusMessage('Loading sample document...');
    try {
      const res = await fetch(sampleDocument.file);
      if (!res.ok) throw new Error('Failed to load sample document');
      const text = await res.text();
      setPreview({ fileName: sampleDocument.label, text, source: 'sample' });
      (window as unknown as { __unstructuredPayload?: { kind: 'text'; text: string } }).__unstructuredPayload = {
        kind: 'text',
        text,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }, [sampleDocument]);

  const handleExtract = useCallback(async () => {
    if (!preview) return;
    const stash = (window as unknown as {
      __unstructuredPayload?:
        | { kind: 'text'; text: string }
        | { kind: 'image'; imageDataUrl: string };
    }).__unstructuredPayload;
    const payload = stash ?? { kind: 'text' as const, text: preview.text };

    setError(null);
    setIsLoading(true);
    try {
      const rows = await extractFromPayload(payload, preview.fileName);
      onDataLoaded(rows, preview.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }, [preview, extractFromPayload, onDataLoaded]);

  const handleDiscardPreview = useCallback(() => {
    setPreview(null);
    setError(null);
    delete (window as unknown as { __unstructuredPayload?: unknown }).__unstructuredPayload;
  }, []);

  const handleDownloadSampleDocument = useCallback(() => {
    if (!sampleDocument) return;
    const link = document.createElement('a');
    link.href = sampleDocument.file;
    link.download = sampleDocument.label;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [sampleDocument]);

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
          <h3 className="font-semibold">{template.name}</h3>
          <p className="text-sm text-muted-foreground">
            Upload a document — AI will extract the predefined fields below.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} disabled={isLoading}>
          Change Template
        </Button>
      </div>

      {schema.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Fields that will be extracted</h4>
            <Badge variant="secondary" className="text-xs">{schema.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {schema.map((f) => (
              <div key={f.name} className="flex items-start gap-2 text-xs">
                <span className="font-mono font-medium text-foreground shrink-0">{f.name}</span>
                <span className="text-muted-foreground truncate">— {f.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview pane — shown after upload OR loading a sample */}
      {preview ? (
        <div className="border border-border rounded-2xl bg-card overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{preview.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {preview.source === 'sample' ? 'Sample document loaded' : 'Document loaded'} · Review then extract
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDiscardPreview} disabled={isLoading}>
              <X className="w-4 h-4 mr-1" />
              Discard
            </Button>
          </div>

          <pre className="p-4 max-h-80 overflow-auto text-xs whitespace-pre-wrap font-mono text-foreground bg-background">
            {preview.text || '[Empty document]'}
          </pre>

          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {isLoading ? statusMessage || 'Working...' : `AI will extract ${schema.length} fields into a structured table for validation.`}
            </p>
            <Button onClick={handleExtract} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4" />
                  Extract Data
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
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
                {isLoading ? statusMessage || 'Processing...' : 'Drop your document or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                AI will extract the {schema.length} predefined fields into a structured table
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileType className="w-3.5 h-3.5" /> PDF</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> DOCX, TXT, MD</span>
              <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> PNG, JPG, WEBP</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-scale-in">
          <X className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">or use a sample document</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="outline" onClick={handleLoadSampleDocument} disabled={!sampleDocument || isLoading}>
              <FileSearch className="w-4 h-4 mr-2" />
              Load Sample Document
            </Button>
            <Button variant="ghost" onClick={handleDownloadSampleDocument} disabled={!sampleDocument}>
              <Download className="w-4 h-4 mr-2" />
              Download Sample Document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
