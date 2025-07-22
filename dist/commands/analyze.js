"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyzeCommand = createAnalyzeCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const connection_1 = require("../services/connection");
const analyzer_1 = require("../services/analyzer");
const config_1 = require("../utils/config");
const logger_1 = __importDefault(require("../utils/logger"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
function createAnalyzeCommand() {
    const analyze = new commander_1.Command('analyze')
        .description('Analyze source MongoDB structure')
        .option('-s, --source-dbs <databases>', 'Comma-separated list of source databases to analyze')
        .option('-o, --output <file>', 'Output file for analysis results (JSON format)')
        .action(async (cmdOptions) => {
        const spinner = (0, ora_1.default)('Starting analysis').start();
        try {
            // Load configuration
            const { source } = (0, config_1.loadConfig)();
            // Get databases to analyze
            let sourceDatabases;
            if (cmdOptions.sourceDbs) {
                sourceDatabases = cmdOptions.sourceDbs.split(',');
            }
            spinner.text = 'Connecting to source MongoDB';
            // Connect to source
            const connectionService = new connection_1.ConnectionService();
            const { sourceClient } = await connectionService.connect(source, source); // Reuse source config for target
            spinner.text = 'Analyzing databases';
            // Analyze databases
            const analyzer = new analyzer_1.AnalyzerService();
            const databaseStats = await analyzer.analyzeDatabases(sourceClient, sourceDatabases);
            // Close connection
            await connectionService.close();
            // Output results
            if (cmdOptions.output) {
                const outputPath = path_1.default.resolve(cmdOptions.output);
                await fs_extra_1.default.writeJson(outputPath, databaseStats, { spaces: 2 });
                spinner.succeed(`Analysis completed and saved to ${outputPath}`);
            }
            else {
                spinner.succeed('Analysis completed');
                // Print summary to console
                console.log('\n' + chalk_1.default.blue('Database Analysis Summary:'));
                databaseStats.forEach(db => {
                    console.log(`\n${chalk_1.default.bold(db.name)} (${db.totalDocuments.toLocaleString()} documents, ${(db.totalSize / 1024 / 1024).toFixed(2)} MB)`);
                    console.log(chalk_1.default.dim('Collections:'));
                    // Sort collections by size (descending)
                    const sortedCollections = [...db.collections].sort((a, b) => b.size - a.size);
                    sortedCollections.forEach(coll => {
                        const sizeMB = (coll.size / 1024 / 1024).toFixed(2);
                        console.log(`  ${coll.name}: ${coll.count.toLocaleString()} docs, ${sizeMB} MB, ${coll.indexes.length} indexes`);
                    });
                });
            }
            logger_1.default.info('Analysis command completed');
        }
        catch (error) {
            spinner.fail('Analysis failed');
            console.error(chalk_1.default.red('Error:'), error);
            logger_1.default.error('Analysis command failed:', error);
            process.exit(1);
        }
    });
    return analyze;
}
