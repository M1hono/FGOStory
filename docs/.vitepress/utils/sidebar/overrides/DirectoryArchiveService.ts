/**
 * @fileoverview Directory archive service for JSON configuration preservation.
 * 
 * This module provides specialized archival capabilities for complete directory
 * configurations when physical directories are moved or removed. It ensures
 * that valuable configuration data is preserved in organized archives while
 * maintaining metadata integrity and providing timestamp-based organization
 * for historical tracking and potential restoration.
 * 
 * @module DirectoryArchiveService
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
 * Specialized archival service for complete directory configuration preservation.
 * 
 * Provides comprehensive archival capabilities for entire directory configurations
 * when physical directories are moved or removed from the content structure.
 * Focuses on complete directory-level archival rather than individual value
 * preservation, ensuring that entire configuration contexts are maintained
 * for historical reference and potential restoration.
 * 
 * Key capabilities:
 * - Complete directory configuration archival
 * - Physical directory existence validation
 * - Timestamp-based archive organization
 * - Metadata preservation alongside configuration data
 * - Automatic cleanup after successful archival
 * - Cross-platform path handling and normalization
 * 
 * @class DirectoryArchiveService
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const archiveService = new DirectoryArchiveService(
 *   jsonFileHandler,
 *   metadataManager,
 *   fileSystem,
 *   '/docs'
 * );
 * 
 * // Archive outdated directories
 * await archiveService.archiveOutdatedDirectories(
 *   ['old-guide', 'removed-section'],
 *   'en'
 * );
 * ```
 */
export class DirectoryArchiveService {
    private jsonFileHandler: JsonFileHandler;
    private metadataManager: MetadataManager;
    private fs: FileSystem;
    private docsPath: string;
    private archivePath: string;

    /**
     * Creates an instance of DirectoryArchiveService.
     * 
     * Initializes the archive service with necessary dependencies and establishes
     * the archive path structure. Sets up the service for complete directory
     * configuration archival with proper file system access and metadata handling.
     * 
     * @param {JsonFileHandler} jsonFileHandler - JSON file handler for configuration operations
     * @param {MetadataManager} metadataManager - Metadata manager for tracking and preservation
     * @param {FileSystem} fs - File system interface for file operations
     * @param {string} docsPath - Absolute path to the docs directory
     * @since 1.0.0
     * @example
     * ```typescript
     * const archiveService = new DirectoryArchiveService(
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
        this.archivePath = normalizePathSeparators(path.join(this.docsPath, '..', '.vitepress', 'config', 'sidebar', '.archive'));
    }

    /**
     * Archives complete directory configurations for outdated directories.
     * 
     * Processes a list of outdated directory signatures and archives their
     * complete configurations when the corresponding physical directories
     * no longer exist. Ensures that valuable configuration data is preserved
     * even when content structures change significantly.
     * 
     * The archival process:
     * 1. Validates that physical directories no longer exist
     * 2. Checks for the presence of configuration files to archive
     * 3. Performs complete directory configuration archival
     * 4. Organizes archived data with timestamp-based naming
     * 5. Cleans up original files after successful archival
     * 
     * @param {string[]} outdatedDirs - Array of directory signatures that are no longer active
     * @param {string} lang - Language code for configuration organization
     * @returns {Promise<void>} Promise resolving when all archival operations complete
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * await archiveService.archiveOutdatedDirectories(
     *   ['deprecated/old-feature', 'removed-guide'],
     *   'en'
     * );
     * ```
     */
    public async archiveOutdatedDirectories(outdatedDirs: string[], lang: string): Promise<void> {
        if (outdatedDirs.length === 0) {
            return;
        }

        await this.fs.ensureDir(this.archivePath);

        for (const outdatedDir of outdatedDirs) {
            const physicalDirPath = this.getPhysicalDirPath(outdatedDir, lang);
            const physicalDirExists = await this.fs.exists(physicalDirPath);

            if (!physicalDirExists && await this.hasAnyConfigFiles(lang, outdatedDir)) {
                await this.archiveEntireDirectory(lang, outdatedDir);
            }
        }
    }

