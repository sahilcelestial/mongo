import axios from 'axios';
import { 
  MongoDBConnectionConfig, 
  MigrationOptions, 
  DatabaseStats,
  MigrationStats
} from '../types';

// Base API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Service for MongoDB Migration Tool
 */
class ApiService {
  /**
   * Test a MongoDB connection
   */
  async testConnection(config: MongoDBConnectionConfig): Promise<boolean> {
    try {
      const response = await apiClient.post('/connection/test', config);
      return response.data.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Save migration configuration
   */
  async saveConfig(
    source: MongoDBConnectionConfig,
    target: MongoDBConnectionConfig,
    options: MigrationOptions
  ): Promise<boolean> {
    try {
      const response = await apiClient.post('/config', { source, target, options });
      return response.data.success;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  /**
   * Load migration configuration
   */
  async loadConfig(): Promise<{
    source: MongoDBConnectionConfig;
    target: MongoDBConnectionConfig;
    options: MigrationOptions;
  } | null> {
    try {
      const response = await apiClient.get('/config');
      return response.data;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  /**
   * Analyze source database
   */
  async analyzeDatabases(
    source: MongoDBConnectionConfig,
    databases?: string[]
  ): Promise<DatabaseStats[]> {
    try {
      const response = await apiClient.post('/analyze', { source, databases });
      return response.data.databases;
    } catch (error) {
      console.error('Database analysis failed:', error);
      return [];
    }
  }

  /**
   * Start a migration
   */
  async startMigration(
    source: MongoDBConnectionConfig,
    target: MongoDBConnectionConfig,
    options: MigrationOptions
  ): Promise<string> {
    try {
      const response = await apiClient.post('/migrate/start', {
        source,
        target,
        options,
      });
      return response.data.migrationId;
    } catch (error) {
      console.error('Failed to start migration:', error);
      throw new Error('Failed to start migration');
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrationId: string): Promise<MigrationStats> {
    try {
      const response = await apiClient.get(`/migrate/status/${migrationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get migration status:', error);
      throw new Error('Failed to get migration status');
    }
  }

  /**
   * Stop a migration
   */
  async stopMigration(migrationId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/migrate/stop/${migrationId}`);
      return response.data.success;
    } catch (error) {
      console.error('Failed to stop migration:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();