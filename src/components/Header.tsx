import { Link } from 'react-router-dom';
import { Database, FileSpreadsheet, Trash2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface HeaderProps {
  fileName?: string;
  onClear?: () => void;
  showHomeLink?: boolean;
  onGoHome?: () => void;
}
export const Header = ({
  fileName,
  onClear,
  showHomeLink,
  onGoHome
}: HeaderProps) => {
  return <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-xl gradient-primary">
                <Database className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">BYOD</h1>
                <p className="text-xs text-muted-foreground">Upload • Manipulate • Process</p>
              </div>
            </Link>
            
            {showHomeLink && <Button variant="ghost" size="sm" onClick={onGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>}
          </div>
          
          {fileName && <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onClear} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            </div>}
        </div>
      </div>
    </header>;
};