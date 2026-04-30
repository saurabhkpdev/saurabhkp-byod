import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch attached-rule-set counts for a list of template IDs.
 * Returns a map of templateId -> count.
 */
export function useTemplateRuleCounts(templateIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = templateIds.slice().sort().join(',');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (templateIds.length === 0) {
        setCounts({});
        return;
      }
      const { data, error } = await supabase
        .from('template_quality_rules')
        .select('template_id')
        .in('template_id', templateIds);
      if (cancelled || error) return;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.template_id] = (map[r.template_id] ?? 0) + 1;
      });
      setCounts(map);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return counts;
}

/**
 * Fetch attached-rule-set counts for a list of dataset names.
 */
export function useDatasetRuleCounts(datasetNames: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = datasetNames.slice().sort().join(',');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (datasetNames.length === 0) {
        setCounts({});
        return;
      }
      const { data, error } = await supabase
        .from('dataset_quality_rules')
        .select('dataset_name')
        .in('dataset_name', datasetNames);
      if (cancelled || error) return;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.dataset_name] = (map[r.dataset_name] ?? 0) + 1;
      });
      setCounts(map);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return counts;
}
