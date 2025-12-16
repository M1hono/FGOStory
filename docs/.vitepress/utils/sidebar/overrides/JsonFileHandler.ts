/**
 * @fileoverview JSON file handling utilities for sidebar configuration overrides.
 * 
 * This module provides comprehensive file system operations for managing scoped
 * JSON override files (locales.json, order.json, collapsed.json, hidden.json)
 * that control sidebar behavior. These files are organized in a hierarchical
 * directory structure corresponding to sidebar folder items and root views.
 * 
 * @module JsonFileHandler
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { FileSystem } from '../shared/FileSystem';
import { normalizePathSeparators } from '../shared/objectUtils';

/**
 * Type definition for supported JSON override file types.
 * Each type corresponds to a specific aspect of sidebar configuration.
 * 
 * @typedef {string} JsonOverrideFileType
 * @since 1.0.0
 */
export type JsonOverrideFileType = 'locales' | 'order' | 'collapsed' | 'hidden';

/**
 * JSON file handler for sidebar configuration overrides.
 * 
 * Manages the reading, writing, and organization of JSON override files that
 * provide fine-grained control over sidebar behavior. Files are scoped to
 * specific directories and organized by language and path signature for
 * efficient lookup and management.
 * 
 * Supported file types:
 * - `locales.json`: Item display text overrides for internationalization
 * - `order.json`: Item ordering and priority configurations
 * - `collapsed.json`: Collapse state overrides for directory items
 * - `hidden.json`: Visibility control for sidebar items
 * 
 * @class JsonFileHandler
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const handler = new JsonFileHandler(fs, '/docs/.vitepress/config/sidebar');
 * 
 * // Read existing configuration
 * const config = await handler.readJsonFile('collapsed', 'en', 'guide/concepts');
 * 
 * // Write updated configuration
 * await handler.writeJsonFile('order', 'en', 'api', { 'intro.md': 1, 'advanced.md': 2 });
 * ```
 */
export class JsonFileHandler {
    private readonly fs: FileSystem;
    private readonly baseOverridesPath: string;

    /**
     * Creates an instance of JsonFileHandler.
     * 
     * Initializes the handler with a file system interface and base path for
     * organizing override files. The base path typically points to the sidebar
     * configuration directory within the VitePress config structure.
     * 
     * @param {FileSystem} fs - FileSystem instance for file operations
     * @param {string} baseOverridesPath - Absolute path to the directory containing type subfolders
     * @since 1.0.0
     * @example
     * ```typescript
     * const handler = new JsonFileHandler(
     *   new NodeFileSystem(),
     *   '/docs/.vitepress/config/sidebar'
     * );
     * ```
     */
    constructor(fs: FileSystem, baseOverridesPath: string) {
        this.fs = fs;
        this.baseOverridesPath = normalizePathSeparators(baseOverridesPath);
    }

    /**
     * Generates the complete file path for a JSON override file.
     * 
     * Constructs the full file system path for a specific override file based on
     * its type, language, and directory signature. The path follows the pattern:
     * `{baseOverridesPath}/{lang}/{itemDirectoryPathSignature}/{type}.json`
     * 
     * @param {JsonOverrideFileType} type - The type of override file
     * @param {string} lang - The language code (e.g., 'en', 'zh')
     * @param {string} itemDirectoryPathSignature - Path signature relative to language root
     * @returns {string} Complete normalized file system path
     * @since 1.0.0
     * @private
     * @example
     * ```typescript
     * // Returns: '/config/sidebar/en/guide/concepts/collapsed.json'
     * const path = this.getJsonFilePath('collapsed', 'en', 'guide/concepts');
     * ```
     */
    private getJsonFilePath(type: JsonOverrideFileType, lang: string, itemDirectoryPathSignature: string): string {
        const fileName = `${type}.json`;
        const fullPath = itemDirectoryPathSignature 
            ? path.join(this.baseOverridesPath, lang, itemDirectoryPathSignature, fileName)
            : path.join(this.baseOverridesPath, lang, fileName);
        return normalizePathSeparators(fullPath);
    }

