import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TriggerEvent = 'upload_success' | 'manipulation_complete' | 'approval_granted';

export type ActionType = 'webhook' | 'airflow_dag' | 'snowflake_task' | 'email';

export interface ActionConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: ActionType;
  triggerEvents: TriggerEvent[];
  config: WebhookConfig | AirflowConfig | SnowflakeConfig | EmailConfig;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  authType?: 'none' | 'bearer' | 'basic' | 'api_key';
  authValue?: string;
  payloadTemplate?: string;
}

export interface AirflowConfig {
  baseUrl: string;
  dagId: string;
  authToken?: string;
  conf?: Record<string, unknown>;
}

export interface SnowflakeConfig {
  taskName: string;
  warehouse?: string;
  database?: string;
  schema?: string;
}

export interface EmailConfig {
  recipients: string[];
  subject: string;
  bodyTemplate?: string;
}

export const triggerEventLabels: Record<TriggerEvent, string> = {
  upload_success: 'Successful Upload',
  manipulation_complete: 'Data Manipulation Complete',
  approval_granted: 'Approval Granted',
};

export const actionTypeLabels: Record<ActionType, string> = {
  webhook: 'Webhook',
  airflow_dag: 'Airflow DAG',
  snowflake_task: 'Snowflake Task',
  email: 'Email Notification',
};

interface ActionsState {
  actions: ActionConfig[];
  addAction: (action: Omit<ActionConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAction: (id: string, updates: Partial<ActionConfig>) => void;
  deleteAction: (id: string) => void;
  toggleAction: (id: string) => void;
  getActionsByEvent: (event: TriggerEvent) => ActionConfig[];
}

export const useActionsStore = create<ActionsState>()(
  persist(
    (set, get) => ({
      actions: [],

      addAction: (action) => {
        const newAction: ActionConfig = {
          ...action,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ actions: [...state.actions, newAction] }));
      },

      updateAction: (id, updates) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id
              ? { ...action, ...updates, updatedAt: new Date().toISOString() }
              : action
          ),
        }));
      },

      deleteAction: (id) => {
        set((state) => ({
          actions: state.actions.filter((action) => action.id !== id),
        }));
      },

      toggleAction: (id) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id
              ? { ...action, enabled: !action.enabled, updatedAt: new Date().toISOString() }
              : action
          ),
        }));
      },

      getActionsByEvent: (event) => {
        return get().actions.filter(
          (action) => action.enabled && action.triggerEvents.includes(event)
        );
      },
    }),
    {
      name: 'byod-actions-store',
    }
  )
);
