import { useState, useEffect } from 'react';

export interface SnowflakeConnection {
  id: string;
  name: string;
  account: string;
  username: string;
  warehouse: string;
  role: string;
  uploadDatabase: string;
  uploadSchema: string;
  updateDatabase: string;
  updateSchema: string;
  isConnected: boolean;
  createdAt: string;
  lastTestedAt?: string;
}

export interface DataSourceConfig {
  platform: 'snowflake' | 'databricks' | 'bigquery';
  connections: SnowflakeConnection[];
  activeConnectionId: string | null;
}

const STORAGE_KEY = 'data-source-config';

const defaultConfig: DataSourceConfig = {
  platform: 'snowflake',
  connections: [],
  activeConnectionId: null,
};

export function useDataSourceStore() {
  const [config, setConfig] = useState<DataSourceConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load data source config:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveConfig = (newConfig: DataSourceConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  const addConnection = (connection: Omit<SnowflakeConnection, 'id' | 'createdAt' | 'isConnected'>) => {
    const newConnection: SnowflakeConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isConnected: false,
    };
    const updated = {
      ...config,
      connections: [...config.connections, newConnection],
    };
    saveConfig(updated);
    return newConnection;
  };

  const updateConnection = (id: string, updates: Partial<SnowflakeConnection>) => {
    const updated = {
      ...config,
      connections: config.connections.map(conn =>
        conn.id === id ? { ...conn, ...updates } : conn
      ),
    };
    saveConfig(updated);
  };

  const deleteConnection = (id: string) => {
    const updated = {
      ...config,
      connections: config.connections.filter(conn => conn.id !== id),
      activeConnectionId: config.activeConnectionId === id ? null : config.activeConnectionId,
    };
    saveConfig(updated);
  };

  const setActiveConnection = (id: string | null) => {
    saveConfig({ ...config, activeConnectionId: id });
  };

  const testConnection = async (id: string): Promise<boolean> => {
    // Simulate connection test - in production this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1500));
    const success = Math.random() > 0.3; // 70% success rate for demo
    
    updateConnection(id, {
      isConnected: success,
      lastTestedAt: new Date().toISOString(),
    });
    
    return success;
  };

  const getActiveConnection = (): SnowflakeConnection | null => {
    if (!config.activeConnectionId) return null;
    return config.connections.find(c => c.id === config.activeConnectionId) || null;
  };

  return {
    config,
    isLoading,
    addConnection,
    updateConnection,
    deleteConnection,
    setActiveConnection,
    testConnection,
    getActiveConnection,
  };
}
