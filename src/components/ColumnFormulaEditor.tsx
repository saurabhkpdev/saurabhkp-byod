import { useState } from 'react';
import { DataColumn } from '@/types/data';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Sparkles, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ColumnFormulaEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataColumn[];
  onAddFormulaColumn: (name: string, formula: string) => void;
}

const FORMULA_EXAMPLES = [
  { label: 'Sum two columns', formula: '[column1] + [column2]', desc: 'Add values from two numeric columns' },
  { label: 'Percentage', formula: '[part] / [total] * 100', desc: 'Calculate percentage of part to total' },
  { label: 'Concatenate', formula: '[first_name] + " " + [last_name]', desc: 'Combine text columns' },
  { label: 'Conditional', formula: '[value] > 100 ? "High" : "Low"', desc: 'If value > 100 then "High" else "Low"' },
  { label: 'Round', formula: 'Math.round([price] * 100) / 100', desc: 'Round to 2 decimal places' },
  { label: 'Uppercase', formula: '[name].toUpperCase()', desc: 'Convert text to uppercase' },
];

export const ColumnFormulaEditor = ({
  open,
  onOpenChange,
  columns,
  onAddFormulaColumn,
}: ColumnFormulaEditorProps) => {
  const [columnName, setColumnName] = useState('');
  const [formula, setFormula] = useState('');
  const { logEvent } = useAuditLog();

  const handleInsertColumn = (colName: string) => {
    setFormula(prev => prev + `[${colName}]`);
  };

  const handleApplyExample = (exampleFormula: string) => {
    setFormula(exampleFormula);
  };

  const handleSubmit = () => {
    if (!columnName.trim()) {
      toast.error('Please enter a column name');
      return;
    }
    if (!formula.trim()) {
      toast.error('Please enter a formula');
      return;
    }
    if (columns.some(c => c.name.toLowerCase() === columnName.trim().toLowerCase())) {
      toast.error('A column with this name already exists');
      return;
    }

    onAddFormulaColumn(columnName.trim(), formula.trim());
    logEvent('formula_column_added', `Added formula column "${columnName}"`, 'Data Studio', { columnName, formula });
    toast.success(`Formula column "${columnName}" added successfully`);
    setColumnName('');
    setFormula('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Add Formula Column
          </DialogTitle>
          <DialogDescription>
            Create a new computed column using formulas. Reference existing columns using [column_name] syntax.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Column Name */}
          <div className="space-y-2">
            <Label htmlFor="column-name">New Column Name</Label>
            <Input
              id="column-name"
              placeholder="e.g., total_price, full_name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
            />
          </div>

          {/* Available Columns */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Available Columns (click to insert)
            </Label>
            <ScrollArea className="h-20 rounded-md border p-2">
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <Badge
                    key={col.name}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleInsertColumn(col.name)}
                  >
                    {col.name}
                    <span className="ml-1 text-[10px] opacity-70">({col.type})</span>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Formula Input */}
          <div className="space-y-2">
            <Label htmlFor="formula">Formula</Label>
            <Textarea
              id="formula"
              placeholder="e.g., [price] * [quantity]"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          {/* Formula Examples */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Quick Examples
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {FORMULA_EXAMPLES.map((example) => (
                <Button
                  key={example.label}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2"
                  onClick={() => handleApplyExample(example.formula)}
                >
                  <div>
                    <div className="font-medium">{example.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                      {example.formula}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Calculator className="w-4 h-4 mr-2" />
            Add Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
