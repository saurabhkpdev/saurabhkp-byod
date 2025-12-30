import { useState, useEffect, useCallback } from 'react';

export type AuditAction = 
  | 'page_view'
  | 'data_upload'
  | 'data_edit'
  | 'pii_tagged'
  | 'pii_untagged'
  | 'validation_run'
  | 'data_processed'
  | 'dataset_selected'
  | 'map_feature_created'
  | 'map_feature_deleted'
  | 'coordinates_updated';

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: AuditAction;
  details: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'datalens-audit-log';
const MAX_EVENTS = 500;

const getStoredEvents = (): AuditEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
};

const saveEvents = (events: AuditEvent[]) => {
  try {
    // Keep only the most recent events
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
};

export const useAuditLog = () => {
  const [events, setEvents] = useState<AuditEvent[]>(getStoredEvents);

  // Reload events when component mounts (for admin page)
  useEffect(() => {
    setEvents(getStoredEvents());
  }, []);

  const logEvent = useCallback((
    action: AuditAction,
    details: string,
    page?: string,
    metadata?: Record<string, unknown>
  ) => {
    const newEvent: AuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      page,
      metadata
    };

    setEvents((prev) => {
      const updated = [...prev, newEvent];
      saveEvents(updated);
      return updated;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getEventsByAction = useCallback((action: AuditAction) => {
    return events.filter(e => e.action === action);
  }, [events]);

  const getEventsByDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.timestamp.startsWith(dateStr));
  }, [events]);

  const getStats = useCallback(() => {
    const actionCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    
    events.forEach(event => {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
      if (event.page) {
        pageCounts[event.page] = (pageCounts[event.page] || 0) + 1;
      }
    });

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.timestamp.startsWith(today));

    return {
      totalEvents: events.length,
      todayEvents: todayEvents.length,
      actionCounts,
      pageCounts
    };
  }, [events]);

  return {
    events,
    logEvent,
    clearLogs,
    getEventsByAction,
    getEventsByDate,
    getStats
  };
};

// Action labels for display
export const actionLabels: Record<AuditAction, string> = {
  page_view: 'Page View',
  data_upload: 'Data Upload',
  data_edit: 'Data Edit',
  pii_tagged: 'PII Tagged',
  pii_untagged: 'PII Untagged',
  validation_run: 'Validation Run',
  data_processed: 'Data Processed',
  dataset_selected: 'Dataset Selected',
  map_feature_created: 'Map Feature Created',
  map_feature_deleted: 'Map Feature Deleted',
  coordinates_updated: 'Coordinates Updated'
};

// Action colors for badges
export const actionColors: Record<AuditAction, string> = {
  page_view: 'bg-blue-500/10 text-blue-600',
  data_upload: 'bg-green-500/10 text-green-600',
  data_edit: 'bg-yellow-500/10 text-yellow-600',
  pii_tagged: 'bg-red-500/10 text-red-600',
  pii_untagged: 'bg-orange-500/10 text-orange-600',
  validation_run: 'bg-purple-500/10 text-purple-600',
  data_processed: 'bg-emerald-500/10 text-emerald-600',
  dataset_selected: 'bg-cyan-500/10 text-cyan-600',
  map_feature_created: 'bg-indigo-500/10 text-indigo-600',
  map_feature_deleted: 'bg-pink-500/10 text-pink-600',
  coordinates_updated: 'bg-teal-500/10 text-teal-600'
};
