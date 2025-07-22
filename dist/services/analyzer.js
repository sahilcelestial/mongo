"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class AnalyzerService {
    /**
     * Analyze source database(s) structure
     */
    async analyzeDatabases(client, databaseNames) {
        try {
            // Get all database names if not specified
            let databasesToAnalyze = databaseNames || [];
            if (!databasesToAnalyze.length) {
                const adminDb = client.db('admin');
                const { databases } = await adminDb.command({ listDatabases: 1 });
                databasesToAnalyze = databases
                    .map((db) => db.name)
                    .filter((name) => !['admin', 'local', 'config'].includes(name));
            }
            logger_1.default.info(`Analyzing ${databasesToAnalyze.length} database(s): ${databasesToAnalyze.join(', ')}`);
            // Analyze each database
            const databaseStats = [];
            for (const dbName of databasesToAnalyze) {
                const db = client.db(dbName);
                const collections = await db.listCollections().toArray();
                const collectionStats = [];
                let totalSize = 0;
                let totalDocuments = 0;
                for (const collection of collections) {
                    const collName = collection.name;
                    const coll = db.collection(collName);
                    // Get collection stats
                    const count = await coll.countDocuments();
                    const stats = await db.command({ collStats: collName });
                    const indexes = await coll.indexes();
                    collectionStats.push({
                        name: collName,
                        count,
                        size: stats.size,
                        indexes
                    });
                    totalSize += stats.size;
                    totalDocuments += count;
                    logger_1.default.debug(`Analyzed collection ${dbName}.${collName}: ${count} documents, ${stats.size} bytes`);
                }
                databaseStats.push({
                    name: dbName,
                    collections: collectionStats,
                    totalSize,
                    totalDocuments
                });
                logger_1.default.info(`Database ${dbName}: ${collections.length} collections, ${totalDocuments} documents, ${totalSize} bytes`);
            }
            return databaseStats;
        }
        catch (error) {
            logger_1.default.error('Error analyzing databases:', error);
            throw error;
        }
    }
    /**
     * Validate compatibility between source and target MongoDB
     */
    async validateCompatibility(sourceClient, targetClient) {
        const issues = [];
        try {
            // Check MongoDB versions
            const sourceInfo = await sourceClient.db('admin').command({ buildInfo: 1 });
            const targetInfo = await targetClient.db('admin').command({ buildInfo: 1 });
            const sourceVersion = sourceInfo.versionArray;
            const targetVersion = targetInfo.versionArray;
            logger_1.default.info(`Source MongoDB version: ${sourceInfo.version}`);
            logger_1.default.info(`Target MongoDB version: ${targetInfo.version}`);
            // Major version difference check
            if (targetVersion[0] < sourceVersion[0]) {
                issues.push(`Target MongoDB version (${targetInfo.version}) is older than source (${sourceInfo.version}). This may cause compatibility issues.`);
            }
            // Minor version difference check - just a warning
            if (targetVersion[0] === sourceVersion[0] && targetVersion[1] < sourceVersion[1]) {
                logger_1.default.warn(`Target MongoDB minor version (${targetInfo.version}) is older than source (${sourceInfo.version}).`);
            }
            // Check storage engines
            if (sourceInfo.storageEngines && targetInfo.storageEngines) {
                const sourceEngine = await sourceClient.db('admin').command({ serverStatus: 1 }).then(status => status.storageEngine.name);
                const targetEngine = await targetClient.db('admin').command({ serverStatus: 1 }).then(status => status.storageEngine.name);
                if (sourceEngine !== targetEngine) {
                    issues.push(`Different storage engines detected: source uses ${sourceEngine}, target uses ${targetEngine}. Some features may not be compatible.`);
                }
            }
            return {
                compatible: issues.length === 0,
                issues
            };
        }
        catch (error) {
            logger_1.default.error('Error validating compatibility:', error);
            issues.push(`Error validating compatibility: ${error}`);
            return {
                compatible: false,
                issues
            };
        }
    }
}
exports.AnalyzerService = AnalyzerService;
