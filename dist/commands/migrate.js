"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMigrateCommand = createMigrateCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const connection_1 = require("../services/connection");
const analyzer_1 = require("../services/analyzer");
const migrator_1 = require("../services/migrator");
const config_1 = require("../utils/config");
const logger_1 = __importDefault(require("../utils/logger"));
function createMigrateCommand() {
    const migrate = new commander_1.Command('migrate')
        .description('Migrate data from source to target MongoDB')
        .option('-s, --source-dbs <databases>', 'Comma-separated list of source databases to migrate')
        .option('-t, --target-db <database>', 'Target database name (defaults to source database name)')
        .option('-c, --collections <collections>', 'Comma-separated list of collections to migrate')
        .option('-k, --skip-collections <collections>', 'Comma-separated list of collections to skip')
        .option('--drop-target', 'Drop data in target collections before migration')
        .option('-b, --batch-size <size>', 'Number of documents to migrate in each batch', '1000')
        .option('--concurrency <number>', 'Number of parallel operations', '5')
        .option('--timeout <milliseconds>', 'Operation timeout in milliseconds', '30000')
        .option('--dry-run', 'Analyze source and target but do not migrate data')
        .action(async (cmdOptions) => {
        const spinner = (0, ora_1.default)('Starting migration').start();
        try {
            // Load configuration
            const { source, target, options } = (0, config_1.loadConfig)();
            // Override options with command line arguments
            if (cmdOptions.sourceDbs) {
                options.sourceDatabases = cmdOptions.sourceDbs.split(',');
            }
            if (cmdOptions.targetDb) {
                options.targetDatabase = cmdOptions.targetDb;
            }
            if (cmdOptions.collections) {
                options.collections = cmdOptions.collections.split(',');
            }
            if (cmdOptions.skipCollections) {
                options.skipCollections = cmdOptions.skipCollections.split(',');
            }
            if (cmdOptions.dropTarget) {
                options.dropTarget = true;
            }
            if (cmdOptions.batchSize) {
                options.batchSize = parseInt(cmdOptions.batchSize);
            }
            if (cmdOptions.concurrency) {
                options.concurrency = parseInt(cmdOptions.concurrency);
            }
            if (cmdOptions.timeout) {
                options.timeoutMs = parseInt(cmdOptions.timeout);
            }
            if (cmdOptions.dryRun) {
                options.dryRun = true;
            }
            spinner.text = 'Connecting to MongoDB servers';
            // Connect to source and target
            const connectionService = new connection_1.ConnectionService();
            const { sourceClient, targetClient } = await connectionService.connect(source, target);
            spinner.text = 'Validating compatibility';
            // Validate compatibility
            const analyzer = new analyzer_1.AnalyzerService();
            const { compatible, issues } = await analyzer.validateCompatibility(sourceClient, targetClient);
            if (!compatible) {
                spinner.warn('Compatibility issues detected:');
                issues.forEach(issue => console.log(`- ${chalk_1.default.yellow(issue)}`));
                if (!cmdOptions.dryRun) {
                    spinner.warn('Continuing with migration despite compatibility issues. Use --dry-run to analyze without migrating.');
                }
            }
            spinner.text = 'Analyzing source databases';
            // Start migration
            const migrator = new migrator_1.MigratorService(sourceClient, targetClient, options);
            // Listen for progress updates
            migrator.on('progress', (progress) => {
                spinner.text = `Migrating ${progress.database}.${progress.collection}: ${progress.processedDocuments}/${progress.totalDocuments} docs (${progress.percentage}%)`;
            });
            // Perform migration
            const stats = await migrator.migrate();
            // Close connections
            await connectionService.close();
            if (stats.errors.length > 0) {
                spinner.warn('Migration completed with errors');
                console.log(`\n${chalk_1.default.yellow('Errors encountered:')}`);
                stats.errors.slice(0, 5).forEach((error, i) => {
                    console.log(`${i + 1}. ${chalk_1.default.red(error.message)}`);
                });
                if (stats.errors.length > 5) {
                    console.log(`...and ${stats.errors.length - 5} more errors. See logs for details.`);
                }
            }
            else if (options.dryRun) {
                spinner.succeed('Dry run completed successfully');
            }
            else {
                spinner.succeed('Migration completed successfully');
            }
            // Display summary
            console.log('\n' + chalk_1.default.blue('Migration Summary:'));
            console.log(`Duration: ${Math.round((stats.elapsedTimeMs || 0) / 1000)} seconds`);
            console.log(`Databases: ${stats.totalDatabases}`);
            console.log(`Collections: ${stats.totalCollections}`);
            console.log(`Documents: ${stats.migratedDocuments}/${stats.totalDocuments} migrated`);
            if (stats.failedDocuments > 0) {
                console.log(`${chalk_1.default.red(stats.failedDocuments)} documents failed to migrate`);
            }
            logger_1.default.info('Migration command completed');
        }
        catch (error) {
            spinner.fail('Migration failed');
            console.error(chalk_1.default.red('Error:'), error);
            logger_1.default.error('Migration command failed:', error);
            process.exit(1);
        }
    });
    return migrate;
}
