/**
 * @fileoverview Metadata management utilities for JSON override files.
 * 
 * This module provides comprehensive metadata management for JSON override files
 * used in sidebar configuration. It tracks value changes, user modifications,
 * and activity status to enable intelligent synchronization while preserving
 * user customizations and providing rollback capabilities.
 * 
 * @module MetadataManager
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import crypto from 'node:crypto';
import { FileSystem } from '../shared/FileSystem';
import { normalizePathSeparators } from '../shared/objectUtils';
import { JsonFileMetadata, MetadataEntry } from '../types';
import { JsonOverrideFileType } from './JsonFileHandler';

/**
 * Metadata manager for JSON override file tracking and change detection.
 * 
 * Manages comprehensive metadata for JSON override files to track value changes,
 * user modifications, and activity status. This enables intelligent synchronization
 * that preserves user customizations while allowing for safe automatic updates
 * and providing rollback capabilities for configuration management.
 * 
 * Key capabilities:
 * - Hash-based change detection for configuration values
 * - User modification tracking to preserve manual edits
 * - Activity status management for orphaned entries
 * - Archive support for configuration history
 * - Cross-platform file path handling
 * 
 * @class MetadataManager
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const metadataManager = new MetadataManager(
 *   fileSystem,
 *   '/docs/.vitepress/config/sidebar/.metadata'
 * );
 * 
 * // Read existing metadata
 * const metadata = await metadataManager.readMetadata('collapsed', 'en', 'guide');
 * 
 * // Create new metadata entry
 * const entry = metadataManager.createNewMetadataEntry(value, false, true);
 * 
 * // Check for user modifications
 * const isModified = metadataManager.isEntryUserModified(currentValue, existingEntry);
 * ```
 */
export class MetadataManager {
    private readonly fs: FileSystem;
    private readonly baseMetadataStoragePath: string;

    /**
     * Creates an instance of MetadataManager.
     * 
     * Initializes the metadata manager with a file system interface and base
     * storage path for metadata files. The storage path typically points to
     * a .metadata directory within the sidebar configuration structure.
     * 
     * @param {FileSystem} fs - FileSystem instance for file operations
     * @param {string} baseMetadataStoragePath - Absolute path to metadata storage directory
     * @since 1.0.0
     * @example
     * ```typescript
     * const manager = new MetadataManager(
     *   new NodeFileSystem(),
     *   '/docs/.vitepress/config/sidebar/.metadata'
     * );
     * ```
     */
    constructor(fs: FileSystem, baseMetadataStoragePath: string) {
        this.fs = fs;
        this.baseMetadataStoragePath = normalizePathSeparators(baseMetadataStoragePath);
    }

    /**
     * Generates the complete file path for a metadata file.
     * 
     * Constructs the full file system path for metadata files corresponding to
     * directory-based JSON overrides. Follows the same directory structure as
     * the JSON override files for consistency and easy navigation.
     * 
     * @param {JsonOverrideFileType} type - The type of override metadata
     * @param {string} lang - The language code (e.g., 'en', 'zh')
     * @param {string} itemDirectoryPathSignature - Path signature relative to language root
     * @returns {string} Complete normalized file system path for metadata file
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const path = manager.getMetadataFilePath('collapsed', 'en', 'guide/concepts');
     * // Returns: '/metadata/en/guide/concepts/collapsed.json'
     * ```
     */
    public getMetadataFilePath(type: JsonOverrideFileType, lang: string, itemDirectoryPathSignature: string): string {
        const fileName = `${type}.json`;
        const fullPath = itemDirectoryPathSignature
            ? path.join(this.baseMetadataStoragePath, lang, itemDirectoryPathSignature, fileName)
            : path.join(this.baseMetadataStoragePath, lang, fileName);
        return normalizePathSeparators(fullPath);
    }

