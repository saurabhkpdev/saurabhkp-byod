import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LoadStrategy = 'truncate_load' | 'merge_upsert' | 'append_only';

export interface ValidationRule {
  column: string;
  rule: 'required' | 'min' | 'max' | 'regex' | 'unique';
  value?: string | number;
  message?: string;
}

export interface LoadConfig {
  id: string;
  template_id: string;
  template_name: string;
  load_strategy: LoadStrategy;
  primary_key_columns: string[];
  validation_rules: ValidationRule[];
  auto_version: boolean;
  allow_user_override: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const STRATEGY_LABELS: Record<LoadStrategy, string> = {
  truncate_load: 'Truncate & Load',
  merge_upsert: 'Merge / Upsert',
  append_only: 'Append Only',
};

export const STRATEGY_DESCRIPTIONS: Record<LoadStrategy, string> = {
  truncate_load: 'Delete all existing rows, then insert new data (full refresh)',
  merge_upsert: 'Match on key columns, update existing rows, insert new ones',
  append_only: 'Always insert new rows without touching existing data',
};

export function useLoadConfig() {
  const [configs, setConfigs] = useState<LoadConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('template_load_configs')
      .select('*')
      .order('template_name');

    if (error) {
      console.error('Failed to fetch load configs:', error);
    } else {
      setConfigs((data || []).map(d => ({
        ...d,
        load_strategy: d.load_strategy as LoadStrategy,
        validation_rules: (d.validation_rules as unknown as ValidationRule[]) || [],
      })));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const saveConfig = useCallback(async (config: Omit<LoadConfig, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    // Check if config exists for this template
    const existing = configs.find(c => c.template_id === config.template_id);

    if (existing) {
      const { data, error } = await supabase
        .from('template_load_configs')
        .update({
          template_name: config.template_name,
          load_strategy: config.load_strategy,
          primary_key_columns: config.primary_key_columns,
          validation_rules: JSON.parse(JSON.stringify(config.validation_rules)),
          auto_version: config.auto_version,
          allow_user_override: config.allow_user_override,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        toast.error('Failed to update load config');
        console.error(error);
        return null;
      }
      await fetchConfigs();
      return data;
    } else {
      const { data, error } = await supabase
        .from('template_load_configs')
        .insert([{
          template_id: config.template_id,
          template_name: config.template_name,
          load_strategy: config.load_strategy,
          primary_key_columns: config.primary_key_columns,
          validation_rules: JSON.parse(JSON.stringify(config.validation_rules)),
          auto_version: config.auto_version,
          allow_user_override: config.allow_user_override,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        toast.error('Failed to save load config');
        console.error(error);
        return null;
      }
      await fetchConfigs();
      return data;
    }
  }, [configs, fetchConfigs]);

  const deleteConfig = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('template_load_configs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete load config');
      return false;
    }
    await fetchConfigs();
    return true;
  }, [fetchConfigs]);

  const getConfigForTemplate = useCallback((templateId: string): LoadConfig | undefined => {
    return configs.find(c => c.template_id === templateId);
  }, [configs]);

  return {
    configs,
    isLoading,
    fetchConfigs,
    saveConfig,
    deleteConfig,
    getConfigForTemplate,
  };
}
