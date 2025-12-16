/**
 * @fileoverview Configuration defaults provider for sidebar generation.
 * 
 * This module provides functionality to apply system defaults to partial
 * configuration objects, ensuring all required fields are present with
 * appropriate fallback values. It resolves final configuration objects
 * from merged partial configurations.
 * 
 * @module ConfigDefaultsProvider
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { EffectiveDirConfig, GlobalSidebarConfig, DirectoryConfig, GroupConfig, ExternalLinkConfig } from '../types';

/**
 * @function convertItemOrderToRecord
 * @description Converts item order configuration from array or object format to a standardized Record format.
 * Handles both array-based ordering (with index-based priorities) and object-based ordering
 * with explicit priority values. Ensures all values are valid numbers.
 * @param {string[] | Record<string, number> | undefined} itemOrder - Item order configuration to convert
 * @returns {Record<string, number>} Normalized order configuration as a record of item names to priorities
 * @private
 * @example
 * ```typescript
 * // Array format
 * convertItemOrderToRecord(['intro', 'guide', 'api'])
 * // Returns: { 'intro': 0, 'guide': 1, 'api': 2 }
 * 
 * // Object format
 * convertItemOrderToRecord({ 'api': 10, 'intro': 1 })
 * // Returns: { 'api': 10, 'intro': 1 }
 * ```
 */
function convertItemOrderToRecord(itemOrder?: string[] | Record<string, number>): Record<string, number> {
    if (Array.isArray(itemOrder)) {
        const recordOrder: Record<string, number> = {};
        itemOrder.forEach((item, index) => {
            if (typeof item === 'string') recordOrder[item] = index;
        });
        return recordOrder;
    }
    if (typeof itemOrder === 'object' && itemOrder !== null) {
        const recordOrder: Record<string, number> = {};
        for (const [key, value] of Object.entries(itemOrder)) {
            const numValue = typeof value === 'number' ? value : parseInt(value as string, 10);
            if (!isNaN(numValue)) {
                recordOrder[key] = numValue;
            }
        }
        return recordOrder;
    }
    return {};
}

/**
 * @function applyConfigDefaults
 * @description Applies system defaults to a partial configuration object to create a complete EffectiveDirConfig.
 * Resolves all optional fields with appropriate fallback values and ensures the configuration
 * is complete and valid for use throughout the sidebar generation process.
 * 
 * Default values applied:
 * - root: false (unless explicitly set to true)
 * - title: directory name (derived from path)
 * - hidden: false
 * - priority: 0
 * - maxDepth: 3 (or from global defaults)
 * - collapsed: false (or from global defaults)
 * - itemOrder: {} (empty object)
 * - groups: [] (empty array)
 * - externalLinks: [] (empty array)
 * 
 * @param {Partial<EffectiveDirConfig>} partialConfig - Partial configuration object to complete
 * @param {string} directoryPath - Absolute path to the directory for this configuration
 * @param {string} lang - Language code for this configuration
 * @param {boolean} isDevMode - Whether running in development mode
 * @param {any} [globalDefaults] - Optional global defaults to use as fallbacks
 * @returns {EffectiveDirConfig} Complete configuration object with all required fields resolved
 * @public
 * @example
 * ```typescript
 * const complete = applyConfigDefaults(
 *   { title: "Guide", maxDepth: 2 },
 *   '/docs/en/guide',
 *   'en',
 *   false,
 *   { maxDepth: 3, collapsed: false }
 * );
 * // Returns complete EffectiveDirConfig with title "Guide", maxDepth 2, other defaults applied
 * ```
 */
export function applyConfigDefaults(
    partialConfig: Partial<EffectiveDirConfig>,
    directoryPath: string,
    lang: string,
    isDevMode: boolean,
    globalDefaults?: any
): EffectiveDirConfig {
    const defaults = globalDefaults || {};
    const dirName = path.basename(directoryPath);
    
    const root = partialConfig.root ?? false;
    const title = partialConfig.title ?? dirName;
    const hidden = partialConfig.hidden ?? defaults.hidden ?? false;
    const priority = partialConfig.priority ?? 0;
    const maxDepth = partialConfig.maxDepth ?? defaults.maxDepth ?? 3;
    const collapsed = partialConfig.collapsed ?? defaults.collapsed ?? false;
    const itemOrder = partialConfig.itemOrder ?? {};
    const groups = partialConfig.groups ?? [];
    const externalLinks = partialConfig.externalLinks ?? [];

    return {
        root,
        title,
        hidden,
        priority,
        maxDepth,
        collapsed,
        itemOrder,
        groups,
        externalLinks,
        path: directoryPath,
        lang,
        isDevMode,
        ...partialConfig
    };
} 

