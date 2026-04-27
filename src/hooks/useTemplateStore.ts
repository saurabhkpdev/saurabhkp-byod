import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CustomTemplate {
  id: string;                       // backend uuid
  name: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
  sampleData: Record<string, unknown>[];
  category: 'general' | 'geographical';
  createdAt: string;
  updatedAt: string;
  isCustom: true;
  ownerId: string;
  sharedGroupIds?: string[];        // hydrated separately
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

const LOCAL_TEMPLATES_KEY = 'byod-custom-templates';
const LOCAL_OVERRIDES_KEY = 'byod-system-template-overrides';
const MIGRATION_FLAG_PREFIX = 'byod-templates-migrated:';

interface TemplateStoreState {
  customTemplates: CustomTemplate[];
  systemOverrides: Record<string, SystemTemplateOverride>;
  isLoading: boolean;
  isHydrated: boolean;
  refresh: () => Promise<void>;
}

const useStore = create<TemplateStoreState>(() => ({
  customTemplates: [],
  systemOverrides: {},
  isLoading: true,
  isHydrated: false,
  refresh: async () => {},
}));

function rowToTemplate(row: any, shareIds: string[] = []): CustomTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    requiredColumns: row.required_columns ?? [],
    optionalColumns: row.optional_columns ?? [],
    sampleData: (row.sample_data as Record<string, unknown>[]) ?? [],
    category: (row.category as 'general' | 'geographical') ?? 'general',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isCustom: true,
    ownerId: row.owner_id,
    sharedGroupIds: shareIds,
  };
}

async function fetchAll(userId: string) {
  const [tplRes, ovrRes] = await Promise.all([
    supabase.from('custom_templates').select('*').order('updated_at', { ascending: false }),
    supabase.from('system_template_overrides').select('*'),
  ]);

  if (tplRes.error) throw tplRes.error;
  if (ovrRes.error) throw ovrRes.error;

  const templateRows = tplRes.data ?? [];
  const ids = templateRows.map((r: any) => r.id);
  let shareMap: Record<string, string[]> = {};
  if (ids.length > 0) {
    const { data: shares } = await supabase
      .from('template_group_shares')
      .select('template_id, group_id')
      .in('template_id', ids);
    (shares ?? []).forEach((s: any) => {
      shareMap[s.template_id] = shareMap[s.template_id] ?? [];
      shareMap[s.template_id].push(s.group_id);
    });
  }

  const customTemplates = templateRows.map((r: any) => rowToTemplate(r, shareMap[r.id] ?? []));

  const overrides: Record<string, SystemTemplateOverride> = {};
  (ovrRes.data ?? []).forEach((o: any) => {
    overrides[o.system_template_id] = {
      name: o.name ?? undefined,
      description: o.description ?? undefined,
      requiredColumns: o.required_columns ?? undefined,
      optionalColumns: o.optional_columns ?? undefined,
      sampleData: (o.sample_data as Record<string, unknown>[]) ?? undefined,
      category: (o.category as 'general' | 'geographical') ?? undefined,
      updatedAt: o.updated_at,
    };
  });

  return { customTemplates, overrides };
}

async function migrateLocalIfNeeded(userId: string) {
  const flagKey = `${MIGRATION_FLAG_PREFIX}${userId}`;
  if (localStorage.getItem(flagKey)) return;

  try {
    // Migrate custom templates
    const localTplRaw = localStorage.getItem(LOCAL_TEMPLATES_KEY);
    if (localTplRaw) {
      const localTpls = JSON.parse(localTplRaw) as Array<any>;
      if (Array.isArray(localTpls) && localTpls.length > 0) {
        // Get user's groups so we can auto-share
        const { data: groupRows } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);
        const userGroupIds = (groupRows ?? []).map((g: any) => g.group_id as string);

        for (const t of localTpls) {
          // Skip if already migrated (by client_id)
          const { data: existing } = await supabase
            .from('custom_templates')
            .select('id')
            .eq('owner_id', userId)
            .eq('client_id', t.id)
            .maybeSingle();
          if (existing) continue;

          const { data: inserted, error: insErr } = await supabase
            .from('custom_templates')
            .insert({
              owner_id: userId,
              name: t.name ?? 'Untitled',
              description: t.description ?? '',
              category: t.category === 'geographical' ? 'geographical' : 'general',
              required_columns: t.requiredColumns ?? [],
              optional_columns: t.optionalColumns ?? [],
              sample_data: t.sampleData ?? [],
              client_id: t.id,
            })
            .select('id')
            .single();

          if (!insErr && inserted && userGroupIds.length > 0) {
            await supabase.from('template_group_shares').insert(
              userGroupIds.map((gid) => ({
                template_id: inserted.id,
                group_id: gid,
                shared_by: userId,
              })),
            );
          }
        }
      }
    }

    // Migrate system overrides only if user is admin (will be enforced by RLS anyway)
    const localOvrRaw = localStorage.getItem(LOCAL_OVERRIDES_KEY);
    if (localOvrRaw) {
      const localOvr = JSON.parse(localOvrRaw) as Record<string, any>;
      for (const [sysId, override] of Object.entries(localOvr)) {
        // Upsert by system_template_id
        const { data: existing } = await supabase
          .from('system_template_overrides')
          .select('id')
          .eq('system_template_id', sysId)
          .maybeSingle();
        if (existing) continue;

        await supabase.from('system_template_overrides').insert({
          system_template_id: sysId,
          name: override.name ?? null,
          description: override.description ?? null,
          category: override.category ?? null,
          required_columns: override.requiredColumns ?? null,
          optional_columns: override.optionalColumns ?? null,
          sample_data: override.sampleData ?? null,
          updated_by: userId,
        });
      }
    }

    localStorage.setItem(flagKey, new Date().toISOString());
  } catch (e) {
    // Non-fatal — keep local data, will retry next session
    console.warn('Local template migration failed:', e);
  }
}

