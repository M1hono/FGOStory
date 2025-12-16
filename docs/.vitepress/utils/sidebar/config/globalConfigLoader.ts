/**
 * @fileoverview Global configuration loader for sidebar generation.
 * 
 * This module provides functionality to load and parse global configuration
 * from .sidebarrc.yml files. It handles YAML parsing, error cases, and
 * provides fallback mechanisms for missing or invalid configuration files.
 * 
 * @module GlobalConfigLoader
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import { GlobalSidebarConfig } from '../types';

/**
 * @function loadGlobalConfig
 * @description Loads and parses global configuration from `.sidebarrc.yml` file.
 * Searches for the configuration file in the docs directory root and parses it as YAML.
 * Returns null if the file doesn't exist, is invalid, or parsing fails.
 * @param {string} docsPath - Absolute path to the docs directory root
 * @returns {Promise<GlobalSidebarConfig | null>} A promise resolving to parsed global configuration,
 *          or null if the file doesn't exist or parsing fails
 * @public
 * @example
 * ```typescript
 * const globalConfig = await loadGlobalConfig('/path/to/docs');
 * // Returns: { defaults: { maxDepth: 3, collapsed: false }, ... } or null
 * ```
 */
export async function loadGlobalConfig(docsPath: string): Promise<GlobalSidebarConfig | null> {
    const configFilePath = path.join(docsPath, '.sidebarrc.yml');
    
    try {
        const fileContent = await fs.readFile(configFilePath, 'utf-8');
        const parsedConfig = yaml.load(fileContent) as GlobalSidebarConfig;
        
        if (parsedConfig && typeof parsedConfig === 'object') {
            return parsedConfig;
        }
        
        return null;
    } catch (error) {
        return null;
    }
} 
