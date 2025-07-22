"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
function loadConfig() {
    // Source MongoDB config
    const source = {
        uri: process.env.SOURCE_MONGODB_URI || '',
        deploymentType: (process.env.SOURCE_DEPLOYMENT_TYPE || 'standalone'),
        replicaSet: process.env.SOURCE_REPLICA_SET,
        apiKey: process.env.SOURCE_API_KEY
    };
    // Target MongoDB config
    const target = {
        uri: process.env.TARGET_MONGODB_URI || '',
        deploymentType: (process.env.TARGET_DEPLOYMENT_TYPE || 'standalone'),
        replicaSet: process.env.TARGET_REPLICA_SET,
        apiKey: process.env.TARGET_API_KEY,
        projectId: process.env.TARGET_PROJECT_ID
    };
    // Migration options
    const options = {
        batchSize: parseInt(process.env.BATCH_SIZE || '1000'),
        concurrency: parseInt(process.env.CONCURRENCY || '5'),
        timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000'),
        dryRun: false
    };
    return { source, target, options };
}
function saveConfig(source, target, options) {
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
    fs_extra_1.default.writeFileSync(path_1.default.join(process.cwd(), '.env'), envContent);
}
