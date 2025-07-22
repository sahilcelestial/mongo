export type MongoDBDeploymentType = 'standalone' | 'replicaSet' | 'sharded' | 'atlas';

export interface MongoDBConnectionConfig {
  uri: string;
  deploymentType: MongoDBDeploymentType;
  replicaSet?: string;
  apiKey?: string;
  projectId?: string;
}

export interface MigrationOptions {
  sourceDatabases?: string[];
  targetDatabase?: string;
  collections?: string[];
  skipCollections?: string[];
  dropTarget: boolean;
  batchSize: number;
  concurrency: number;
  timeoutMs: number;
  dryRun: boolean;
}

export interface CollectionStats {
  name: string;
  count: number;
  size: number;
  indexes: any[];
}

export interface DatabaseStats {
  name: string;
  collections: CollectionStats[];
  totalSize: number;
  totalDocuments: number;
}

export interface MigrationStats {
  migrationId?: string;
  startTime: Date;
  endTime?: Date;
  totalDatabases: number;
  totalCollections: number;
  totalDocuments: number;
  migratedDocuments: number;
  failedDocuments: number;
  errors: string[];
  elapsedTimeMs?: number;
  status?: 'running' | 'completed' | 'failed' | 'stopped';
}

export interface MigrationProgress {
  database: string;
  collection: string;
  totalDocuments: number;
  processedDocuments: number;
  percentage: number;
}