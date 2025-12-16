/**
 * @fileoverview Directory cleanup service for outdated JSON configuration management.
 * 
 * This module provides comprehensive cleanup and archival capabilities for outdated
 * JSON configuration directories. It intelligently handles user-modified content
 * preservation while safely removing system-generated configurations that are no
 * longer needed, maintaining a clean configuration structure without data loss.
 * 
 * @module DirectoryCleanupService
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { normalizePathSeparators } from '../shared/objectUtils';
import { JsonFileHandler, JsonOverrideFileType } from './JsonFileHandler';
import { MetadataManager } from './MetadataManager';
import { FileSystem } from '../shared/FileSystem';

/**
 * Intelligent directory cleanup service for JSON configuration management.
 * 
 * Provides sophisticated cleanup and archival capabilities for outdated JSON
 * configuration directories. Employs intelligent detection of user-modified
 * content to preserve valuable customizations while safely removing obsolete
 * system-generated configurations. Essential for maintaining clean configuration
 * structures without risking data loss.
 * 
 * Key capabilities:
 * - User content detection and preservation during cleanup
 * - Intelligent archival vs deletion decision making
 * - Metadata-based tracking of content modifications
 * - Safe directory removal with fallback mechanisms
 * - Cross-platform file system operations
 * 
 * @class DirectoryCleanupService
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const cleanupService = new DirectoryCleanupService(
 *   jsonFileHandler,
 *   metadataManager,
 *   fileSystem,
 *   '/docs'
 * );
 * 
 * // Clean up list of outdated directories
 * await cleanupService.cleanupOutdatedDirectories(
 *   ['old-section', 'deprecated/feature'],
 *   'en'
 * );
 * ```
 */
export class DirectoryCleanupService {
    private jsonFileHandler: JsonFileHandler;
    private metadataManager: MetadataManager;
    private fs: FileSystem;
    private docsPath: string;

    /**
     * Creates an instance of DirectoryCleanupService.
     * 
     * Initializes the cleanup service with necessary dependencies for JSON
     * configuration management, file operations, and metadata tracking.
     * 
     * @param {JsonFileHandler} jsonFileHandler - JSON file handler for configuration operations
     * @param {MetadataManager} metadataManager - Metadata manager for tracking user modifications
     * @param {FileSystem} fs - File system interface for file operations
     * @param {string} docsPath - Absolute path to the docs directory
     * @since 1.0.0
     * @example
     * ```typescript
     * const cleanupService = new DirectoryCleanupService(
     *   new JsonFileHandler(fs, basePath),
     *   new MetadataManager(fs, metadataPath),
     *   new NodeFileSystem(),
     *   '/docs'
     * );
     * ```
     */
    constructor(jsonFileHandler: JsonFileHandler, metadataManager: MetadataManager, fs: FileSystem, docsPath: string) {
        this.jsonFileHandler = jsonFileHandler;
        this.metadataManager = metadataManager;
        this.fs = fs;
        this.docsPath = docsPath;
    }

    /**
     * Cleans up multiple outdated directories intelligently.
     * 
     * Processes a list of outdated directory signatures and performs appropriate
     * cleanup actions for each. Iterates through all provided directories and
     * applies intelligent archival or deletion based on content analysis.
     * 
     * @param {string[]} outdatedDirs - Array of directory signatures to clean up
     * @param {string} lang - Language code for the directories
     * @returns {Promise<void>} Promise resolving when all cleanup operations complete
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await cleanupService.cleanupOutdatedDirectories(
     *   ['removed-guide', 'old-api/v1', 'deprecated/tools'],
     *   'en'
     * );
     * ```
     */
    public async cleanupOutdatedDirectories(outdatedDirs: string[], lang: string): Promise<void> {
        for (const outdatedDir of outdatedDirs) {

            await this.archiveOrDeleteJsonDirectory(lang, outdatedDir);
        }
    }

