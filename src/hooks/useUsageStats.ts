import { useState, useEffect, useCallback } from 'react';

interface UsageStats {
  totalVisits: number;
  lastVisit: string | null;
  totalUploads: number;
}

const STORAGE_KEY = 'datalens-usage-stats';

const getStoredStats = (): UsageStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { totalVisits: 0, lastVisit: null, totalUploads: 0 };
};

const saveStats = (stats: UsageStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
};

export const useUsageStats = () => {
  const [stats, setStats] = useState<UsageStats>(getStoredStats);

  // Record visit on mount
  useEffect(() => {
    const currentStats = getStoredStats();
    const newStats: UsageStats = {
      ...currentStats,
      totalVisits: currentStats.totalVisits + 1,
      lastVisit: new Date().toISOString(),
    };
    saveStats(newStats);
    setStats(newStats);
  }, []);

  const recordUpload = useCallback(() => {
    setStats((prev) => {
      const newStats = {
        ...prev,
        totalUploads: prev.totalUploads + 1,
      };
      saveStats(newStats);
      return newStats;
    });
  }, []);

  const getLastVisitFormatted = useCallback(() => {
    if (!stats.lastVisit) return 'First visit';
    
    const lastVisit = new Date(stats.lastVisit);
    const now = new Date();
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastVisit.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [stats.lastVisit]);

  return {
    totalVisits: stats.totalVisits,
    totalUploads: stats.totalUploads,
    lastVisit: stats.lastVisit,
    getLastVisitFormatted,
    recordUpload,
  };
};