async function getMyGroupIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  return (data ?? []).map((g: any) => g.group_id as string);
}

export function useTemplateStore() {
  const currentUser = useAuth((s) => s.currentUser);
  const { customTemplates, systemOverrides, isLoading } = useStore();
  const [, force] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    (async () => {
      useStore.setState({ isLoading: true });
      await migrateLocalIfNeeded(currentUser.id);
      try {
        const { customTemplates, overrides } = await fetchAll(currentUser.id);
        if (!cancelled) {
          useStore.setState({
            customTemplates,
            systemOverrides: overrides,
            isLoading: false,
            isHydrated: true,
            refresh: async () => {
              const r = await fetchAll(currentUser.id);
              useStore.setState({ customTemplates: r.customTemplates, systemOverrides: r.overrides });
            },
          });
        }
      } catch (e) {
        console.error('Failed to load templates:', e);
        if (!cancelled) useStore.setState({ isLoading: false, isHydrated: true });
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const refresh = useStore((s) => s.refresh);

  const addTemplate = useCallback(async (
    template: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isCustom' | 'ownerId' | 'sharedGroupIds'>
  ): Promise<CustomTemplate> => {
    if (!currentUser) throw new Error('Not signed in');
    const { data, error } = await supabase
      .from('custom_templates')
      .insert({
        owner_id: currentUser.id,
        name: template.name,
        description: template.description,
        category: template.category,
        required_columns: template.requiredColumns,
        optional_columns: template.optionalColumns,
        sample_data: template.sampleData,
      })
      .select('*')
      .single();
    if (error) throw error;

    // Auto-share with all my groups
    const myGroupIds = await getMyGroupIds(currentUser.id);
    if (myGroupIds.length > 0) {
      await supabase.from('template_group_shares').insert(
        myGroupIds.map((gid) => ({
          template_id: data.id,
          group_id: gid,
          shared_by: currentUser.id,
        })),
      );
    }

    await refresh();
    force((n) => n + 1);
    return rowToTemplate(data, myGroupIds);
  }, [currentUser, refresh]);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<Omit<CustomTemplate, 'id' | 'createdAt' | 'isCustom' | 'ownerId' | 'sharedGroupIds'>>
  ): Promise<CustomTemplate | null> => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.requiredColumns !== undefined) payload.required_columns = updates.requiredColumns;
    if (updates.optionalColumns !== undefined) payload.optional_columns = updates.optionalColumns;
    if (updates.sampleData !== undefined) payload.sample_data = updates.sampleData;

    const { data, error } = await supabase
      .from('custom_templates')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    await refresh();
    force((n) => n + 1);
    return rowToTemplate(data);
  }, [refresh]);

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('custom_templates').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
    await refresh();
    force((n) => n + 1);
    return true;
  }, [refresh]);

  const getTemplate = useCallback((id: string): CustomTemplate | undefined => {
    return useStore.getState().customTemplates.find((t) => t.id === id);
  }, []);

  const updateSystemTemplate = useCallback(async (
    systemTemplateId: string,
    updates: Omit<SystemTemplateOverride, 'updatedAt'>
  ) => {
    if (!currentUser) throw new Error('Not signed in');
    const payload = {
      system_template_id: systemTemplateId,
      name: updates.name ?? null,
      description: updates.description ?? null,
      category: updates.category ?? null,
      required_columns: updates.requiredColumns ?? null,
      optional_columns: updates.optionalColumns ?? null,
      sample_data: updates.sampleData ?? null,
      updated_by: currentUser.id,
    };
    const { error } = await supabase
      .from('system_template_overrides')
      .upsert(payload, { onConflict: 'system_template_id' });
    if (error) throw error;
    await refresh();
    force((n) => n + 1);
  }, [currentUser, refresh]);

  const resetSystemTemplate = useCallback(async (systemTemplateId: string) => {
    const { error } = await supabase
      .from('system_template_overrides')
      .delete()
      .eq('system_template_id', systemTemplateId);
    if (error) throw error;
    await refresh();
    force((n) => n + 1);
  }, [refresh]);

  const getSystemOverride = useCallback((systemTemplateId: string): SystemTemplateOverride | undefined => {
    return useStore.getState().systemOverrides[systemTemplateId];
  }, []);

  // Sharing helpers
  const setTemplateGroupShares = useCallback(async (templateId: string, groupIds: string[]) => {
    if (!currentUser) throw new Error('Not signed in');
    const { data: existing } = await supabase
      .from('template_group_shares')
      .select('group_id')
      .eq('template_id', templateId);
    const existingIds = new Set((existing ?? []).map((r: any) => r.group_id as string));
    const target = new Set(groupIds);
    const toAdd = [...target].filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !target.has(id));

    if (toAdd.length > 0) {
      await supabase.from('template_group_shares').insert(
        toAdd.map((gid) => ({ template_id: templateId, group_id: gid, shared_by: currentUser.id })),
      );
    }
    if (toRemove.length > 0) {
      await supabase
        .from('template_group_shares')
        .delete()
        .eq('template_id', templateId)
        .in('group_id', toRemove);
    }
    await refresh();
    force((n) => n + 1);
  }, [currentUser, refresh]);

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
    setTemplateGroupShares,
    refresh,
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
        const values = sampleValues[col.type];
        row[col.name] = values[(rowIndex + colIndex) % values.length];
      }
    });

    return row;
  });
}
