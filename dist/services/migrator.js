"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigratorService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const events_1 = require("events");
const analyzer_1 = require("./analyzer");
class MigratorService extends events_1.EventEmitter {
    constructor(sourceClient, targetClient, options) {
        super();
        this.stopped = false;
        this.sourceClient = sourceClient;
        this.targetClient = targetClient;
        this.options = options;
        this.analyzer = new analyzer_1.AnalyzerService();
        this.stats = {
            startTime: new Date(),
            totalDatabases: 0,
            totalCollections: 0,
            totalDocuments: 0,
            migratedDocuments: 0,
            failedDocuments: 0,
            errors: []
        };
    }
    /**
     * Start the migration process
     */
    async migrate() {
        try {
            logger_1.default.info('Starting migration process');
            this.stats.startTime = new Date();
            // Analyze source databases
            const databaseStats = await this.analyzer.analyzeDatabases(this.sourceClient, this.options.sourceDatabases);
            this.stats.totalDatabases = databaseStats.length;
            this.stats.totalDocuments = databaseStats.reduce((sum, db) => sum + db.totalDocuments, 0);
            // Count total collections to migrate
            let collectionsToMigrate = 0;
            for (const db of databaseStats) {
                for (const coll of db.collections) {
                    if (this.shouldMigrateCollection(coll.name)) {
                        collectionsToMigrate++;
                    }
                }
            }
            this.stats.totalCollections = collectionsToMigrate;
            logger_1.default.info(`Will migrate ${this.stats.totalDocuments} documents from ${collectionsToMigrate} collections in ${databaseStats.length} databases`);
            // Perform dry run check
            if (this.options.dryRun) {
                logger_1.default.info('Dry run completed. No data was migrated.');
                this.stats.endTime = new Date();
                this.stats.elapsedTimeMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
                return this.stats;
            }
            // Migrate each database
            for (const dbStat of databaseStats) {
                if (this.stopped)
                    break;
                await this.migrateDatabase(dbStat);
            }
            this.stats.endTime = new Date();
            this.stats.elapsedTimeMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
            logger_1.default.info(`Migration completed in ${this.stats.elapsedTimeMs / 1000} seconds`);
            logger_1.default.info(`Migrated ${this.stats.migratedDocuments} of ${this.stats.totalDocuments} documents`);
            if (this.stats.failedDocuments > 0) {
                logger_1.default.warn(`Failed to migrate ${this.stats.failedDocuments} documents`);
            }
            return this.stats;
        }
        catch (error) {
            logger_1.default.error('Migration failed:', error);
            this.stats.errors.push(error);
            this.stats.endTime = new Date();
            this.stats.elapsedTimeMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
            return this.stats;
        }
    }
    /**
     * Stop the migration process
     */
    stop() {
        logger_1.default.info('Stopping migration process...');
        this.stopped = true;
    }
    /**
     * Migrate a single database
     */
    async migrateDatabase(dbStat) {
        const sourceDb = this.sourceClient.db(dbStat.name);
        const targetDbName = this.options.targetDatabase || dbStat.name;
        const targetDb = this.targetClient.db(targetDbName);
        logger_1.default.info(`Migrating database ${dbStat.name} to ${targetDbName}`);
        // Migrate collections
        for (const collStat of dbStat.collections) {
            if (this.stopped)
                break;
            // Skip collections that should not be migrated
            if (!this.shouldMigrateCollection(collStat.name)) {
                logger_1.default.info(`Skipping collection ${collStat.name}`);
                continue;
            }
            await this.migrateCollection(sourceDb, targetDb, collStat.name, collStat.count);
        }
    }
    /**
     * Migrate a single collection
     */
    async migrateCollection(sourceDb, targetDb, collectionName, totalDocuments) {
        logger_1.default.info(`Migrating collection ${sourceDb.databaseName}.${collectionName} to ${targetDb.databaseName}.${collectionName}`);
        const sourceCollection = sourceDb.collection(collectionName);
        const targetCollection = targetDb.collection(collectionName);
        // Create indexes first (important for performance)
        await this.migrateIndexes(sourceCollection, targetCollection);
        // Drop target collection data if requested
        if (this.options.dropTarget) {
            await targetCollection.deleteMany({});
            logger_1.default.info(`Dropped existing data from target collection ${targetDb.databaseName}.${collectionName}`);
        }
        // Migrate documents in batches
        let processedDocuments = 0;
        const batchSize = this.options.batchSize;
        const cursor = sourceCollection.find({}).batchSize(batchSize);
        while (await cursor.hasNext() && !this.stopped) {
            const batch = [];
            // Fetch a batch of documents
            while (await cursor.hasNext() && batch.length < batchSize && !this.stopped) {
                const doc = await cursor.next();
                if (doc !== null) {
                    batch.push(doc);
                }
            }
            if (batch.length === 0)
                break;
            try {
                // Insert batch to target
                if (batch.length === 1) {
                    await targetCollection.insertOne(batch[0]);
                }
                else {
                    await targetCollection.insertMany(batch, { ordered: false });
                }
                processedDocuments += batch.length;
                this.stats.migratedDocuments += batch.length;
                // Emit progress event
                const progress = {
                    database: sourceDb.databaseName,
                    collection: collectionName,
                    totalDocuments,
                    processedDocuments,
                    percentage: Math.round((processedDocuments / totalDocuments) * 100)
                };
                this.emit('progress', progress);
                logger_1.default.debug(`Migrated ${processedDocuments}/${totalDocuments} documents (${progress.percentage}%) from ${sourceDb.databaseName}.${collectionName}`);
            }
            catch (error) {
                logger_1.default.error(`Error migrating batch from ${sourceDb.databaseName}.${collectionName}:`, error);
                this.stats.errors.push(error);
                this.stats.failedDocuments += batch.length;
            }
        }
        logger_1.default.info(`Completed migration of ${processedDocuments} documents from ${sourceDb.databaseName}.${collectionName}`);
    }
    /**
     * Migrate indexes from source to target collection
     */
    async migrateIndexes(sourceCollection, targetCollection) {
        try {
            const indexes = await sourceCollection.indexes();
            // Skip the default _id index which is created automatically
            const indexesToCreate = indexes.filter(index => index.name !== '_id_');
            if (indexesToCreate.length === 0)
                return;
            logger_1.default.info(`Migrating ${indexesToCreate.length} indexes from ${sourceCollection.namespace} to ${targetCollection.namespace}`);
            for (const index of indexesToCreate) {
                const { key, name, ...options } = index;
                try {
                    await targetCollection.createIndex(key, { name, ...options });
                    logger_1.default.debug(`Created index ${name} on ${targetCollection.namespace}`);
                }
                catch (error) {
                    logger_1.default.error(`Failed to create index ${name} on ${targetCollection.namespace}:`, error);
                    this.stats.errors.push(error);
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Error migrating indexes for ${sourceCollection.namespace}:`, error);
            this.stats.errors.push(error);
        }
    }
    /**
     * Check if a collection should be migrated based on options
     */
    shouldMigrateCollection(collectionName) {
        // Skip system collections
        if (collectionName.startsWith('system.')) {
            return false;
        }
        // Include only specific collections if provided
        if (this.options.collections && this.options.collections.length > 0) {
            return this.options.collections.includes(collectionName);
        }
        // Skip specific collections if provided
        if (this.options.skipCollections && this.options.skipCollections.length > 0) {
            return !this.options.skipCollections.includes(collectionName);
        }
        return true;
    }
}
exports.MigratorService = MigratorService;
