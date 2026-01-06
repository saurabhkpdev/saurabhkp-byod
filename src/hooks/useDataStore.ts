import { useState, useCallback } from 'react';
import { DataColumn, DataRow, UploadedData, DataStats } from '@/types/data';
import { BulkReplaceOptions, TransformType } from '@/components/BulkEditPanel';

export const useDataStore = () => {
  const [data, setData] = useState<UploadedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inferType = (value: unknown): 'string' | 'number' | 'boolean' | 'date' => {
    if (value === null || value === undefined || value === '') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number' || !isNaN(Number(value))) return 'number';
    
    const dateValue = new Date(String(value));
    if (!isNaN(dateValue.getTime()) && String(value).match(/^\d{4}-\d{2}-\d{2}/)) {
      return 'date';
    }
    
    return 'string';
  };

  const loadData = useCallback((rawData: Record<string, unknown>[], fileName: string) => {
    setIsLoading(true);
    
    if (rawData.length === 0) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const columnNames = Object.keys(rawData[0]);
    const columns: DataColumn[] = columnNames.map(name => {
      const sampleValues = rawData.slice(0, 100).map(row => row[name]);
      const types = sampleValues.filter(v => v !== null && v !== '').map(inferType);
      const mostCommonType = types.length > 0 
        ? types.sort((a, b) =>
            types.filter(v => v === a).length - types.filter(v => v === b).length
          ).pop() || 'string'
        : 'string';
      
      return {
        name,
        type: mostCommonType,
        isPII: false,
      };
    });

    const rows: DataRow[] = rawData.map(row => {
      const processedRow: DataRow = {};
      columnNames.forEach(col => {
        const value = row[col];
        if (value === null || value === undefined || value === '') {
          processedRow[col] = null;
        } else if (typeof value === 'number') {
          processedRow[col] = value;
        } else if (typeof value === 'boolean') {
          processedRow[col] = value;
        } else {
          const numValue = Number(value);
          processedRow[col] = !isNaN(numValue) && String(value).trim() !== '' 
            ? numValue 
            : String(value);
        }
      });
      return processedRow;
    });

    setData({ columns, rows, fileName });
    setIsLoading(false);
  }, []);

  const updateCell = useCallback((rowIndex: number, columnName: string, value: string | number | boolean | null) => {
    setData(prev => {
      if (!prev) return null;
      const newRows = [...prev.rows];
      newRows[rowIndex] = { ...newRows[rowIndex], [columnName]: value };
      return { ...prev, rows: newRows };
    });
  }, []);

  const togglePII = useCallback((columnName: string) => {
    setData(prev => {
      if (!prev) return null;
      const newColumns = prev.columns.map(col =>
        col.name === columnName ? { ...col, isPII: !col.isPII } : col
      );
      return { ...prev, columns: newColumns };
    });
  }, []);

  const getStats = useCallback((): DataStats[] => {
    if (!data) return [];

    return data.columns.map(column => {
      const values = data.rows.map(row => row[column.name]);
      const nonNullValues = values.filter(v => v !== null && v !== '');
      const uniqueValues = new Set(nonNullValues);
      
      const stats: DataStats = {
        column: column.name,
        count: values.length,
        nullCount: values.length - nonNullValues.length,
        unique: uniqueValues.size,
        type: column.type,
      };

      if (column.type === 'number') {
        const numericValues = nonNullValues.filter(v => typeof v === 'number') as number[];
        if (numericValues.length > 0) {
          stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          stats.min = Math.min(...numericValues);
          stats.max = Math.max(...numericValues);
        }
      } else if (nonNullValues.length > 0) {
        const sortedValues = [...nonNullValues].sort();
        stats.min = String(sortedValues[0]);
        stats.max = String(sortedValues[sortedValues.length - 1]);
      }

      return stats;
    });
  }, [data]);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  // Add a formula-computed column
  const addFormulaColumn = useCallback((columnName: string, formula: string) => {
    setData(prev => {
      if (!prev) return null;

      // Create new column definition
      const newColumn: DataColumn = {
        name: columnName,
        type: 'string', // Will be inferred from results
        isPII: false,
      };

      // Evaluate formula for each row
      const newRows = prev.rows.map(row => {
        let result: string | number | boolean | null = null;
        try {
          // Replace [column_name] with actual values
          let evalFormula = formula;
          prev.columns.forEach(col => {
            const value = row[col.name];
            const replacement = value === null ? 'null' : 
              typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : String(value);
            evalFormula = evalFormula.replace(new RegExp(`\\[${col.name}\\]`, 'g'), replacement);
          });
          
          // Safely evaluate the formula
          // eslint-disable-next-line no-new-func
          const fn = new Function(`return ${evalFormula}`);
          result = fn();
          
          // Clean up result
          if (result === undefined || result === null || (typeof result === 'number' && isNaN(result))) {
            result = null;
          }
        } catch {
          result = null;
        }
        return { ...row, [columnName]: result };
      });

      // Infer the type from results
      const sampleResults = newRows.slice(0, 100).map(r => r[columnName]).filter(v => v !== null);
      let inferredType: 'string' | 'number' | 'boolean' | 'date' = 'string';
      if (sampleResults.length > 0) {
        if (sampleResults.every(v => typeof v === 'number')) {
          inferredType = 'number';
        } else if (sampleResults.every(v => typeof v === 'boolean')) {
          inferredType = 'boolean';
        }
      }

      return {
        ...prev,
        columns: [...prev.columns, { ...newColumn, type: inferredType }],
        rows: newRows,
      };
    });
  }, []);

  // Bulk find and replace
  const bulkReplace = useCallback((
    columnName: string, 
    findValue: string, 
    replaceValue: string, 
    options: BulkReplaceOptions
  ): number => {
    let count = 0;
    
    setData(prev => {
      if (!prev) return null;

      const newRows = prev.rows.map(row => {
        const cellValue = row[columnName];
        if (cellValue === null) return row;

        const cellStr = String(cellValue);
        let matched = false;

        if (options.matchWholeCell) {
          matched = options.caseSensitive 
            ? cellStr === findValue
            : cellStr.toLowerCase() === findValue.toLowerCase();
        } else {
          matched = options.caseSensitive
            ? cellStr.includes(findValue)
            : cellStr.toLowerCase().includes(findValue.toLowerCase());
        }

        if (matched) {
          count++;
          let newValue: string;
          if (options.matchWholeCell) {
            newValue = replaceValue;
          } else {
            const regex = new RegExp(
              findValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              options.caseSensitive ? 'g' : 'gi'
            );
            newValue = cellStr.replace(regex, replaceValue);
          }
          return { ...row, [columnName]: newValue };
        }
        return row;
      });

      return { ...prev, rows: newRows };
    });

    return count;
  }, []);

  // Bulk set value for entire column
  const bulkSetValue = useCallback((columnName: string, value: string | number | boolean | null): number => {
    let count = 0;

    setData(prev => {
      if (!prev) return null;

      const newRows = prev.rows.map(row => {
        count++;
        return { ...row, [columnName]: value };
      });

      return { ...prev, rows: newRows };
    });

    return count;
  }, []);

  // Bulk transform column
  const bulkTransform = useCallback((columnName: string, transform: TransformType): number => {
    let count = 0;

    setData(prev => {
      if (!prev) return null;

      const newRows = prev.rows.map(row => {
        const value = row[columnName];
        
        if (transform === 'clear_nulls' && value === null) {
          count++;
          return { ...row, [columnName]: '' };
        }

        if (value === null || typeof value !== 'string') return row;

        let newValue: string = value;
        switch (transform) {
          case 'uppercase':
            newValue = value.toUpperCase();
            break;
          case 'lowercase':
            newValue = value.toLowerCase();
            break;
          case 'capitalize':
            newValue = value.replace(/\b\w/g, c => c.toUpperCase());
            break;
          case 'trim':
            newValue = value.trim();
            break;
        }

        if (newValue !== value) {
          count++;
        }
        return { ...row, [columnName]: newValue };
      });

      return { ...prev, rows: newRows };
    });

    return count;
  }, []);

  return {
    data,
    isLoading,
    loadData,
    updateCell,
    togglePII,
    getStats,
    clearData,
    addFormulaColumn,
    bulkReplace,
    bulkSetValue,
    bulkTransform,
  };
};
