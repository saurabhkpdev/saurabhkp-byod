import { useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileJson, FileCode, MapPin, FileText, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Template } from './TemplateSelector';
import { downloadSample, getAvailableFormats, SampleFormat } from '@/lib/sampleGenerators';
import { toast } from 'sonner';

interface SampleDownloadButtonProps {
  template: Template;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

const formatIcons: Record<SampleFormat, React.ReactNode> = {
  csv: <FileSpreadsheet className="w-4 h-4" />,
  xlsx: <FileSpreadsheet className="w-4 h-4" />,
  json: <FileJson className="w-4 h-4" />,
  xml: <FileCode className="w-4 h-4" />,
  geojson: <MapPin className="w-4 h-4" />,
  kml: <MapPin className="w-4 h-4" />,
  shp: <FileArchive className="w-4 h-4" />,
};

export function SampleDownloadButton({ 
  template, 
  variant = 'ghost', 
  size = 'sm',
  showLabel = true,
  className 
}: SampleDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableFormats = getAvailableFormats(template);
  
  const handleDownload = async (format: SampleFormat, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const success = await downloadSample(template, format);
      
      if (success) {
        toast.success(`Downloaded ${template.name} sample as ${format.toUpperCase()}`);
      } else {
        toast.error(`Failed to generate ${format.toUpperCase()} sample`);
      }
    } catch (err) {
      toast.error(`Error generating ${format.toUpperCase()} sample`);
    }
    
    setIsOpen(false);
  };

  const generalFormats = availableFormats.filter(f => !f.geoOnly);
  const geoFormats = availableFormats.filter(f => f.geoOnly);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant={variant} size={size} className={className}>
          <Download className="w-4 h-4" />
          {showLabel && <span className="ml-2">Sample</span>}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Download sample as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {generalFormats.map((format) => (
          <DropdownMenuItem 
            key={format.id}
            onClick={(e) => handleDownload(format.id, e)}
            className="cursor-pointer"
          >
            {formatIcons[format.id]}
            <span className="ml-2">{format.label}</span>
            <span className="ml-auto text-xs text-muted-foreground">.{format.extension}</span>
          </DropdownMenuItem>
        ))}
        
        {geoFormats.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Geo formats
            </DropdownMenuLabel>
            {geoFormats.map((format) => (
              <DropdownMenuItem 
                key={format.id}
                onClick={(e) => handleDownload(format.id, e)}
                className="cursor-pointer"
              >
                {formatIcons[format.id]}
                <span className="ml-2">{format.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">.{format.extension}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