    /**
     * Converts a directory signature to its corresponding physical directory path.
     * 
     * Maps directory signatures used in configuration management back to their
     * corresponding physical directory paths in the content structure. Handles
     * special cases like '_root' signature and language prefixes correctly.
     * 
     * @param {string} dirSignature - Directory signature to convert (e.g., 'guide/concepts', '_root')
     * @param {string} lang - Language code for path construction
     * @returns {string} Normalized physical directory path
     * @since 1.0.0
     * @private
     */
    private getPhysicalDirPath(dirSignature: string, lang: string): string {
        if (dirSignature === '_root') {
            return normalizePathSeparators(path.join(this.docsPath, lang));
        }
        return normalizePathSeparators(path.join(this.docsPath, lang, dirSignature));
    }

    /**
     * Checks if a directory has any configuration files worth archiving.
     * 
     * Scans all override types (locales, order, collapsed, hidden) to determine
     * if the directory contains any configuration data. Only directories with
     * actual configuration content are considered for archival to avoid
     * creating empty archive entries.
     * 
     * @param {string} lang - Language code for configuration access
     * @param {string} dirSignature - Directory signature to check
     * @returns {Promise<boolean>} Promise resolving to true if configuration files exist
     * @since 1.0.0
     * @private
     */
    private async hasAnyConfigFiles(lang: string, dirSignature: string): Promise<boolean> {
        const overrideTypes: JsonOverrideFileType[] = ['locales', 'order', 'collapsed', 'hidden'];
        for (const type of overrideTypes) {
            try {
                const data = await this.jsonFileHandler.readJsonFile(type, lang, dirSignature);
                if (Object.keys(data).length > 0) {
                    return true;
                }
            } catch (error) {
            }
        }
        return false;
    }

    /**
     * Archives the complete configuration for a single directory.
     * 
     * Performs comprehensive archival of all configuration files and metadata
     * for a specific directory. Creates timestamp-based archive organization
     * and ensures both configuration data and metadata are preserved together
     * for complete context preservation.
     * 
     * The archival process:
     * 1. Generates timestamp-based archive directory name
     * 2. Processes all override types (locales, order, collapsed, hidden)
     * 3. Archives both JSON configuration data and metadata
     * 4. Deletes original files after successful archival
     * 5. Maintains proper directory structure in archive
     * 
     * @param {string} lang - Language code for configuration organization
     * @param {string} dirSignature - Directory signature to archive
     * @returns {Promise<void>} Promise resolving when archival completes
     * @since 1.0.0
     * @private
     * @example
     * ```typescript
     * // This method is called internally by archiveOutdatedDirectories
     * await this.archiveEntireDirectory('en', 'guide/removed-section');
     * ```
     */
    private async archiveEntireDirectory(lang: string, dirSignature: string): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveDirName = `${path.basename(dirSignature)}_removed_${timestamp}`;
        const archiveDirParent = path.dirname(dirSignature);
        
        const targetDirSignature = normalizePathSeparators(path.join(archiveDirParent, archiveDirName));

        const overrideTypes: JsonOverrideFileType[] = ['locales', 'order', 'collapsed', 'hidden'];
        let hasArchivedAnyFile = false;

        for (const type of overrideTypes) {
            try {
                const sourceData = await this.jsonFileHandler.readJsonFile(type, lang, dirSignature);
                const sourceMetadata = await this.metadataManager.readMetadata(type, lang, dirSignature);

                if (Object.keys(sourceData).length > 0 || Object.keys(sourceMetadata).length > 0) {
                    await this.jsonFileHandler.writeJsonFileToArchive(type, lang, targetDirSignature, sourceData, this.archivePath);
                    await this.metadataManager.writeMetadataToArchive(type, lang, targetDirSignature, sourceMetadata, this.archivePath);

                    await this.jsonFileHandler.deleteJsonFile(type, lang, dirSignature);
                    await this.metadataManager.deleteMetadata(type, lang, dirSignature);

                    hasArchivedAnyFile = true;
                }
            } catch (error) {
            }
        }

        if (hasArchivedAnyFile) {
        }
    }
} 