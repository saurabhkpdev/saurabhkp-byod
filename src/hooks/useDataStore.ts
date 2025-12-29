import { useState, useCallback } from 'react';
import { DataColumn, DataRow, UploadedData, DataStats } from '@/types/data';

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

  return {
    data,
    isLoading,
    loadData,
    updateCell,
    togglePII,
    getStats,
    clearData,
  };
};
