import { Command } from 'commander';
import chalk from 'chalk';
import * as readline from 'readline';
import { MongoDBConnectionConfig, MongoDBDeploymentType, MigrationOptions } from '../types';
import { saveConfig } from '../utils/config';
import fs from 'fs-extra';
import path from 'path';

export function createSetupCommand(): Command {
  const setup = new Command('setup')
    .description('Interactive setup for MongoDB migration configuration')
    .action(async () => {
      console.log(chalk.blue('MongoDB Migration Tool - Interactive Setup\n'));
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const question = (prompt: string): Promise<string> => {
        return new Promise(resolve => {
          rl.question(prompt, resolve);
        });
      };
      
      try {
        // Check for existing .env file
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const overwrite = await question(chalk.yellow('An existing configuration file was found. Overwrite? (y/N): '));
          if (overwrite.toLowerCase() !== 'y') {
            console.log(chalk.green('Setup canceled. Existing configuration preserved.'));
            rl.close();
            return;
          }
        }
        
        // Source configuration
        console.log(chalk.bold('\nSource MongoDB Configuration:'));
        const sourceUri = await question('Source MongoDB URI (mongodb://username:password@hostname:port/database): ');
        
        console.log('\nSource Deployment Type:');
        console.log('  1. Standalone MongoDB');
        console.log('  2. Replica Set');
        console.log('  3. Sharded Cluster');
        console.log('  4. MongoDB Atlas');
        const sourceTypeChoice = await question('Choose deployment type (1-4): ');
        
        let sourceType: MongoDBDeploymentType = 'standalone';
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
        console.log(chalk.bold('\nTarget MongoDB Configuration:'));
        const targetUri = await question('Target MongoDB URI (mongodb://username:password@hostname:port/database): ');
        
        console.log('\nTarget Deployment Type:');
        console.log('  1. Standalone MongoDB');
        console.log('  2. Replica Set');
        console.log('  3. Sharded Cluster');
        console.log('  4. MongoDB Atlas');
        const targetTypeChoice = await question('Choose deployment type (1-4): ');
        
        let targetType: MongoDBDeploymentType = 'standalone';
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
        console.log(chalk.bold('\nMigration Options:'));
        const batchSizeStr = await question('Batch size (documents per batch, default 1000): ');
        const batchSize = batchSizeStr ? parseInt(batchSizeStr) : 1000;
        
        const concurrencyStr = await question('Concurrency level (parallel operations, default 5): ');
        const concurrency = concurrencyStr ? parseInt(concurrencyStr) : 5;
        
        const timeoutStr = await question('Operation timeout in ms (default 30000): ');
        const timeout = timeoutStr ? parseInt(timeoutStr) : 30000;
        
        rl.close();
        
        // Create configuration objects
        const sourceConfig: MongoDBConnectionConfig = {
          uri: sourceUri,
          deploymentType: sourceType,
          replicaSet: sourceReplicaSet || undefined,
          apiKey: sourceApiKey || undefined
        };
        
        const targetConfig: MongoDBConnectionConfig = {
          uri: targetUri,
          deploymentType: targetType,
          replicaSet: targetReplicaSet || undefined,
          apiKey: targetApiKey || undefined,
          projectId: targetProjectId || undefined
        };
        
        const options: MigrationOptions = {
          batchSize,
          concurrency,
          timeoutMs: timeout,
          dryRun: false
        };
        
        // Save configuration
        saveConfig(sourceConfig, targetConfig, options);
        
        console.log(chalk.green('\nConfiguration saved successfully!'));
        console.log(`Configuration file: ${envPath}`);
        console.log('\nYou can now run:');
        console.log(chalk.blue('  npm run analyze') + ' - To analyze source databases');
        console.log(chalk.blue('  npm run migrate') + ' - To start the migration process');
      } catch (error) {
        console.error(chalk.red('\nError during setup:'), error);
        rl.close();
        process.exit(1);
      }
    });
    
  return setup;
}