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

    const { data: inserted, error } = await supabase.from('data_versions').insert({
      user_id: userId,
      dataset_name: datasetName,
      version_number: nextVersion,
      snapshot: snapshot as any,
      row_count: rows.length,
      column_count: columns.length,
      change_summary: changeSummary ?? `Version ${nextVersion}`,
    } as any).select('id').single();

    if (error) {
      toast.error('Failed to save version', { description: error.message });
    } else {
      // Auto-share with all groups the user belongs to
      try {
        const { data: groupRows } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);
        const myGroupIds = (groupRows ?? []).map((g: any) => g.group_id as string);
        if (myGroupIds.length > 0 && inserted) {
          await supabase.from('dataset_group_shares').insert(
            myGroupIds.map((gid) => ({
              dataset_version_id: inserted.id,
              group_id: gid,
              shared_by: userId,
            })),
          );
        }
      } catch (e) {
        console.warn('Auto-share failed:', e);
      }
      toast.success(`Saved as version ${nextVersion}`);
      await fetchVersions(datasetName);
    }
  }, [fetchVersions]);

  const getDatasetShares = useCallback(async (datasetVersionId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('dataset_group_shares')
      .select('group_id')
      .eq('dataset_version_id', datasetVersionId);
    return (data ?? []).map((r: any) => r.group_id as string);
  }, []);

  const setDatasetShares = useCallback(async (datasetVersionId: string, groupIds: string[]) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) throw new Error('Not signed in');

    const { data: existing } = await supabase
      .from('dataset_group_shares')
      .select('group_id')
      .eq('dataset_version_id', datasetVersionId);
    const existingIds = new Set((existing ?? []).map((r: any) => r.group_id as string));
    const target = new Set(groupIds);
    const toAdd = [...target].filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !target.has(id));

    if (toAdd.length > 0) {
      await supabase.from('dataset_group_shares').insert(
        toAdd.map((gid) => ({
          dataset_version_id: datasetVersionId,
          group_id: gid,
          shared_by: userId,
        })),
      );
    }
    if (toRemove.length > 0) {
      await supabase
        .from('dataset_group_shares')
        .delete()
        .eq('dataset_version_id', datasetVersionId)
        .in('group_id', toRemove);
    }
  }, []);

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