    /**
     * Reads and parses metadata for a specific override type.
     * 
     * Attempts to read metadata from the file system and parse it as a JSON
     * object. Returns an empty metadata object if the file doesn't exist,
     * is empty, or contains invalid data. This provides safe fallback
     * behavior for missing or corrupted metadata files.
     * 
     * @param {JsonOverrideFileType} type - The type of override metadata to read
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @returns {Promise<JsonFileMetadata>} Promise resolving to metadata object or empty object
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const metadata = await manager.readMetadata('order', 'en', 'api');
     * // Returns: { 'intro.md': { valueHash: '...', isUserSet: false, isActiveInStructure: true } }
     * ```
     */
    public async readMetadata(
        type: JsonOverrideFileType, 
        lang: string, 
        itemDirectoryPathSignature: string
    ): Promise<JsonFileMetadata> {
        const filePath = this.getMetadataFilePath(type, lang, itemDirectoryPathSignature);
        try {
            if (await this.fs.exists(filePath)) {
                const content = await this.fs.readFile(filePath);
                if (content.trim() === '') return {};
                const parsed = JSON.parse(content);
                if (typeof parsed === 'object' && parsed !== null) {
                    return parsed as JsonFileMetadata;
                }

                return {};
            }
        } catch (error: any) {

        }
        return {};
    }

    /**
     * Writes metadata to a specific metadata file.
     * 
     * Serializes metadata to JSON and writes it to the appropriate metadata file.
     * Automatically creates necessary parent directories and formats the JSON
     * with proper indentation for readability and version control.
     * 
     * @param {JsonOverrideFileType} type - The type of override metadata to write
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @param {JsonFileMetadata} metadata - Metadata object to write
     * @returns {Promise<void>} Promise resolving when write operation completes
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await manager.writeMetadata('hidden', 'en', 'deprecated', {
     *   'old-feature.md': {
     *     valueHash: 'abc123',
     *     isUserSet: true,
     *     isActiveInStructure: false
     *   }
     * });
     * ```
     */
    public async writeMetadata(
        type: JsonOverrideFileType, 
        lang: string, 
        itemDirectoryPathSignature: string, 
        metadata: JsonFileMetadata
    ): Promise<void> {
        const filePath = this.getMetadataFilePath(type, lang, itemDirectoryPathSignature);
        try {
            await this.fs.ensureDir(path.dirname(filePath));
            await this.fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
        } catch (error: any) {

        }
    }

    /**
     * Writes metadata to an archive location for historical preservation.
     * 
     * Similar to writeMetadata but writes to an archive directory structure
     * within a .metadata subfolder. Used for backup and versioning purposes
     * to maintain a complete history of metadata changes.
     * 
     * @param {JsonOverrideFileType} type - The type of override metadata to archive
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @param {JsonFileMetadata} metadata - Metadata object to archive
     * @param {string} archiveBasePath - Base path for archive location
     * @returns {Promise<void>} Promise resolving when archive write completes
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await manager.writeMetadataToArchive(
     *   'locales',
     *   'en',
     *   'guide',
     *   metadata,
     *   '/docs/.vitepress/config/archive/2024-01-01'
     * );
     * ```
     */
    public async writeMetadataToArchive(
        type: JsonOverrideFileType,
        lang: string,
        itemDirectoryPathSignature: string,
        metadata: JsonFileMetadata,
        archiveBasePath: string
    ): Promise<void> {
        const fileName = `${type}.json`;
        const metadataArchivePath = normalizePathSeparators(path.join(archiveBasePath, '.metadata'));
        const filePath = normalizePathSeparators(path.join(metadataArchivePath, lang, itemDirectoryPathSignature, fileName));
        try {
            await this.fs.ensureDir(path.dirname(filePath));
            await this.fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
        } catch (error: any) {
            console.error(`Failed to write archive metadata to ${filePath}`, error);
        }
    }

