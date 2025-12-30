import { FileSpreadsheet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  fileName?: string;
  onClear?: () => void;
}

export const TopBar = ({ fileName, onClear }: TopBarProps) => {
  if (!fileName) return null;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClear} 
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Data
        </Button>
      </div>
    </header>
  );
};
