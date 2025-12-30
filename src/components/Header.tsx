import { Link } from 'react-router-dom';
import { Database, FileSpreadsheet, Trash2, BookOpen, Upload, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';

interface HeaderProps {
  fileName?: string;
  onClear?: () => void;
  showHomeLink?: boolean;
  onGoHome?: () => void;
}

export const Header = ({
  fileName,
  onClear
}: HeaderProps) => {
  const navLinkClasses = "flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted";
  const activeClasses = "text-primary bg-primary/10";

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-xl gradient-primary">
                <Database className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">BYOD</h1>
                <p className="text-xs text-muted-foreground">Upload • Manipulate • Process</p>
              </div>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l">
              <NavLink 
                to="/" 
                end
                className={navLinkClasses}
                activeClassName={activeClasses}
              >
                Home
              </NavLink>
              <NavLink 
                to="/upload" 
                className={navLinkClasses}
                activeClassName={activeClasses}
              >
                <Upload className="w-4 h-4" />
                Data Upload
              </NavLink>
              <NavLink 
                to="/docs" 
                className={navLinkClasses}
                activeClassName={activeClasses}
              >
                <BookOpen className="w-4 h-4" />
                Docs
              </NavLink>
              <NavLink 
                to="/admin" 
                className={navLinkClasses}
                activeClassName={activeClasses}
              >
                <Shield className="w-4 h-4" />
                Admin
              </NavLink>
            </nav>
          </div>
          
          {/* File info and actions */}
          <div className="flex items-center gap-4">
            {/* Mobile Navigation */}
            <nav className="flex md:hidden items-center gap-1">
              <NavLink 
                to="/" 
                end
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                activeClassName="text-primary bg-primary/10"
              >
                Home
              </NavLink>
              <NavLink 
                to="/upload" 
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                activeClassName="text-primary bg-primary/10"
              >
                <Upload className="w-4 h-4" />
              </NavLink>
              <NavLink 
                to="/docs" 
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                activeClassName="text-primary bg-primary/10"
              >
                <BookOpen className="w-4 h-4" />
              </NavLink>
              <NavLink 
                to="/admin" 
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                activeClassName="text-primary bg-primary/10"
              >
                <Shield className="w-4 h-4" />
              </NavLink>
            </nav>

            {fileName && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{fileName}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onClear} 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Clear Data</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
