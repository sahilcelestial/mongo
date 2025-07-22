import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { MongoClient } from 'mongodb';
import { MongoDBConnectionConfig, DatabaseStats, CollectionStats } from '../models/types';

/**
 * Analyze a MongoDB database
 */
export async function analyzeDatabase(req: Request, res: Response) {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { source, databases } = req.body;
  const sourceConfig: MongoDBConnectionConfig = source;
  let client: MongoClient | null = null;

  try {
    // Connect to MongoDB
    client = new MongoClient(sourceConfig.uri);
    await client.connect();
    
    // Get database list
    const dbList = databases && databases.length > 0
      ? databases
      : (await client.db().admin().listDatabases()).databases.map((db: any) => db.name)
          .filter((name: string) => !['admin', 'local', 'config'].includes(name));
    
    const results: DatabaseStats[] = [];
    
    // Analyze each database
    for (const dbName of dbList) {
      const db = client.db(dbName);
      const collectionNames = await db.listCollections().toArray();
      
      const collectionStats: CollectionStats[] = [];
      let totalSize = 0;
      let totalDocuments = 0;
      
      // Analyze each collection in the database
      for (const collInfo of collectionNames) {
        const collName = collInfo.name;
        const coll = db.collection(collName);
        
        // Get collection stats
        const stats = await db.command({ collStats: collName });
        const count = await coll.countDocuments();
        const indexes = await coll.indexes();
        
        const collStat: CollectionStats = {
          name: collName,
          count: count,
          size: stats.size || 0,
          indexes: indexes
        };
        
        collectionStats.push(collStat);
        totalSize += stats.size || 0;
        totalDocuments += count;
      }
      
      results.push({
        name: dbName,
        collections: collectionStats,
        totalSize,
        totalDocuments
      });
    }
    
    return res.status(200).json({
      databases: results
    });
  } catch (error) {
    console.error('Database analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error analyzing database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}