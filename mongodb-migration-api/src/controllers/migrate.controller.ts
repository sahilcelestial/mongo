import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MongoClient } from 'mongodb';
import { 
  MongoDBConnectionConfig, 
  MigrationOptions, 
  MigrationStats, 
  MigrationProgress 
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for active migrations
const activeMigrations = new Map<string, {
  stats: MigrationStats,
  progress: MigrationProgress,
  cancel: boolean
}>();

/**
 * Start a new migration
 */
export async function startMigration(req: Request, res: Response) {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { source, target, options } = req.body;
  const sourceConfig: MongoDBConnectionConfig = source;
  const targetConfig: MongoDBConnectionConfig = target;
  const migrationOptions: MigrationOptions = options;

  // Generate migration ID
  const migrationId = uuidv4();
  
  // Initialize migration stats
  const stats: MigrationStats = {
    migrationId,
    startTime: new Date(),
    totalDatabases: 0,
    totalCollections: 0,
    totalDocuments: 0,
    migratedDocuments: 0,
    failedDocuments: 0,
    errors: [],
    status: 'running'
  };
  
  // Initialize progress
  const progress: MigrationProgress = {
    database: '',
    collection: '',
    totalDocuments: 0,
    processedDocuments: 0,
    percentage: 0
  };
  
  // Store migration in memory
  activeMigrations.set(migrationId, {
    stats,
    progress,
    cancel: false
  });
  
  // Start migration in background
  processMigration(migrationId, sourceConfig, targetConfig, migrationOptions)
    .catch(error => {
      console.error('Migration error:', error);
      const migration = activeMigrations.get(migrationId);
      if (migration) {
        migration.stats.status = 'failed';
        migration.stats.errors.push(error.message);
        migration.stats.endTime = new Date();
        migration.stats.elapsedTimeMs = migration.stats.endTime.getTime() - migration.stats.startTime.getTime();
      }
    });
  
  return res.status(200).json({
    success: true,
    migrationId,
    message: 'Migration started'
  });
}

/**
 * Get migration status
 */
export async function getMigrationStatus(req: Request, res: Response) {
  const { migrationId } = req.params;
  
  const migration = activeMigrations.get(migrationId);
  if (!migration) {
    return res.status(404).json({
      success: false,
      message: 'Migration not found'
    });
  }
  
  return res.status(200).json({
    ...migration.stats,
    progress: migration.progress
  });
}

/**
 * Stop migration
 */
export async function stopMigration(req: Request, res: Response) {
  const { migrationId } = req.params;
  
  const migration = activeMigrations.get(migrationId);
  if (!migration) {
    return res.status(404).json({
      success: false,
      message: 'Migration not found'
    });
  }
  
  // Set cancel flag
  migration.cancel = true;
  
  return res.status(200).json({
    success: true,
    message: 'Migration stop requested'
  });
}

/**
 * Process migration in background
 */
async function processMigration(
  migrationId: string, 
  sourceConfig: MongoDBConnectionConfig, 
  targetConfig: MongoDBConnectionConfig,
  options: MigrationOptions
) {
  let sourceClient: MongoClient | null = null;
  let targetClient: MongoClient | null = null;
  
  try {
    // Get migration object
    const migration = activeMigrations.get(migrationId);
    if (!migration) {
      throw new Error('Migration not found');
    }
    
    // Connect to source and target
    sourceClient = new MongoClient(sourceConfig.uri);
    targetClient = new MongoClient(targetConfig.uri);
    
    await sourceClient.connect();
    await targetClient.connect();
    
    // Get database list
    const dbList = options.sourceDatabases && options.sourceDatabases.length > 0
      ? options.sourceDatabases
      : (await sourceClient.db().admin().listDatabases()).databases
          .map((db: any) => db.name)
          .filter((name: string) => !['admin', 'local', 'config'].includes(name));
    
    // Update stats with database count
    migration.stats.totalDatabases = dbList.length;
    
    // Process each database
    for (const dbName of dbList) {
      if (migration.cancel) {
        migration.stats.status = 'stopped';
        migration.stats.endTime = new Date();
        migration.stats.elapsedTimeMs = migration.stats.endTime.getTime() - migration.stats.startTime.getTime();
        break;
      }
      
      const sourceDb = sourceClient.db(dbName);
      
      // Determine target database name
      const targetDbName = options.targetDatabase || dbName;
      const targetDb = targetClient.db(targetDbName);
      
      // Get collection list
      let collectionNames = (await sourceDb.listCollections().toArray()).map(c => c.name);
      
      // Filter collections if specified
      if (options.collections && options.collections.length > 0) {
        collectionNames = collectionNames.filter(name => options.collections!.includes(name));
      }
      
      // Skip collections if specified
      if (options.skipCollections && options.skipCollections.length > 0) {
        collectionNames = collectionNames.filter(name => !options.skipCollections!.includes(name));
      }
      
      // Update stats with collection count
      migration.stats.totalCollections += collectionNames.length;
      
      // Process each collection
      for (const collName of collectionNames) {
        if (migration.cancel) {
          migration.stats.status = 'stopped';
          migration.stats.endTime = new Date();
          migration.stats.elapsedTimeMs = migration.stats.endTime.getTime() - migration.stats.startTime.getTime();
          break;
        }
        
        const sourceColl = sourceDb.collection(collName);
        const targetColl = targetDb.collection(collName);
        
        // Update progress
        migration.progress.database = dbName;
        migration.progress.collection = collName;
        
        // Drop target collection if specified
        if (options.dropTarget && !options.dryRun) {
          try {
            await targetColl.drop();
          } catch (error) {
            // Collection might not exist, ignore error
          }
        }
        
        // Copy indexes if not dry run
        if (!options.dryRun) {
          const indexes = await sourceColl.indexes();
          
          for (const index of indexes) {
            // Skip _id index as it's created automatically
            if (index.name === '_id_') continue;
            
            try {
              const indexSpec = { ...index };
              delete indexSpec.ns;
              delete indexSpec.v;
              delete indexSpec.key;
              
              await targetColl.createIndex(index.key, indexSpec);
            } catch (error) {
              migration.stats.errors.push(`Failed to create index ${index.name} on ${collName}: ${error}`);
            }
          }
        }
        
        // Count documents
        const totalDocs = await sourceColl.countDocuments();
        migration.stats.totalDocuments += totalDocs;
        migration.progress.totalDocuments = totalDocs;
        
        // Skip actual migration in dry run
        if (options.dryRun) {
          continue;
        }
        
        // Process documents in batches
        const batchSize = options.batchSize || 1000;
        let processed = 0;
        
        while (processed < totalDocs) {
          if (migration.cancel) {
            migration.stats.status = 'stopped';
            migration.stats.endTime = new Date();
            migration.stats.elapsedTimeMs = migration.stats.endTime.getTime() - migration.stats.startTime.getTime();
            break;
          }
          
          const cursor = sourceColl.find().skip(processed).limit(batchSize);
          const batch = await cursor.toArray();
          
          if (batch.length === 0) break;
          
          try {
            // Insert batch
            if (batch.length > 0) {
              await targetColl.insertMany(batch, { ordered: false });
            }
            
            // Update counters
            processed += batch.length;
            migration.stats.migratedDocuments += batch.length;
            migration.progress.processedDocuments = processed;
            migration.progress.percentage = (processed / totalDocs) * 100;
          } catch (error) {
            // Some documents might have failed, but others succeeded
            // Calculate actual number of migrated documents
            const failedCount = batch.length - (error.result?.insertedCount || 0);
            migration.stats.failedDocuments += failedCount;
            migration.stats.migratedDocuments += batch.length - failedCount;
            processed += batch.length;
            migration.progress.processedDocuments = processed;
            migration.progress.percentage = (processed / totalDocs) * 100;
            
            migration.stats.errors.push(`Failed to insert ${failedCount} documents in ${collName}: ${error.message}`);
          }
        }
      }
    }
    
    // Mark migration as completed if not stopped or failed
    if (migration.stats.status === 'running') {
      migration.stats.status = 'completed';
    }
    
    migration.stats.endTime = new Date();
    migration.stats.elapsedTimeMs = migration.stats.endTime.getTime() - migration.stats.startTime.getTime();
  } catch (error) {
    const migration = activeMigrations.get(migrationId);
    if (migration) {
      migration.stats.status = 'failed';
      migration.stats.errors.push(`Migration failed: ${error.message}`);
      migration.stats.endTime = new Date();
      migration.stats.elapsedTimeMs = migration.stats.endTime.getTime() - migration.stats.startTime.getTime();
    }
    
    throw error;
  } finally {
    // Close connections
    if (sourceClient) {
      await sourceClient.close();
    }
    
    if (targetClient) {
      await targetClient.close();
    }
  }
}