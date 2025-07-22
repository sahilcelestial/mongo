import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ConnectionService } from '../services/connection';
import { AnalyzerService } from '../services/analyzer';
import { MigratorService } from '../services/migrator';
import { loadConfig } from '../utils/config';
import logger from '../utils/logger';
import { MigrationProgress } from '../types';

export function createMigrateCommand(): Command {
  const migrate = new Command('migrate')
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
      const spinner = ora('Starting migration').start();
      
      try {
        // Load configuration
        const { source, target, options } = loadConfig();
        
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
        const connectionService = new ConnectionService();
        const { sourceClient, targetClient } = await connectionService.connect(source, target);
        
        spinner.text = 'Validating compatibility';
        
        // Validate compatibility
        const analyzer = new AnalyzerService();
        const { compatible, issues } = await analyzer.validateCompatibility(sourceClient, targetClient);
        
        if (!compatible) {
          spinner.warn('Compatibility issues detected:');
          issues.forEach(issue => console.log(`- ${chalk.yellow(issue)}`));
          
          if (!cmdOptions.dryRun) {
            spinner.warn('Continuing with migration despite compatibility issues. Use --dry-run to analyze without migrating.');
          }
        }
        
        spinner.text = 'Analyzing source databases';
        
        // Start migration
        const migrator = new MigratorService(sourceClient, targetClient, options);
        
        // Listen for progress updates
        migrator.on('progress', (progress: MigrationProgress) => {
          spinner.text = `Migrating ${progress.database}.${progress.collection}: ${progress.processedDocuments}/${progress.totalDocuments} docs (${progress.percentage}%)`;
        });
        
        // Perform migration
        const stats = await migrator.migrate();
        
        // Close connections
        await connectionService.close();
        
        if (stats.errors.length > 0) {
          spinner.warn('Migration completed with errors');
          console.log(`\n${chalk.yellow('Errors encountered:')}`);
          stats.errors.slice(0, 5).forEach((error, i) => {
            console.log(`${i + 1}. ${chalk.red(error.message)}`);
          });
          
          if (stats.errors.length > 5) {
            console.log(`...and ${stats.errors.length - 5} more errors. See logs for details.`);
          }
        } else if (options.dryRun) {
          spinner.succeed('Dry run completed successfully');
        } else {
          spinner.succeed('Migration completed successfully');
        }
        
        // Display summary
        console.log('\n' + chalk.blue('Migration Summary:'));
        console.log(`Duration: ${Math.round((stats.elapsedTimeMs || 0) / 1000)} seconds`);
        console.log(`Databases: ${stats.totalDatabases}`);
        console.log(`Collections: ${stats.totalCollections}`);
        console.log(`Documents: ${stats.migratedDocuments}/${stats.totalDocuments} migrated`);
        
        if (stats.failedDocuments > 0) {
          console.log(`${chalk.red(stats.failedDocuments)} documents failed to migrate`);
        }
        
        logger.info('Migration command completed');
      } catch (error) {
        spinner.fail('Migration failed');
        console.error(chalk.red('Error:'), error);
        logger.error('Migration command failed:', error);
        process.exit(1);
      }
    });
    
  return migrate;
}