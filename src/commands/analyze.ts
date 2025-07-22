import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ConnectionService } from '../services/connection';
import { AnalyzerService } from '../services/analyzer';
import { loadConfig } from '../utils/config';
import logger from '../utils/logger';
import fs from 'fs-extra';
import path from 'path';

export function createAnalyzeCommand(): Command {
  const analyze = new Command('analyze')
    .description('Analyze source MongoDB structure')
    .option('-s, --source-dbs <databases>', 'Comma-separated list of source databases to analyze')
    .option('-o, --output <file>', 'Output file for analysis results (JSON format)')
    .action(async (cmdOptions) => {
      const spinner = ora('Starting analysis').start();
      
      try {
        // Load configuration
        const { source } = loadConfig();
        
        // Get databases to analyze
        let sourceDatabases: string[] | undefined;
        if (cmdOptions.sourceDbs) {
          sourceDatabases = cmdOptions.sourceDbs.split(',');
        }
        
        spinner.text = 'Connecting to source MongoDB';
        
        // Connect to source
        const connectionService = new ConnectionService();
        const { sourceClient } = await connectionService.connect(source, source); // Reuse source config for target
        
        spinner.text = 'Analyzing databases';
        
        // Analyze databases
        const analyzer = new AnalyzerService();
        const databaseStats = await analyzer.analyzeDatabases(sourceClient, sourceDatabases);
        
        // Close connection
        await connectionService.close();
        
        // Output results
        if (cmdOptions.output) {
          const outputPath = path.resolve(cmdOptions.output);
          await fs.writeJson(outputPath, databaseStats, { spaces: 2 });
          spinner.succeed(`Analysis completed and saved to ${outputPath}`);
        } else {
          spinner.succeed('Analysis completed');
          
          // Print summary to console
          console.log('\n' + chalk.blue('Database Analysis Summary:'));
          databaseStats.forEach(db => {
            console.log(`\n${chalk.bold(db.name)} (${db.totalDocuments.toLocaleString()} documents, ${(db.totalSize / 1024 / 1024).toFixed(2)} MB)`);
            console.log(chalk.dim('Collections:'));
            
            // Sort collections by size (descending)
            const sortedCollections = [...db.collections].sort((a, b) => b.size - a.size);
            
            sortedCollections.forEach(coll => {
              const sizeMB = (coll.size / 1024 / 1024).toFixed(2);
              console.log(`  ${coll.name}: ${coll.count.toLocaleString()} docs, ${sizeMB} MB, ${coll.indexes.length} indexes`);
            });
          });
        }
        
        logger.info('Analysis command completed');
      } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red('Error:'), error);
        logger.error('Analysis command failed:', error);
        process.exit(1);
      }
    });
    
  return analyze;
}