    /**
     * Reads and parses a specific JSON override file.
     * 
     * Attempts to read a JSON override file from the file system and parse its
     * contents. Returns an empty object if the file doesn't exist, is empty,
     * or contains invalid JSON. This provides safe fallback behavior for
     * missing or corrupted configuration files.
     * 
     * @param {JsonOverrideFileType} type - The type of override file to read
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @returns {Promise<Record<string, any>>} Promise resolving to parsed JSON object or empty object
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const collapsedConfig = await handler.readJsonFile('collapsed', 'en', 'guide');
     * // Returns: { 'concepts/': true, 'advanced/': false } or {}
     * ```
     */
    public async readJsonFile(
        type: JsonOverrideFileType, 
        lang: string, 
        itemDirectoryPathSignature: string
    ): Promise<Record<string, any>> {
        const filePath = this.getJsonFilePath(type, lang, itemDirectoryPathSignature);
        try {
            if (await this.fs.exists(filePath)) {
                const content = await this.fs.readFile(filePath);
                if (content.trim() === '') return {};
                return JSON.parse(content);
            }
        } catch (error: any) {

        }
        return {};
    }

    /**
     * Writes data to a specific JSON override file.
     * 
     * Serializes the provided data to JSON and writes it to the appropriate
     * override file. Automatically creates necessary parent directories and
     * formats the JSON with proper indentation for readability.
     * 
     * @param {JsonOverrideFileType} type - The type of override file to write
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @param {Record<string, any>} data - Configuration data to write
     * @returns {Promise<void>} Promise resolving when write operation completes
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await handler.writeJsonFile('order', 'en', 'api', {
     *   'introduction.md': 1,
     *   'advanced.md': 2,
     *   'reference/': 3
     * });
     * ```
     */
    public async writeJsonFile(
        type: JsonOverrideFileType, 
        lang: string, 
        itemDirectoryPathSignature: string, 
        data: Record<string, any>
    ): Promise<void> {
        const filePath = this.getJsonFilePath(type, lang, itemDirectoryPathSignature);
        try {
            await this.fs.ensureDir(path.dirname(filePath));
            await this.fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error: any) {

        }
    }

    /**
     * Writes data to a JSON override file in an archive location.
     * 
     * Similar to writeJsonFile but writes to an archive directory structure
     * instead of the active configuration location. Used for backup and
     * versioning purposes to preserve configuration history.
     * 
     * @param {JsonOverrideFileType} type - The type of override file to write
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @param {Record<string, any>} data - Configuration data to write
     * @param {string} archiveBasePath - Base path for archive location
     * @returns {Promise<void>} Promise resolving when archive write completes
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await handler.writeJsonFileToArchive(
     *   'collapsed',
     *   'en',
     *   'guide',
     *   config,
     *   '/docs/.vitepress/config/archive/2024-01-01'
     * );
     * ```
     */
    public async writeJsonFileToArchive(
        type: JsonOverrideFileType,
        lang: string,
        itemDirectoryPathSignature: string,
        data: Record<string, any>,
        archiveBasePath: string
    ): Promise<void> {
        const fileName = `${type}.json`;
        const filePath = normalizePathSeparators(path.join(archiveBasePath, lang, itemDirectoryPathSignature, fileName));
        try {
            await this.fs.ensureDir(path.dirname(filePath));
            await this.fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error: any) {
            console.error(`Failed to write archive file to ${filePath}`, error);
        }
    }

    /**
     * Deletes a specific JSON override file.
     * 
     * Removes a JSON override file from the file system if it exists.
     * Safely handles cases where the file doesn't exist and provides
     * error logging for debugging purposes.
     * 
     * @param {JsonOverrideFileType} type - The type of override file to delete
     * @param {string} lang - The language code
     * @param {string} itemDirectoryPathSignature - Path signature for the target directory
     * @returns {Promise<void>} Promise resolving when deletion completes
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await handler.deleteJsonFile('hidden', 'en', 'deprecated/old-section');
     * ```
     */
    public async deleteJsonFile(
        type: JsonOverrideFileType,
        lang: string,
        itemDirectoryPathSignature: string
    ): Promise<void> {
        const filePath = this.getJsonFilePath(type, lang, itemDirectoryPathSignature);
        try {
            if (await this.fs.exists(filePath)) {
                await this.fs.deleteFile(filePath);
            }
        } catch (error: any) {
            console.error(`Failed to delete file ${filePath}`, error);
        }
    }

    /**
     * Gets the FileSystem instance for direct access.
     * 
     * Provides access to the underlying FileSystem instance for advanced
     * operations that may not be covered by the JsonFileHandler interface.
     * 
     * @returns {FileSystem} The FileSystem instance used by this handler
     * @since 1.0.0
     * @public
     */
    public getFileSystem(): FileSystem {
        return this.fs;
    }

    /**
     * Gets the base overrides path for direct access.
     * 
     * Returns the configured base path for override files, useful for
     * path construction in other services that need to work with the
     * same directory structure.
     * 
     * @returns {string} The base overrides path
     * @since 1.0.0
     * @public
     */
    public getBaseOverridesPath(): string {
        return this.baseOverridesPath;
    }
} 

