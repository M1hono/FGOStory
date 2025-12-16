/**
 * @fileoverview Core synchronization engine for sidebar configuration management.
 * 
 * This module provides the core logic for synchronizing structural sidebar items
 * with JSON override configurations. It handles persistence, user edit preservation,
 * metadata updates, and ensures that existing user configurations are never
 * overridden while adding missing entries safely.
 * 
 * @module SyncEngine
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import {
    SidebarItem,
    EffectiveDirConfig,
    JsonFileMetadata,
    MetadataEntry,
} from "../types";
import { JsonFileHandler, JsonOverrideFileType } from "./JsonFileHandler";
import { MetadataManager } from "./MetadataManager";

/**
 * Core synchronization engine for sidebar configuration management.
 * 
 * The SyncEngine coordinates the synchronization between dynamically generated
 * sidebar structures and persisted JSON override configurations. It employs a
 * conservative approach that preserves existing user configurations while safely
 * adding missing entries and managing metadata for change tracking.
 * 
 * Key principles:
 * - Never overrides existing user configurations
 * - Only adds missing entries to prevent configuration loss
 * - Maintains metadata for all configuration changes
 * - Supports rollback through inactive entry preservation
 * 
 * @class SyncEngine
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const syncEngine = new SyncEngine();
 * 
 * const result = await syncEngine.syncOverrideType(
 *   sidebarItems,
 *   existingConfig,
 *   existingMetadata,
 *   'collapsed',
 *   'en',
 *   false,
 *   item => item._relativePathKey,
 *   metadataManager
 * );
 * ```
 */
export class SyncEngine {

    /**
     * Creates an instance of SyncEngine.
     * 
     * Currently uses a lightweight constructor as dependencies are passed
     * to individual methods for maximum flexibility and testability.
     * 
     * @since 1.0.0
     */
    constructor() {
    }

    /**
     * Synchronizes a specific override type with the current sidebar structure.
     * 
     * This method implements a conservative synchronization strategy that ONLY
     * adds missing entries and never overrides existing configurations. This
     * approach prevents data loss and reduces unnecessary Git changes while
     * ensuring that all current sidebar items have corresponding configuration
     * entries when needed.
     * 
     * The synchronization process:
     * 1. Identifies existing vs missing configuration entries
     * 2. Adds missing entries with appropriate default values
     * 3. Updates metadata for tracking and rollback purposes
     * 4. Marks orphaned entries as inactive (preserves for restoration)
     * 5. Removes orphaned entries from active configuration
     * 
     * @param {SidebarItem[]} currentItems - Current sidebar items from structure generation
     * @param {Record<string, any>} existingJsonData - Existing JSON configuration data
     * @param {JsonFileMetadata} existingMetadata - Existing metadata for change tracking
     * @param {JsonOverrideFileType} overrideType - Type of override ('locales', 'collapsed', 'hidden', 'order')
     * @param {string} lang - Current language code
     * @param {boolean} isDevMode - Whether running in development mode
     * @param {Function} keyExtractor - Function to extract unique keys from sidebar items
     * @param {MetadataManager} metadataManager - Manager for creating and updating metadata entries
     * @returns {Promise<{updatedJsonData: Record<string, any>, updatedMetadata: JsonFileMetadata}>} Promise resolving to updated configuration and metadata
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const result = await syncEngine.syncOverrideType(
     *   sidebarItems,
     *   { 'item1': true, 'item2': false },
     *   existingMetadata,
     *   'collapsed',
     *   'en',
     *   false,
     *   item => item._relativePathKey || item.text,
     *   metadataManager
     * );
     * ```
     */
    public async syncOverrideType(
        currentItems: SidebarItem[],
        existingJsonData: Record<string, any>,
        existingMetadata: JsonFileMetadata,
        overrideType: JsonOverrideFileType,
        lang: string,
        isDevMode: boolean,
        keyExtractor: (item: SidebarItem) => string,
        metadataManager: MetadataManager
    ): Promise<{ updatedJsonData: Record<string, any>; updatedMetadata: JsonFileMetadata }> {
        const updatedJsonData = { ...existingJsonData };
        const updatedMetadata = { ...existingMetadata };
        const currentTimestamp = Date.now();

        let newEntriesAdded = 0;
        let existingEntriesUpdated = 0;

        for (const item of currentItems) {
            const itemKey = keyExtractor(item);
            if (!itemKey) {
                continue;
            }

            if (overrideType === 'collapsed' && !item._isDirectory) {
                continue;
            }

            const existingEntry = existingMetadata[itemKey];
            const existingJsonValue = existingJsonData[itemKey];

            if (existingEntry && existingJsonData.hasOwnProperty(itemKey)) {
                updatedMetadata[itemKey] = {
                    ...existingEntry,
                    isActiveInStructure: true,
                };

                if (overrideType === 'order' && typeof existingJsonValue === 'number') {
                    item._priority = existingJsonValue;
                }
                
                existingEntriesUpdated++;
            } else {
                let defaultValue: any;
                if (overrideType === 'locales') {
                    defaultValue = item.text;
                } else if (overrideType === 'collapsed') {
                    defaultValue = item.collapsed !== undefined ? item.collapsed : true;
                } else if (overrideType === 'hidden') {
                    defaultValue = false;
                } else if (overrideType === 'order') {
                    defaultValue = typeof item._priority === 'number' ? item._priority : Number.MAX_SAFE_INTEGER;
                } else {
                    continue;
                }

                updatedJsonData[itemKey] = defaultValue;

                updatedMetadata[itemKey] = metadataManager.createNewMetadataEntry(defaultValue, false, true);
                
                newEntriesAdded++;
            }
        }

        let inactiveEntriesMarked = 0;
        let orphanedEntriesRemoved = 0;
        const currentItemKeys = new Set(currentItems.map(item => keyExtractor(item)).filter(key => key));
        
        for (const [existingKey, existingEntry] of Object.entries(existingMetadata)) {
            if (existingKey === '_self_') {
                continue;
            }
            
            if (!currentItemKeys.has(existingKey)) {
                updatedMetadata[existingKey] = {
                    ...existingEntry,
                    isActiveInStructure: false,
                };
                
                if (updatedJsonData.hasOwnProperty(existingKey)) {
                    delete updatedJsonData[existingKey];
                    orphanedEntriesRemoved++;
                }
                
                inactiveEntriesMarked++;
            }
        }

        return {
            updatedJsonData,
            updatedMetadata
        };
    }
}
