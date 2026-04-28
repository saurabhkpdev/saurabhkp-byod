import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QualityRule } from '@/lib/qualityRules';

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  scope: 'template' | 'dataset' | 'global';
  scope_key: string | null;
  rules: QualityRule[];
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Inventory of all quality rule sets. Admin-only mutations enforced by RLS.
 */
export function useQualityRules() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuleSets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quality_rule_sets')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      toast.error('Failed to load quality rules');
      setRuleSets([]);
    } else {
      setRuleSets((data ?? []).map((r: any) => ({ ...r, rules: (r.rules ?? []) as QualityRule[] })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRuleSets(); }, [fetchRuleSets]);

  const saveRuleSet = useCallback(async (
    input: { id?: string; name: string; description: string; rules: QualityRule[] },
  ) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) { toast.error('You must be signed in'); return null; }
    const payload = {
      name: input.name,
      description: input.description,
      scope: 'global' as const,
      scope_key: null,
      rules: input.rules as any,
      owner_id: userId,
    };
    if (input.id) {
      const { error } = await supabase.from('quality_rule_sets').update(payload).eq('id', input.id);
      if (error) { toast.error(error.message); return null; }
      toast.success('Rule set updated');
    } else {
      const { error } = await supabase.from('quality_rule_sets').insert(payload);
      if (error) { toast.error(error.message); return null; }
      toast.success('Rule set created');
    }
    await fetchRuleSets();
    return true;
  }, [fetchRuleSets]);

  const deleteRuleSet = useCallback(async (id: string) => {
    const { error } = await supabase.from('quality_rule_sets').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Rule set deleted');
    await fetchRuleSets();
  }, [fetchRuleSets]);

  return { ruleSets, loading, fetchRuleSets, saveRuleSet, deleteRuleSet };
}

// ---------- Attachments ----------

export async function getTemplateRuleAttachments(templateId: string): Promise<string[]> {
  const { data, error } = await supabase.from('template_quality_rules').select('rule_set_id').eq('template_id', templateId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.rule_set_id);
}

export async function getDatasetRuleAttachments(datasetName: string): Promise<string[]> {
  const { data, error } = await supabase.from('dataset_quality_rules').select('rule_set_id').eq('dataset_name', datasetName);
  if (error) return [];
  return (data ?? []).map((r: any) => r.rule_set_id);
}

export async function setTemplateRuleAttachments(templateId: string, ruleSetIds: string[]) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) { toast.error('You must be signed in'); return false; }

  const current = await getTemplateRuleAttachments(templateId);
  const toAdd = ruleSetIds.filter((id) => !current.includes(id));
  const toRemove = current.filter((id) => !ruleSetIds.includes(id));

  if (toRemove.length > 0) {
    const { error } = await supabase.from('template_quality_rules').delete()
      .eq('template_id', templateId).in('rule_set_id', toRemove);
    if (error) { toast.error(error.message); return false; }
  }
  if (toAdd.length > 0) {
    const rows = toAdd.map((id) => ({ template_id: templateId, rule_set_id: id, attached_by: userId }));
    const { error } = await supabase.from('template_quality_rules').insert(rows);
    if (error) { toast.error(error.message); return false; }
  }
  return true;
}

export async function setDatasetRuleAttachments(datasetName: string, ruleSetIds: string[]) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) { toast.error('You must be signed in'); return false; }

  const current = await getDatasetRuleAttachments(datasetName);
  const toAdd = ruleSetIds.filter((id) => !current.includes(id));
  const toRemove = current.filter((id) => !ruleSetIds.includes(id));

  if (toRemove.length > 0) {
    const { error } = await supabase.from('dataset_quality_rules').delete()
      .eq('dataset_name', datasetName).in('rule_set_id', toRemove);
    if (error) { toast.error(error.message); return false; }
  }
  if (toAdd.length > 0) {
    const rows = toAdd.map((id) => ({ dataset_name: datasetName, rule_set_id: id, attached_by: userId }));
    const { error } = await supabase.from('dataset_quality_rules').insert(rows);
    if (error) { toast.error(error.message); return false; }
  }
  return true;
}

/**
 * Resolve all rule sets that should run for a given (templateId, datasetName) pair.
 * Returns the union of attached rule sets, deduped.
 */
export async function fetchAttachedRuleSets(opts: { templateId?: string | null; datasetName?: string | null }): Promise<RuleSet[]> {
  const ids = new Set<string>();
  if (opts.templateId) {
    (await getTemplateRuleAttachments(opts.templateId)).forEach((id) => ids.add(id));
  }
  if (opts.datasetName) {
    (await getDatasetRuleAttachments(opts.datasetName)).forEach((id) => ids.add(id));
  }
  if (ids.size === 0) return [];
  const { data, error } = await supabase
    .from('quality_rule_sets').select('*').in('id', [...ids]);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ ...r, rules: (r.rules ?? []) as QualityRule[] }));
}
