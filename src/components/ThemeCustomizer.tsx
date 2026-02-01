import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useThemeCustomizer, ColorPalette } from '@/hooks/useThemeCustomizer';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function PalettePreview({ palette, isActive, onClick, onDelete }: { 
  palette: ColorPalette; 
  isActive: boolean; 
  onClick: () => void;
  onDelete?: () => void;
}) {
  const { hslToHex } = useThemeCustomizer();
  
  return (
    <div
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
        isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
      <div className="flex gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full border border-border"
          style={{ backgroundColor: `hsl(${palette.primary})` }}
          title="Primary"
        />
        <div
          className="w-8 h-8 rounded-full border border-border"
          style={{ backgroundColor: `hsl(${palette.accent})` }}
          title="Accent"
        />
        <div
          className="w-8 h-8 rounded-full border border-border"
          style={{ backgroundColor: `hsl(${palette.success})` }}
          title="Success"
        />
        <div
          className="w-8 h-8 rounded-full border border-border"
          style={{ backgroundColor: `hsl(${palette.warning})` }}
          title="Warning"
        />
        <div
          className="w-8 h-8 rounded-full border border-border"
          style={{ backgroundColor: `hsl(${palette.destructive})` }}
          title="Destructive"
        />
      </div>
      <p className="font-medium text-sm">{palette.name}</p>
      {palette.id.startsWith('custom-') && (
        <Badge variant="secondary" className="mt-1 text-xs">Custom</Badge>
      )}
    </div>
  );
}

export function ThemeCustomizer() {
  const {
    currentPalette,
    defaultPalettes,
    customPalettes,
    selectPalette,
    createCustomPalette,
    deleteCustomPalette,
    resetToDefault,
    hslToHex,
  } = useThemeCustomizer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [accentColor, setAccentColor] = useState('#a855f7');

  const handleCreatePalette = () => {
    if (!customName.trim()) {
      toast.error('Please enter a palette name');
      return;
    }
    createCustomPalette(customName, { primary: primaryColor, accent: accentColor });
    toast.success(`Palette "${customName}" created and applied!`);
    setDialogOpen(false);
    setCustomName('');
    setPrimaryColor('#6366f1');
    setAccentColor('#a855f7');
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    selectPalette(palette);
    toast.success(`Applied "${palette.name}" palette`);
  };

  const handleDeletePalette = (palette: ColorPalette) => {
    deleteCustomPalette(palette.id);
    toast.success(`Deleted "${palette.name}" palette`);
  };

  const handleReset = () => {
    resetToDefault();
    toast.success('Reset to default palette');
  };

  return (
    <div className="space-y-6">
      {/* Current Theme Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Current Theme
              </CardTitle>
              <CardDescription>
                Active color palette: <span className="font-medium text-foreground">{currentPalette.name}</span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary" />
              <div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground font-mono">{hslToHex(currentPalette.primary)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-accent" />
              <div>
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-muted-foreground font-mono">{hslToHex(currentPalette.accent)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-success" />
              <div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-xs text-muted-foreground font-mono">{hslToHex(currentPalette.success)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-warning" />
              <div>
                <p className="text-sm font-medium">Warning</p>
                <p className="text-xs text-muted-foreground font-mono">{hslToHex(currentPalette.warning)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-destructive" />
              <div>
                <p className="text-sm font-medium">Destructive</p>
                <p className="text-xs text-muted-foreground font-mono">{hslToHex(currentPalette.destructive)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Palettes */}
      <Card>
        <CardHeader>
          <CardTitle>Default Palettes</CardTitle>
          <CardDescription>Choose from pre-designed color schemes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultPalettes.map((palette) => (
              <PalettePreview
                key={palette.id}
                palette={palette}
                isActive={currentPalette.id === palette.id}
                onClick={() => handleSelectPalette(palette)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Palettes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Palettes</CardTitle>
              <CardDescription>Create your own color schemes using hex codes</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Palette
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Palette</DialogTitle>
                  <DialogDescription>
                    Enter a name and choose your primary and accent colors using hex codes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="palette-name">Palette Name</Label>
                    <Input
                      id="palette-name"
                      placeholder="My Custom Theme"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="primary-color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 rounded border border-input cursor-pointer"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#6366f1"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Accent Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="accent-color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-12 h-10 rounded border border-input cursor-pointer"
                        />
                        <Input
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          placeholder="#a855f7"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <div
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: accentColor }}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePalette}>
                    Create Palette
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {customPalettes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No custom palettes yet</p>
              <p className="text-sm">Create your first custom color scheme using hex codes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customPalettes.map((palette) => (
                <PalettePreview
                  key={palette.id}
                  palette={palette}
                  isActive={currentPalette.id === palette.id}
                  onClick={() => handleSelectPalette(palette)}
                  onDelete={() => handleDeletePalette(palette)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
