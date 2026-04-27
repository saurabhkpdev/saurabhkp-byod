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

interface FetchOpts {
  scope?: 'template' | 'dataset' | 'global';
  scopeKey?: string | null;
}

export function useQualityRules(opts: FetchOpts = {}) {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuleSets = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('quality_rule_sets').select('*').order('updated_at', { ascending: false });
    if (opts.scope) q = q.eq('scope', opts.scope);
    if (opts.scopeKey !== undefined && opts.scopeKey !== null) q = q.eq('scope_key', opts.scopeKey);
    const { data, error } = await q;
    if (error) {
      toast.error('Failed to load quality rules');
      setRuleSets([]);
    } else {
      setRuleSets((data ?? []).map((r: any) => ({ ...r, rules: (r.rules ?? []) as QualityRule[] })));
    }
    setLoading(false);
  }, [opts.scope, opts.scopeKey]);

  useEffect(() => { fetchRuleSets(); }, [fetchRuleSets]);

  const saveRuleSet = useCallback(async (
    input: Omit<RuleSet, 'id' | 'owner_id' | 'created_at' | 'updated_at'> & { id?: string },
  ) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) {
      toast.error('You must be signed in');
      return null;
    }
    const payload = {
      name: input.name,
      description: input.description,
      scope: input.scope,
      scope_key: input.scope_key,
      rules: input.rules as any,
      owner_id: userId,
    };
    if (input.id) {
      const { error } = await supabase.from('quality_rule_sets').update(payload).eq('id', input.id);
      if (error) { toast.error('Failed to save rule set'); return null; }
      toast.success('Rule set updated');
    } else {
      const { error } = await supabase.from('quality_rule_sets').insert(payload);
      if (error) { toast.error('Failed to create rule set'); return null; }
      toast.success('Rule set created');
    }
    await fetchRuleSets();
    return true;
  }, [fetchRuleSets]);

  const deleteRuleSet = useCallback(async (id: string) => {
    const { error } = await supabase.from('quality_rule_sets').delete().eq('id', id);
    if (error) { toast.error('Failed to delete rule set'); return; }
    toast.success('Rule set deleted');
    await fetchRuleSets();
  }, [fetchRuleSets]);

  return { ruleSets, loading, fetchRuleSets, saveRuleSet, deleteRuleSet };
}