    /**
     * Archives or deletes a JSON directory based on user content analysis.
     * 
     * Performs intelligent decision making for directory cleanup by analyzing
     * metadata to detect user-modified content. Directories with user modifications
     * are preserved with inactive status for potential restoration, while
     * directories containing only system-generated content are safely deleted.
     * 
     * The decision process:
     * 1. Scans all override types (locales, order, collapsed) for user modifications
     * 2. If user content found: Marks entries as inactive but preserves them
     * 3. If only system content: Completely removes the directory structure
     * 4. Uses metadata tracking to ensure accurate content classification
     * 
     * @param {string} lang - Language code for the directory
     * @param {string} dirSignature - Directory signature to process
     * @returns {Promise<void>} Promise resolving when operation completes
     * @since 1.0.0
     * @private
     * @example
     * ```typescript
     * // This method is called internally by cleanupOutdatedDirectories
     * await this.archiveOrDeleteJsonDirectory('en', 'deprecated/old-feature');
     * ```
     */
    private async archiveOrDeleteJsonDirectory(lang: string, dirSignature: string): Promise<void> {
        const overrideTypes: JsonOverrideFileType[] = ['locales', 'order', 'collapsed'];
        let hasUserModifiedContent = false;
        
        for (const type of overrideTypes) {
            try {
                const metadata = await this.metadataManager.readMetadata(type, lang, dirSignature);
                for (const entry of Object.values(metadata)) {
                    if (entry.isUserSet) {
                        hasUserModifiedContent = true;
                        break;
                    }
                }
                if (hasUserModifiedContent) break;
            } catch (error) {
            }
        }
        
        if (hasUserModifiedContent) {

            for (const type of overrideTypes) {
                try {
                    const metadata = await this.metadataManager.readMetadata(type, lang, dirSignature);
                    for (const key in metadata) {
                        metadata[key].isActiveInStructure = false;
                    }
                    await this.metadataManager.writeMetadata(type, lang, dirSignature, metadata);
                } catch (error) {
                }
            }
        } else {

            try {
                const configDir = normalizePathSeparators(path.join(
                    this.docsPath, '..', '.vitepress', 'config', 'sidebar', lang, dirSignature
                ));
                await this.deleteDirectory(configDir);
            } catch (error) {

            }
        }
    }

    /**
     * Checks if a directory contains only system-generated content.
     * 
     * Analyzes directory metadata to determine if all content is system-generated
     * with no user modifications. This is used to safely identify directories
     * that can be completely removed without data loss concerns.
     * 
     * @param {string} lang - Language code for the directory
     * @param {string} dirSignature - Directory signature to analyze
     * @returns {Promise<boolean>} Promise resolving to true if only system content exists
     * @since 1.0.0
     * @private
     * @example
     * ```typescript
     * const isSystemOnly = await this.hasOnlySystemGeneratedContent('en', 'auto-generated');
     * if (isSystemOnly) {
     *   // Safe to delete completely
     * }
     * ```
     */
    private async hasOnlySystemGeneratedContent(lang: string, dirSignature: string): Promise<boolean> {
        const overrideTypes: JsonOverrideFileType[] = ['locales', 'order', 'collapsed'];
        
        for (const type of overrideTypes) {
            try {
                const metadata = await this.metadataManager.readMetadata(type, lang, dirSignature);
                for (const entry of Object.values(metadata)) {
                    if (entry.isUserSet) {
                        return false;
                    }
                }
            } catch (error) {
            }
        }
        
        return true;
    }

    /**
     * Recursively deletes a directory and all its contents with fallback handling.
     * 
     * Attempts complete directory removal using the file system's deleteDir method.
     * If that fails, falls back to individual file deletion for known JSON
     * configuration files. Provides robust cleanup even in edge cases or
     * permission-restricted environments.
     * 
     * @param {string} dirPath - Absolute path to the directory to delete
     * @returns {Promise<void>} Promise resolving when deletion attempts complete
     * @since 1.0.0
     * @private
     * @example
     * ```typescript
     * await this.deleteDirectory('/docs/.vitepress/config/sidebar/en/old-section');
     * ```
     */
    private async deleteDirectory(dirPath: string): Promise<void> {
        try {
            await this.fs.deleteDir(dirPath);
            
        } catch (error) {

            
            try {
                const jsonFiles = ['locales.json', 'order.json', 'collapsed.json'];
                
                for (const jsonFile of jsonFiles) {
                    try {
                        await this.fs.deleteFile(path.join(dirPath, jsonFile));
                    } catch (fileError) {
                    }
                }
            } catch (fallbackError) {

            }
        }
    }
} 

