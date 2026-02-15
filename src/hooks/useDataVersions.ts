import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DataColumn, DataRow } from '@/types/data';

export interface DataVersion {
  id: string;
  dataset_name: string;
  version_number: number;
  row_count: number;
  column_count: number;
  change_summary: string | null;
  created_at: string;
}

interface VersionSnapshot {
  columns: DataColumn[];
  rows: DataRow[];
}

export function useDataVersions() {
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersions = useCallback(async (datasetName: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('data_versions')
      .select('id, dataset_name, version_number, row_count, column_count, change_summary, created_at')
      .eq('dataset_name', datasetName)
      .order('version_number', { ascending: false });

    if (error) {
      toast.error('Failed to load version history');
      setVersions([]);
    } else {
      setVersions(data ?? []);
    }
    setIsLoading(false);
  }, []);

  const saveVersion = useCallback(async (
    datasetName: string,
    columns: DataColumn[],
    rows: DataRow[],
    changeSummary?: string,
  ) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) {
      toast.error('You must be logged in to save versions');
      return;
    }

    // Determine next version number
    const { data: latest } = await supabase
      .from('data_versions')
      .select('version_number')
      .eq('dataset_name', datasetName)
      .eq('user_id', userId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (latest && latest.length > 0 ? latest[0].version_number : 0) + 1;

    const snapshot: VersionSnapshot = { columns, rows };

    const { error } = await supabase.from('data_versions').insert({
      user_id: userId,
      dataset_name: datasetName,
      version_number: nextVersion,
      snapshot: snapshot as any,
      row_count: rows.length,
      column_count: columns.length,
      change_summary: changeSummary ?? `Version ${nextVersion}`,
    } as any);

    if (error) {
      toast.error('Failed to save version', { description: error.message });
    } else {
      toast.success(`Saved as version ${nextVersion}`);
      await fetchVersions(datasetName);
    }
  }, [fetchVersions]);

  const restoreVersion = useCallback(async (versionId: string): Promise<VersionSnapshot | null> => {
    const { data, error } = await supabase
      .from('data_versions')
      .select('snapshot, version_number')
      .eq('id', versionId)
      .single();

    if (error || !data) {
      toast.error('Failed to restore version');
      return null;
    }

    toast.success(`Restored to version ${data.version_number}`);
    return data.snapshot as unknown as VersionSnapshot;
  }, []);

  const deleteVersion = useCallback(async (versionId: string, datasetName: string) => {
    const { error } = await supabase
      .from('data_versions')
      .delete()
      .eq('id', versionId);

    if (error) {
      toast.error('Failed to delete version');
    } else {
      toast.success('Version deleted');
      await fetchVersions(datasetName);
    }
  }, [fetchVersions]);

  return { versions, isLoading, fetchVersions, saveVersion, restoreVersion, deleteVersion };
}
