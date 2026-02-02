import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  
  // Data details
  fileName: string;
  rowCount: number;
  columnCount: number;
  
  // For uploads - store the actual data to be committed
  data?: {
    columns: DataColumn[];
    rows: DataRow[];
  };
  
  // For manipulations - store what changed
  changes?: {
    description: string;
    affectedRows: number;
    changeType: 'cell_edit' | 'bulk_replace' | 'bulk_transform' | 'formula_column' | 'pii_tag';
  };
  
  // Additional metadata
  metadata?: Record<string, unknown>;
}

interface ApprovalState {
  requests: ApprovalRequest[];
  
  // Submit for approval
  submitForApproval: (request: Omit<ApprovalRequest, 'id' | 'status' | 'submittedAt'>) => string;
  
  // Approve/reject
  approveRequest: (id: string, reviewedBy: string) => boolean;
  rejectRequest: (id: string, reviewedBy: string, reason: string) => boolean;
  
  // Get pending requests
  getPendingRequests: () => ApprovalRequest[];
  getRequestsByStatus: (status: ApprovalStatus) => ApprovalRequest[];
  getRequestById: (id: string) => ApprovalRequest | undefined;
  
  // Delete a request
  deleteRequest: (id: string) => boolean;
  
  // Clear all requests
  clearAllRequests: () => void;
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      requests: [],

      submitForApproval: (request) => {
        const id = crypto.randomUUID();
        const newRequest: ApprovalRequest = {
          ...request,
          id,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          requests: [...state.requests, newRequest],
        }));
        
        return id;
      },

      approveRequest: (id, reviewedBy) => {
        const request = get().requests.find((r) => r.id === id);
        if (!request || request.status !== 'pending') return false;
        
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'approved' as ApprovalStatus,
                  reviewedBy,
                  reviewedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
        
        return true;
      },

      rejectRequest: (id, reviewedBy, reason) => {
        const request = get().requests.find((r) => r.id === id);
        if (!request || request.status !== 'pending') return false;
        
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'rejected' as ApprovalStatus,
                  reviewedBy,
                  reviewedAt: new Date().toISOString(),
                  rejectionReason: reason,
                }
              : r
          ),
        }));
        
        return true;
      },

      getPendingRequests: () => {
        return get().requests.filter((r) => r.status === 'pending');
      },

      getRequestsByStatus: (status) => {
        return get().requests.filter((r) => r.status === status);
      },

      getRequestById: (id) => {
        return get().requests.find((r) => r.id === id);
      },

      deleteRequest: (id) => {
        const request = get().requests.find((r) => r.id === id);
        if (!request) return false;
        
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        }));
        
        return true;
      },

      clearAllRequests: () => {
        set({ requests: [] });
      },
    }),
    {
      name: 'approval-storage',
    }
  )
);
