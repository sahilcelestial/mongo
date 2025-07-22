#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const migrate_1 = require("./commands/migrate");
const analyze_1 = require("./commands/analyze");
const setup_1 = require("./commands/setup");
const logger_1 = __importDefault(require("./utils/logger"));
// Create CLI program
const program = new commander_1.Command()
    .name('mongodb-migrate')
    .description('MongoDB Migration Tool - Migrate data between MongoDB deployments')
    .version('1.0.0');
// Add commands
program.addCommand((0, setup_1.createSetupCommand)());
program.addCommand((0, analyze_1.createAnalyzeCommand)());
program.addCommand((0, migrate_1.createMigrateCommand)());
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
    logger_1.default.error('Uncaught exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Parse arguments and execute
program.parse(process.argv);
// Display help if no arguments provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
