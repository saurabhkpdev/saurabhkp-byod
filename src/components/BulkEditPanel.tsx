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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Replace, Eraser, Edit3, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface BulkEditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataColumn[];
  onBulkReplace: (columnName: string, findValue: string, replaceValue: string, options: BulkReplaceOptions) => number;
  onBulkSetValue: (columnName: string, value: string | number | boolean | null) => number;
  onBulkTransform: (columnName: string, transform: TransformType) => number;
}

export interface BulkReplaceOptions {
  caseSensitive: boolean;
  matchWholeCell: boolean;
}

export type TransformType = 'uppercase' | 'lowercase' | 'trim' | 'capitalize' | 'clear_nulls';

const TRANSFORM_OPTIONS: { value: TransformType; label: string; desc: string }[] = [
  { value: 'uppercase', label: 'UPPERCASE', desc: 'Convert all text to uppercase' },
  { value: 'lowercase', label: 'lowercase', desc: 'Convert all text to lowercase' },
  { value: 'capitalize', label: 'Capitalize', desc: 'Capitalize first letter of each word' },
  { value: 'trim', label: 'Trim Whitespace', desc: 'Remove leading/trailing spaces' },
  { value: 'clear_nulls', label: 'Clear Nulls', desc: 'Replace null values with empty string' },
];

export const BulkEditPanel = ({
  open,
  onOpenChange,
  columns,
  onBulkReplace,
  onBulkSetValue,
  onBulkTransform,
}: BulkEditPanelProps) => {
  const { logEvent } = useAuditLog();
  
  // Find & Replace state
  const [replaceColumn, setReplaceColumn] = useState('');
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchWholeCell, setMatchWholeCell] = useState(false);

  // Set Value state
  const [setValueColumn, setSetValueColumn] = useState('');
  const [newValue, setNewValue] = useState('');

  // Transform state
  const [transformColumn, setTransformColumn] = useState('');
  const [transformType, setTransformType] = useState<TransformType>('uppercase');

  const handleFindReplace = () => {
    if (!replaceColumn) {
      toast.error('Please select a column');
      return;
    }
    if (!findValue) {
      toast.error('Please enter a value to find');
      return;
    }

    const count = onBulkReplace(replaceColumn, findValue, replaceValue, {
      caseSensitive,
      matchWholeCell,
    });

    logEvent('bulk_replace', `Bulk replaced "${findValue}" with "${replaceValue}" in column "${replaceColumn}"`, 'Data Studio', {
      column: replaceColumn,
      findValue,
      replaceValue,
      affectedRows: count,
    });

    toast.success(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`);
    if (count > 0) {
      setFindValue('');
      setReplaceValue('');
    }
  };

  const handleSetValue = () => {
    if (!setValueColumn) {
      toast.error('Please select a column');
      return;
    }

    const column = columns.find(c => c.name === setValueColumn);
    let parsedValue: string | number | boolean | null = newValue;

    if (newValue === '' || newValue.toLowerCase() === 'null') {
      parsedValue = null;
    } else if (column?.type === 'number') {
      parsedValue = Number(newValue);
      if (isNaN(parsedValue)) {
        toast.error('Please enter a valid number');
        return;
      }
    } else if (column?.type === 'boolean') {
      parsedValue = newValue.toLowerCase() === 'true';
    }

    const count = onBulkSetValue(setValueColumn, parsedValue);
    
    logEvent('bulk_set_value', `Set all values in "${setValueColumn}" to "${newValue}"`, 'Data Studio', {
      column: setValueColumn,
      newValue: parsedValue,
      affectedRows: count,
    });

    toast.success(`Updated ${count} cell${count !== 1 ? 's' : ''}`);
  };

  const handleTransform = () => {
    if (!transformColumn) {
      toast.error('Please select a column');
      return;
    }

    const count = onBulkTransform(transformColumn, transformType);
    
    logEvent('bulk_transform', `Applied "${transformType}" transform to column "${transformColumn}"`, 'Data Studio', {
      column: transformColumn,
      transform: transformType,
      affectedRows: count,
    });

    toast.success(`Transformed ${count} cell${count !== 1 ? 's' : ''}`);
  };

  const stringColumns = columns.filter(c => c.type === 'string');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Bulk Edit
          </DialogTitle>
          <DialogDescription>
            Make changes to multiple cells at once across your data.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="replace" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="replace" className="text-xs">
              <Replace className="w-3 h-3 mr-1" />
              Find & Replace
            </TabsTrigger>
            <TabsTrigger value="set" className="text-xs">
              <Eraser className="w-3 h-3 mr-1" />
              Set Value
            </TabsTrigger>
            <TabsTrigger value="transform" className="text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Transform
            </TabsTrigger>
          </TabsList>

          {/* Find & Replace */}
          <TabsContent value="replace" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={replaceColumn} onValueChange={setReplaceColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Find</Label>
                <Input
                  placeholder="Value to find"
                  value={findValue}
                  onChange={(e) => setFindValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Replace with</Label>
                <Input
                  placeholder="New value"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive"
                  checked={caseSensitive}
                  onCheckedChange={(checked) => setCaseSensitive(checked === true)}
                />
                <Label htmlFor="case-sensitive" className="text-sm">Case sensitive</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="match-whole"
                  checked={matchWholeCell}
                  onCheckedChange={(checked) => setMatchWholeCell(checked === true)}
                />
                <Label htmlFor="match-whole" className="text-sm">Match whole cell</Label>
              </div>
            </div>

            <Button onClick={handleFindReplace} className="w-full">
              <Replace className="w-4 h-4 mr-2" />
              Replace All
            </Button>
          </TabsContent>

          {/* Set Value */}
          <TabsContent value="set" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={setValueColumn} onValueChange={setSetValueColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>New Value for All Cells</Label>
              <Input
                placeholder="Enter new value (leave empty for null)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter "null" or leave empty to set all cells to null
              </p>
            </div>

            <Button onClick={handleSetValue} className="w-full" variant="destructive">
              <Eraser className="w-4 h-4 mr-2" />
              Set All Values
            </Button>
          </TabsContent>

          {/* Transform */}
          <TabsContent value="transform" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Column (text columns only)</Label>
              <Select value={transformColumn} onValueChange={setTransformColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {stringColumns.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No text columns available
                    </SelectItem>
                  ) : (
                    stringColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transformation</Label>
              <Select value={transformType} onValueChange={(v) => setTransformType(v as TransformType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{opt.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleTransform} className="w-full">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Apply Transform
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
