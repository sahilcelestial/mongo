import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';
import { MongoDBConnectionConfig } from '../types';
import logger from '../utils/logger';

export class ConnectionService {
  private sourceClient: MongoClient | null = null;
  private targetClient: MongoClient | null = null;

  /**
   * Connect to source and target MongoDB instances
   */
  async connect(source: MongoDBConnectionConfig, target: MongoDBConnectionConfig): Promise<{ sourceClient: MongoClient, targetClient: MongoClient }> {
    try {
      // Connect to source
      this.sourceClient = await this.createConnection(source);
      logger.info(`Connected to source MongoDB (${source.deploymentType})`);

      // Connect to target
      this.targetClient = await this.createConnection(target);
      logger.info(`Connected to target MongoDB (${target.deploymentType})`);

      return { sourceClient: this.sourceClient, targetClient: this.targetClient };
    } catch (error) {
      if (this.sourceClient) await this.sourceClient.close();
      if (this.targetClient) await this.targetClient.close();
      throw error;
    }
  }

  /**
   * Create a MongoDB connection
   */
  private async createConnection(config: MongoDBConnectionConfig): Promise<MongoClient> {
    const options: MongoClientOptions = {
      serverSelectionTimeoutMS: 5000,
    };

    // Add specific options based on deployment type
    if (config.deploymentType === 'replicaSet' && config.replicaSet) {
      options.replicaSet = config.replicaSet;
    }
    
    if (config.deploymentType === 'atlas') {
      options.serverApi = {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      };
    }

    const client = new MongoClient(config.uri, options);
    await client.connect();
    
    // Test connection
    await client.db('admin').command({ ping: 1 });
    
    return client;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.sourceClient) {
      await this.sourceClient.close();
      logger.info('Closed source MongoDB connection');
    }
    
    if (this.targetClient) {
      await this.targetClient.close();
      logger.info('Closed target MongoDB connection');
    }
  }
}