import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { MongoDBConnectionConfig, MigrationOptions } from '../types';

// Load environment variables
dotenv.config();

export function loadConfig(): {
  source: MongoDBConnectionConfig;
  target: MongoDBConnectionConfig;
  options: MigrationOptions;
} {
  // Source MongoDB config
  const source: MongoDBConnectionConfig = {
    uri: process.env.SOURCE_MONGODB_URI || '',
    deploymentType: (process.env.SOURCE_DEPLOYMENT_TYPE || 'standalone') as any,
    replicaSet: process.env.SOURCE_REPLICA_SET,
    apiKey: process.env.SOURCE_API_KEY
  };

  // Target MongoDB config
  const target: MongoDBConnectionConfig = {
    uri: process.env.TARGET_MONGODB_URI || '',
    deploymentType: (process.env.TARGET_DEPLOYMENT_TYPE || 'standalone') as any,
    replicaSet: process.env.TARGET_REPLICA_SET,
    apiKey: process.env.TARGET_API_KEY,
    projectId: process.env.TARGET_PROJECT_ID
  };

  // Migration options
  const options: MigrationOptions = {
    batchSize: parseInt(process.env.BATCH_SIZE || '1000'),
    concurrency: parseInt(process.env.CONCURRENCY || '5'),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000'),
    dryRun: false
  };

  return { source, target, options };
}

export function saveConfig(
  source: MongoDBConnectionConfig,
  target: MongoDBConnectionConfig,
  options: MigrationOptions
): void {
  const envContent = [
    '# Source MongoDB Connection',
    `SOURCE_MONGODB_URI=${source.uri}`,
    `SOURCE_DEPLOYMENT_TYPE=${source.deploymentType}`,
    source.replicaSet ? `SOURCE_REPLICA_SET=${source.replicaSet}` : '# SOURCE_REPLICA_SET=',
    source.apiKey ? `SOURCE_API_KEY=${source.apiKey}` : '# SOURCE_API_KEY=',
    '',
    '# Target MongoDB Connection',
    `TARGET_MONGODB_URI=${target.uri}`,
    `TARGET_DEPLOYMENT_TYPE=${target.deploymentType}`,
    target.replicaSet ? `TARGET_REPLICA_SET=${target.replicaSet}` : '# TARGET_REPLICA_SET=',
    target.apiKey ? `TARGET_API_KEY=${target.apiKey}` : '# TARGET_API_KEY=',
    target.projectId ? `TARGET_PROJECT_ID=${target.projectId}` : '# TARGET_PROJECT_ID=',
    '',
    '# Migration Settings',
    `BATCH_SIZE=${options.batchSize}`,
    `CONCURRENCY=${options.concurrency}`,
    `TIMEOUT_MS=${options.timeoutMs}`,
    `LOG_LEVEL=info`
  ].join('\n');

  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
}