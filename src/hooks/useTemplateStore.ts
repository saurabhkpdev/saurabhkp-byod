import { useState, useEffect, useCallback } from 'react';

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
  sampleData: Record<string, unknown>[];
  category: 'general' | 'geographical';
  createdAt: string;
  updatedAt: string;
  isCustom: true;
}

export interface SystemTemplateOverride {
  name?: string;
  description?: string;
  requiredColumns?: string[];
  optionalColumns?: string[];
  sampleData?: Record<string, unknown>[];
  category?: 'general' | 'geographical';
  updatedAt: string;
}

const STORAGE_KEY = 'byod-custom-templates';
const SYSTEM_OVERRIDES_KEY = 'byod-system-template-overrides';

export function useTemplateStore() {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [systemOverrides, setSystemOverrides] = useState<Record<string, SystemTemplateOverride>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load templates and overrides from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomTemplates(JSON.parse(stored));
      }
      const overrides = localStorage.getItem(SYSTEM_OVERRIDES_KEY);
      if (overrides) {
        setSystemOverrides(JSON.parse(overrides));
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTemplates = useCallback((templates: CustomTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      setCustomTemplates(templates);
    } catch (error) {
      console.error('Failed to save custom templates:', error);
      throw new Error('Failed to save template');
    }
  }, []);

  const saveSystemOverrides = useCallback((overrides: Record<string, SystemTemplateOverride>) => {
    try {
      localStorage.setItem(SYSTEM_OVERRIDES_KEY, JSON.stringify(overrides));
      setSystemOverrides(overrides);
    } catch (error) {
      console.error('Failed to save system overrides:', error);
      throw new Error('Failed to save override');
    }
  }, []);

  const addTemplate = useCallback((
    template: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>
  ): CustomTemplate => {
    const newTemplate: CustomTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };
    
    const updated = [...customTemplates, newTemplate];
    saveTemplates(updated);
    return newTemplate;
  }, [customTemplates, saveTemplates]);

  const updateTemplate = useCallback((
    id: string,
    updates: Partial<Omit<CustomTemplate, 'id' | 'createdAt' | 'isCustom'>>
  ): CustomTemplate | null => {
    const index = customTemplates.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const updatedTemplate: CustomTemplate = {
      ...customTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const updated = [...customTemplates];
    updated[index] = updatedTemplate;
    saveTemplates(updated);
    return updatedTemplate;
  }, [customTemplates, saveTemplates]);

  const deleteTemplate = useCallback((id: string): boolean => {
    const filtered = customTemplates.filter(t => t.id !== id);
    if (filtered.length === customTemplates.length) return false;
    saveTemplates(filtered);
    return true;
  }, [customTemplates, saveTemplates]);

  const getTemplate = useCallback((id: string): CustomTemplate | undefined => {
    return customTemplates.find(t => t.id === id);
  }, [customTemplates]);

  const updateSystemTemplate = useCallback((
    systemTemplateId: string,
    updates: Omit<SystemTemplateOverride, 'updatedAt'>
  ) => {
    const newOverrides = {
      ...systemOverrides,
      [systemTemplateId]: { ...updates, updatedAt: new Date().toISOString() },
    };
    saveSystemOverrides(newOverrides);
  }, [systemOverrides, saveSystemOverrides]);

  const resetSystemTemplate = useCallback((systemTemplateId: string) => {
    const newOverrides = { ...systemOverrides };
    delete newOverrides[systemTemplateId];
    saveSystemOverrides(newOverrides);
  }, [systemOverrides, saveSystemOverrides]);

  const getSystemOverride = useCallback((systemTemplateId: string): SystemTemplateOverride | undefined => {
    return systemOverrides[systemTemplateId];
  }, [systemOverrides]);

  return {
    customTemplates,
    systemOverrides,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    updateSystemTemplate,
    resetSystemTemplate,
    getSystemOverride,
  };
}

// Utility function to generate sample data based on column definitions
export function generateSampleDataFromColumns(
  columns: { name: string; type: 'string' | 'number' | 'date' | 'boolean' }[],
  rowCount: number = 5
): Record<string, unknown>[] {
  const sampleValues: Record<string, unknown[]> = {
    string: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'],
    number: [10, 25, 50, 75, 100, 150, 200, 250],
    date: ['2024-01-15', '2024-02-20', '2024-03-10', '2024-04-05', '2024-05-25'],
    boolean: [true, false, true, false, true],
  };

  const locationNames = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin', 'Dubai', 'Singapore'];
  const companyNames = ['Acme Corp', 'Tech Solutions', 'Global Inc', 'Innovation Labs', 'Prime Services'];
  const personNames = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'James Wilson'];

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: Record<string, unknown> = {};
    
    columns.forEach((col, colIndex) => {
      const colNameLower = col.name.toLowerCase();
      
      // Smart value generation based on column name
      if (colNameLower.includes('id') && col.type === 'number') {
        row[col.name] = rowIndex + 1;
      } else if (colNameLower.includes('id') && col.type === 'string') {
        row[col.name] = `ID-${String(rowIndex + 1).padStart(3, '0')}`;
      } else if (colNameLower.includes('name') && colNameLower.includes('company')) {
        row[col.name] = companyNames[rowIndex % companyNames.length];
      } else if (colNameLower.includes('name') || colNameLower.includes('person')) {
        row[col.name] = personNames[rowIndex % personNames.length];
      } else if (colNameLower.includes('location') || colNameLower.includes('city')) {
        row[col.name] = locationNames[rowIndex % locationNames.length];
      } else if (colNameLower.includes('lat')) {
        row[col.name] = 40 + (rowIndex * 2.5);
      } else if (colNameLower.includes('lon') || colNameLower.includes('lng')) {
        row[col.name] = -74 + (rowIndex * 10);
      } else if (colNameLower.includes('email')) {
        const name = personNames[rowIndex % personNames.length].toLowerCase().replace(' ', '.');
        row[col.name] = `${name}@example.com`;
      } else if (colNameLower.includes('phone')) {
        row[col.name] = `+1-555-${String(1000 + rowIndex).padStart(4, '0')}`;
      } else if (colNameLower.includes('price') || colNameLower.includes('cost') || colNameLower.includes('amount')) {
        row[col.name] = Math.round((50 + rowIndex * 25.5) * 100) / 100;
      } else if (colNameLower.includes('quantity') || colNameLower.includes('count')) {
        row[col.name] = (rowIndex + 1) * 10;
      } else if (colNameLower.includes('status')) {
        const statuses = ['Active', 'Pending', 'Complete', 'On Hold', 'Archived'];
        row[col.name] = statuses[rowIndex % statuses.length];
      } else {
        // Default values based on type
        const values = sampleValues[col.type];
        row[col.name] = values[(rowIndex + colIndex) % values.length];
      }
    });
    
    return row;
  });
}
