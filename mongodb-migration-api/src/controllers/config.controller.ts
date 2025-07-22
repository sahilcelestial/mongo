import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { ConfigData } from '../models/types';

// Path to store config
const configPath = path.join(process.cwd(), 'config.json');

/**
 * Save configuration
 */
export async function saveConfig(req: Request, res: Response) {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { source, target, options } = req.body;
  
  try {
    const config: ConfigData = { source, target, options };
    
    // Save to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    return res.status(200).json({
      success: true,
      message: 'Configuration saved'
    });
  } catch (error) {
    console.error('Error saving config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get configuration
 */
export async function getConfig(req: Request, res: Response) {
  try {
    // Check if config exists
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }
    
    // Read config
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData) as ConfigData;
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error loading config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error loading configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}