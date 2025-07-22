"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Ensure logs directory exists
fs_extra_1.default.ensureDirSync(path_1.default.join(process.cwd(), 'logs'));
const logFile = path_1.default.join(process.cwd(), 'logs', `migration-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        // Write logs to console
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`))
        }),
        // Write logs to file
        new winston_1.default.transports.File({ filename: logFile })
    ]
});
exports.default = logger;