    /**
     * Deletes a specific metadata file.
     * 
     * Removes a metadata file from the file system if it exists. Safely handles
     * cases where the file doesn't exist and provides error logging for
     * debugging purposes.
     * 
     * @param {JsonOverrideFileType} type - The type of override metadata to delete
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @returns {Promise<void>} Promise resolving when deletion completes
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await manager.deleteMetadata('collapsed', 'en', 'removed-section');
     * ```
     */
    public async deleteMetadata(
        type: JsonOverrideFileType,
        lang: string,
        itemDirectoryPathSignature: string
    ): Promise<void> {
        const filePath = this.getMetadataFilePath(type, lang, itemDirectoryPathSignature);
        try {
            if (await this.fs.exists(filePath)) {
                await this.fs.deleteFile(filePath);
            }
        } catch (error: any) {
            console.error(`Failed to delete metadata file ${filePath}`, error);
        }
    }

    /**
     * Generates a hash for a given value for change detection.
     * 
     * Creates an MD5 hash of the provided value to enable efficient change
     * detection between different versions of configuration values. Handles
     * various data types by stringifying non-string values before hashing.
     * 
     * @param {any} value - Value to hash (typically from JSON override files)
     * @returns {string} MD5 hash of the value
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const hash1 = manager.generateValueHash('My Title');
     * const hash2 = manager.generateValueHash({ collapsed: true });
     * const hash3 = manager.generateValueHash(null); // 'null_or_undefined_hash'
     * ```
     */
    public generateValueHash(value: any): string {
        if (value === null || value === undefined) return 'null_or_undefined_hash';
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return crypto.createHash('md5').update(stringValue).digest('hex');
    }

    /**
     * Creates a new metadata entry with specified properties.
     * 
     * Constructs a new MetadataEntry object with a hash of the provided value
     * and the specified user-set and activity status flags. This is the
     * standard way to create metadata entries for new configuration values.
     * 
     * @param {any} value - Value to create metadata entry for
     * @param {boolean} isUserSet - Whether this value was explicitly set by a user
     * @param {boolean} isActiveInStructure - Whether this entry is currently active in the sidebar structure
     * @returns {MetadataEntry} New metadata entry object
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * // Create entry for system-generated value
     * const systemEntry = manager.createNewMetadataEntry('Default Title', false, true);
     * 
     * // Create entry for user-set value
     * const userEntry = manager.createNewMetadataEntry('Custom Title', true, true);
     * ```
     */
    public createNewMetadataEntry(value: any, isUserSet: boolean, isActiveInStructure: boolean): MetadataEntry {
        return {
            valueHash: this.generateValueHash(value),
            isUserSet,
            isActiveInStructure,
        };
    }

    /**
     * Checks if a configuration value represents a user modification.
     * 
     * Determines whether a current JSON value appears to be user-modified by
     * comparing it against existing metadata. This is crucial for preserving
     * user customizations during automatic synchronization processes.
     * 
     * The detection logic:
     * 1. No metadata = treat as system-generated (false)
     * 2. Explicitly marked as user-set = user-modified (true)
     * 3. Value hash changed from recorded = user-modified (true)
     * 4. Otherwise = not user-modified (false)
     * 
     * @param {any} currentJsonValue - Current value from JSON override file
     * @param {MetadataEntry} [metadataEntry] - Existing metadata entry for comparison
     * @returns {boolean} True if the value appears to be user-modified
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const isUserModified = manager.isEntryUserModified(
     *   'User Changed Title',
     *   { valueHash: 'original_hash', isUserSet: false, isActiveInStructure: true }
     * ); // Returns: true (hash mismatch indicates user change)
     * ```
     */
    public isEntryUserModified(currentJsonValue: any, metadataEntry?: MetadataEntry): boolean {
        if (!metadataEntry) {
            return false;
        }
        if (metadataEntry.isUserSet) {
            return true;
        }
        
        const currentHash = this.generateValueHash(currentJsonValue);
        return currentHash !== metadataEntry.valueHash;
    }
} 

