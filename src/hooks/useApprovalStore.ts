import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { DataColumn, DataRow } from '@/types/data';

export type ApprovalType = 'data_upload' | 'data_manipulation';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;

  fileName: string;
  rowCount: number;
  columnCount: number;

  data?: {
    columns: DataColumn[];
    rows: DataRow[];
  };

  changes?: {
    description: string;
    affectedRows: number;
    changeType: 'cell_edit' | 'bulk_replace' | 'bulk_transform' | 'formula_column' | 'pii_tag';
  };

  metadata?: Record<string, unknown>;
}

interface ApprovalState {
  requests: ApprovalRequest[];
  loading: boolean;
  initialized: boolean;

  fetchRequests: () => Promise<void>;
  submitForApproval: (
    request: Omit<ApprovalRequest, 'id' | 'status' | 'submittedAt' | 'submittedBy'>,
  ) => Promise<string | null>;
  approveRequest: (id: string, reviewedBy: string) => Promise<boolean>;
  rejectRequest: (id: string, reviewedBy: string, reason: string) => Promise<boolean>;
  deleteRequest: (id: string) => Promise<boolean>;
  clearAllRequests: () => Promise<void>;

  getPendingRequests: () => ApprovalRequest[];
  getRequestsByStatus: (status: ApprovalStatus) => ApprovalRequest[];
  getRequestById: (id: string) => ApprovalRequest | undefined;
}

function rowToRequest(r: any): ApprovalRequest {
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    submittedBy: r.submitted_by,
    submittedAt: r.submitted_at,
    reviewedBy: r.reviewed_by ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    fileName: r.file_name,
    rowCount: r.row_count,
    columnCount: r.column_count,
    data: r.data ?? undefined,
    changes: r.changes ?? undefined,
    metadata: r.metadata ?? undefined,
  };
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  requests: [],
  loading: false,
  initialized: false,

  fetchRequests: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch approval requests', error);
      set({ loading: false, initialized: true });
      return;
    }
    set({
      requests: (data ?? []).map(rowToRequest),
      loading: false,
      initialized: true,
    });
  },

  submitForApproval: async (request) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) {
      console.error('Cannot submit approval: not signed in');
      return null;
    }
    const insertRow = {
      type: request.type,
      status: 'pending' as ApprovalStatus,
      submitted_by: userId,
      file_name: request.fileName,
      row_count: request.rowCount,
      column_count: request.columnCount,
      data: (request.data ?? null) as any,
      changes: (request.changes ?? null) as any,
      metadata: (request.metadata ?? null) as any,
    };
    const { data, error } = await supabase
      .from('approval_requests')
      .insert(insertRow)
      .select('*')
      .single();
    if (error || !data) {
      console.error('Failed to submit approval', error);
      return null;
    }
    const newReq = rowToRequest(data);
    set((s) => ({ requests: [newReq, ...s.requests] }));
    return newReq.id;
  },

  approveRequest: async (id, reviewedBy) => {
    const { data, error } = await supabase
      .from('approval_requests')
      .update({
        status: 'approved',
        reviewed_by: (await supabase.auth.getSession()).data.session?.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();
    if (error || !data) return false;
    const updated = rowToRequest(data);
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...updated, reviewedBy } : r)) }));
    return true;
  },

  rejectRequest: async (id, reviewedBy, reason) => {
    const { data, error } = await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        reviewed_by: (await supabase.auth.getSession()).data.session?.user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();
    if (error || !data) return false;
    const updated = rowToRequest(data);
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...updated, reviewedBy } : r)) }));
    return true;
  },

  deleteRequest: async (id) => {
    const { error } = await supabase.from('approval_requests').delete().eq('id', id);
    if (error) return false;
    set((s) => ({ requests: s.requests.filter((r) => r.id !== id) }));
    return true;
  },

  clearAllRequests: async () => {
    const ids = get().requests.map((r) => r.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from('approval_requests').delete().in('id', ids);
    if (error) {
      console.error('Failed to clear approval requests', error);
      return;
    }
    set({ requests: [] });
  },

  getPendingRequests: () => get().requests.filter((r) => r.status === 'pending'),
  getRequestsByStatus: (status) => get().requests.filter((r) => r.status === status),
  getRequestById: (id) => get().requests.find((r) => r.id === id),
}));
