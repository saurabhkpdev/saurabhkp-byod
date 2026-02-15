import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Key, Lock } from 'lucide-react';
import { LoadStrategy, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS, LoadConfig } from '@/hooks/useLoadConfig';

interface LoadStrategyPickerProps {
  config: LoadConfig | undefined;
  selectedStrategy: LoadStrategy;
  onStrategyChange: (strategy: LoadStrategy) => void;
}

const LoadStrategyPicker = ({ config, selectedStrategy, onStrategyChange }: LoadStrategyPickerProps) => {
  const isLocked = config && !config.allow_user_override;
  const effectiveStrategy = isLocked ? config.load_strategy : selectedStrategy;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4" />
            Load Strategy
          </Label>
          {isLocked && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Lock className="h-3 w-3" /> Admin locked
            </Badge>
          )}
        </div>

        {isLocked ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{STRATEGY_LABELS[effectiveStrategy]}</Badge>
            <span className="text-xs text-muted-foreground">{STRATEGY_DESCRIPTIONS[effectiveStrategy]}</span>
          </div>
        ) : (
          <Select value={effectiveStrategy} onValueChange={(v) => onStrategyChange(v as LoadStrategy)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STRATEGY_LABELS) as LoadStrategy[]).map(s => (
                <SelectItem key={s} value={s}>
                  {STRATEGY_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {config?.primary_key_columns && config.primary_key_columns.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Keys:</span>
            {config.primary_key_columns.map(col => (
              <Badge key={col} variant="outline" className="text-xs">
                <Key className="h-3 w-3 mr-1" />{col}
              </Badge>
            ))}
          </div>
        )}

        {config?.auto_version && (
          <p className="text-xs text-muted-foreground">📸 A version snapshot will be saved automatically before loading</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LoadStrategyPicker;
