import { useState, useCallback } from 'react';
import { Shield, ShieldOff, Edit2, Check, X } from 'lucide-react';
import { DataColumn, DataRow } from '@/types/data';
import { cn } from '@/lib/utils';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DataTableProps {
  columns: DataColumn[];
  rows: DataRow[];
  onCellUpdate: (rowIndex: number, columnName: string, value: string | number | boolean | null) => void;
  onTogglePII: (columnName: string) => void;
}

interface EditingCell {
  rowIndex: number;
  columnName: string;
  value: string;
}

export const DataTable = ({ columns, rows, onCellUpdate, onTogglePII }: DataTableProps) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const { logEvent } = useAuditLog();

  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(rows.length / pageSize);

  const handleStartEdit = useCallback((rowIndex: number, columnName: string, currentValue: unknown) => {
    setEditingCell({
      rowIndex: page * pageSize + rowIndex,
      columnName,
      value: currentValue === null ? '' : String(currentValue),
    });
  }, [page]);

  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const column = columns.find(c => c.name === editingCell.columnName);
    let parsedValue: string | number | boolean | null = editingCell.value;
    
    if (editingCell.value === '') {
      parsedValue = null;
    } else if (column?.type === 'number') {
      parsedValue = Number(editingCell.value);
      if (isNaN(parsedValue)) parsedValue = editingCell.value;
    } else if (column?.type === 'boolean') {
      parsedValue = editingCell.value.toLowerCase() === 'true';
    }
    
    onCellUpdate(editingCell.rowIndex, editingCell.columnName, parsedValue);
    logEvent('data_edit', `Edited cell [${editingCell.rowIndex + 1}, ${editingCell.columnName}]`, 'Data Upload', { rowIndex: editingCell.rowIndex, column: editingCell.columnName, newValue: parsedValue });
    setEditingCell(null);
  }, [editingCell, columns, onCellUpdate, logEvent]);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleTogglePII = useCallback((columnName: string) => {
    const column = columns.find(c => c.name === columnName);
    const isCurrentlyPII = column?.isPII ?? false;
    onTogglePII(columnName);
    logEvent(isCurrentlyPII ? 'pii_untagged' : 'pii_tagged', `${isCurrentlyPII ? 'Untagged' : 'Tagged'} column "${columnName}" as PII`, 'Data Upload', { column: columnName });
  }, [columns, onTogglePII, logEvent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const formatCellValue = (value: unknown, isPII: boolean) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground/50 italic">null</span>;
    }
    if (isPII) {
      return <span className="text-pii">••••••••</span>;
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="rounded-xl border border-border bg-card">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center bg-muted/50">#</TableHead>
                {columns.map((column) => (
                  <TableHead 
                    key={column.name} 
                    className={cn(
                      "min-w-[150px] bg-muted/50",
                      column.isPII && "bg-pii/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{column.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {column.type}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 ml-auto",
                              column.isPII && "text-pii hover:text-pii"
                            )}
                            onClick={() => handleTogglePII(column.name)}
                          >
                            {column.isPII ? (
                              <Shield className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldOff className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {column.isPII ? "Marked as PII - Click to unmark" : "Click to mark as PII"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="group">
                  <TableCell className="text-center text-muted-foreground text-sm font-mono">
                    {page * pageSize + rowIndex + 1}
                  </TableCell>
                  {columns.map((column) => {
                    const actualRowIndex = page * pageSize + rowIndex;
                    const isEditing = editingCell?.rowIndex === actualRowIndex && 
                                     editingCell?.columnName === column.name;
                    
                    return (
                      <TableCell 
                        key={column.name}
                        className={cn(
                          "relative transition-colors",
                          column.isPII && "bg-pii/5"
                        )}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              onKeyDown={handleKeyDown}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                              <Check className="w-3.5 h-3.5 text-success" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                              <X className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center justify-between cursor-pointer group/cell"
                            onClick={() => handleStartEdit(rowIndex, column.name, row[column.name])}
                          >
                            <span className="truncate max-w-[200px]">
                              {formatCellValue(row[column.name], column.isPII)}
                            </span>
                            <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, rows.length)} of {rows.length} rows
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
