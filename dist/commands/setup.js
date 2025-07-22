"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSetupCommand = createSetupCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const readline = __importStar(require("readline"));
const config_1 = require("../utils/config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
function createSetupCommand() {
    const setup = new commander_1.Command('setup')
        .description('Interactive setup for MongoDB migration configuration')
        .action(async () => {
        console.log(chalk_1.default.blue('MongoDB Migration Tool - Interactive Setup\n'));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const question = (prompt) => {
            return new Promise(resolve => {
                rl.question(prompt, resolve);
            });
        };
        try {
            // Check for existing .env file
            const envPath = path_1.default.join(process.cwd(), '.env');
            if (fs_extra_1.default.existsSync(envPath)) {
                const overwrite = await question(chalk_1.default.yellow('An existing configuration file was found. Overwrite? (y/N): '));
                if (overwrite.toLowerCase() !== 'y') {
                    console.log(chalk_1.default.green('Setup canceled. Existing configuration preserved.'));
                    rl.close();
                    return;
                }
            }
            // Source configuration
            console.log(chalk_1.default.bold('\nSource MongoDB Configuration:'));
            const sourceUri = await question('Source MongoDB URI (mongodb://username:password@hostname:port/database): ');
            console.log('\nSource Deployment Type:');
            console.log('  1. Standalone MongoDB');
            console.log('  2. Replica Set');
            console.log('  3. Sharded Cluster');
            console.log('  4. MongoDB Atlas');
            const sourceTypeChoice = await question('Choose deployment type (1-4): ');
            let sourceType = 'standalone';
            let sourceReplicaSet = '';
            let sourceApiKey = '';
            switch (sourceTypeChoice) {
                case '2':
                    sourceType = 'replicaSet';
                    sourceReplicaSet = await question('Replica Set name: ');
                    break;
                case '3':
                    sourceType = 'sharded';
                    break;
                case '4':
                    sourceType = 'atlas';
                    sourceApiKey = await question('Atlas API Key (optional): ');
                    break;
            }
            // Target configuration
            console.log(chalk_1.default.bold('\nTarget MongoDB Configuration:'));
            const targetUri = await question('Target MongoDB URI (mongodb://username:password@hostname:port/database): ');
            console.log('\nTarget Deployment Type:');
            console.log('  1. Standalone MongoDB');
            console.log('  2. Replica Set');
            console.log('  3. Sharded Cluster');
            console.log('  4. MongoDB Atlas');
            const targetTypeChoice = await question('Choose deployment type (1-4): ');
            let targetType = 'standalone';
            let targetReplicaSet = '';
            let targetApiKey = '';
            let targetProjectId = '';
            switch (targetTypeChoice) {
                case '2':
                    targetType = 'replicaSet';
                    targetReplicaSet = await question('Replica Set name: ');
                    break;
                case '3':
                    targetType = 'sharded';
                    break;
                case '4':
                    targetType = 'atlas';
                    targetApiKey = await question('Atlas API Key (optional): ');
                    targetProjectId = await question('Atlas Project ID (optional): ');
                    break;
            }
            // Migration options
            console.log(chalk_1.default.bold('\nMigration Options:'));
            const batchSizeStr = await question('Batch size (documents per batch, default 1000): ');
            const batchSize = batchSizeStr ? parseInt(batchSizeStr) : 1000;
            const concurrencyStr = await question('Concurrency level (parallel operations, default 5): ');
            const concurrency = concurrencyStr ? parseInt(concurrencyStr) : 5;
            const timeoutStr = await question('Operation timeout in ms (default 30000): ');
            const timeout = timeoutStr ? parseInt(timeoutStr) : 30000;
            rl.close();
            // Create configuration objects
            const sourceConfig = {
                uri: sourceUri,
                deploymentType: sourceType,
                replicaSet: sourceReplicaSet || undefined,
                apiKey: sourceApiKey || undefined
            };
            const targetConfig = {
                uri: targetUri,
                deploymentType: targetType,
                replicaSet: targetReplicaSet || undefined,
                apiKey: targetApiKey || undefined,
                projectId: targetProjectId || undefined
            };
            const options = {
                batchSize,
                concurrency,
                timeoutMs: timeout,
                dryRun: false
            };
            // Save configuration
            (0, config_1.saveConfig)(sourceConfig, targetConfig, options);
            console.log(chalk_1.default.green('\nConfiguration saved successfully!'));
            console.log(`Configuration file: ${envPath}`);
            console.log('\nYou can now run:');
            console.log(chalk_1.default.blue('  npm run analyze') + ' - To analyze source databases');
            console.log(chalk_1.default.blue('  npm run migrate') + ' - To start the migration process');
        }
        catch (error) {
            console.error(chalk_1.default.red('\nError during setup:'), error);
            rl.close();
            process.exit(1);
        }
    });
    return setup;
}
