#!/usr/bin/env node

import { Command } from 'commander';
import { createMigrateCommand } from './commands/migrate';
import { createAnalyzeCommand } from './commands/analyze';
import { createSetupCommand } from './commands/setup';
import logger from './utils/logger';

// Create CLI program
const program = new Command()
  .name('mongodb-migrate')
  .description('MongoDB Migration Tool - Migrate data between MongoDB deployments')
  .version('1.0.0');

// Add commands
program.addCommand(createSetupCommand());
program.addCommand(createAnalyzeCommand());
program.addCommand(createMigrateCommand());

// Add help command
program
  .command('help')
  .description('Display help information')
  .action(() => {
    program.outputHelp();
  });

// Display help on unknown commands
program.on('command:*', () => {
  console.error(`Unknown command: ${program.args.join(' ')}`);
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Handle errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse arguments and execute
program.parse(process.argv);

// Display help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}