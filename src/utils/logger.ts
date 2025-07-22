import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

// Ensure logs directory exists
fs.ensureDirSync(path.join(process.cwd(), 'logs'));

const logFile = path.join(process.cwd(), 'logs', `migration-${new Date().toISOString().replace(/:/g, '-')}.log`);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    }),
    // Write logs to file
    new winston.transports.File({ filename: logFile })
  ]
});

export default logger;