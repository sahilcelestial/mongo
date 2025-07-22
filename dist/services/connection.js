"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionService = void 0;
const mongodb_1 = require("mongodb");
const logger_1 = __importDefault(require("../utils/logger"));
class ConnectionService {
    constructor() {
        this.sourceClient = null;
        this.targetClient = null;
    }
    /**
     * Connect to source and target MongoDB instances
     */
    async connect(source, target) {
        try {
            // Connect to source
            this.sourceClient = await this.createConnection(source);
            logger_1.default.info(`Connected to source MongoDB (${source.deploymentType})`);
            // Connect to target
            this.targetClient = await this.createConnection(target);
            logger_1.default.info(`Connected to target MongoDB (${target.deploymentType})`);
            return { sourceClient: this.sourceClient, targetClient: this.targetClient };
        }
        catch (error) {
            if (this.sourceClient)
                await this.sourceClient.close();
            if (this.targetClient)
                await this.targetClient.close();
            throw error;
        }
    }
    /**
     * Create a MongoDB connection
     */
    async createConnection(config) {
        const options = {
            serverSelectionTimeoutMS: 5000,
        };
        // Add specific options based on deployment type
        if (config.deploymentType === 'replicaSet' && config.replicaSet) {
            options.replicaSet = config.replicaSet;
        }
        if (config.deploymentType === 'atlas') {
            options.serverApi = {
                version: mongodb_1.ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            };
        }
        const client = new mongodb_1.MongoClient(config.uri, options);
        await client.connect();
        // Test connection
        await client.db('admin').command({ ping: 1 });
        return client;
    }
    /**
     * Close all connections
     */
    async close() {
        if (this.sourceClient) {
            await this.sourceClient.close();
            logger_1.default.info('Closed source MongoDB connection');
        }
        if (this.targetClient) {
            await this.targetClient.close();
            logger_1.default.info('Closed target MongoDB connection');
        }
    }
}
exports.ConnectionService = ConnectionService;
