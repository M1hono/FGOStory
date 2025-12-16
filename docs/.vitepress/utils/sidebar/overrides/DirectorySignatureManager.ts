/**
 * @fileoverview Directory signature management for JSON configuration synchronization.
 * 
 * This module provides comprehensive directory signature management capabilities
 * for JSON configuration synchronization. It handles active signature collection,
 * outdated directory identification, and physical directory validation while
 * maintaining accurate mappings between sidebar structures and configuration files.
 * 
 * @module DirectorySignatureManager
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { SidebarItem } from '../types';
import { normalizePathSeparators } from '../shared/objectUtils';
import { FileSystem } from '../shared/FileSystem';
import { PathKeyProcessor } from './PathKeyProcessor';

/**
 * Advanced directory signature manager for JSON configuration synchronization.
 * 
 * Provides comprehensive management of directory signatures used in JSON
 * configuration synchronization. Handles the mapping between sidebar structure
 * hierarchies and configuration file organization, including active signature
 * collection, outdated directory detection, and physical directory validation
 * with GitBook integration support.
 * 
 * Key capabilities:
 * - Active directory signature collection from sidebar structures
 * - Outdated directory identification and cleanup preparation
 * - Physical directory existence validation
 * - GitBook directory exclusion handling
 * - Recursive configuration directory discovery
 * - Cross-platform path handling and normalization
 * 
 * @class DirectorySignatureManager
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const signatureManager = new DirectorySignatureManager(fileSystem, '/docs');
 * 
 * // Collect active signatures from sidebar structure
 * const activeSignatures = new Set<string>();
 * signatureManager.collectActiveDirectorySignatures(
 *   sidebarItems,
 *   '_root',
 *   gitbookPaths,
 *   'en',
 *   '/docs',
 *   activeSignatures
 * );
 * 
 * // Identify outdated configuration directories
 * const outdatedDirs = await signatureManager.identifyOutdatedDirectories(
 *   '_root',
 *   'en',
 *   activeSignatures
 * );
 * ```
 */
export class DirectorySignatureManager {
    private pathProcessor: PathKeyProcessor;
    private fs: FileSystem;
    private docsPath: string;

    /**
     * Creates an instance of DirectorySignatureManager.
     * 
     * Initializes the signature manager with file system access and document
     * path configuration. Sets up the path processor for relative key handling
     * and establishes the base directory for signature operations.
     * 
     * @param {FileSystem} fs - File system interface for directory operations
     * @param {string} docsPath - Absolute path to the docs directory
     * @since 1.0.0
     * @example
     * ```typescript
     * const manager = new DirectorySignatureManager(
     *   new NodeFileSystem(),
     *   '/docs'
     * );
     * ```
     */
    constructor(fs: FileSystem, docsPath: string) {
        this.fs = fs;
        this.docsPath = docsPath;
        this.pathProcessor = new PathKeyProcessor();
    }

    /**
     * Collects all active directory signatures from the current sidebar structure.
     * 
     * Recursively traverses the sidebar item hierarchy to identify all directories
     * that should have corresponding JSON configuration files. Excludes GitBook
     * directories and handles nested structures with proper signature generation.
     * Essential for determining which configuration directories are still needed.
     * 
     * The collection process:
     * 1. Adds the current directory signature to active set
     * 2. Iterates through all sidebar items looking for directories
     * 3. Extracts relative keys and constructs proper signatures
     * 4. Excludes GitBook directories from collection
     * 5. Recursively processes nested directory structures
     * 
     * @param {SidebarItem[]} items - Sidebar items to process for signature collection
     * @param {string} currentDirSignature - Current directory signature context
     * @param {string[]} gitbookPaths - Array of GitBook directory paths to exclude
     * @param {string} lang - Language code for path construction
     * @param {string} absDocsPath - Absolute path to docs directory
     * @param {Set<string>} activeSignatures - Set to populate with active signatures
     * @returns {void} Modifies the activeSignatures set in place
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const activeSignatures = new Set<string>();
     * manager.collectActiveDirectorySignatures(
     *   sidebarItems,
     *   '_root',
     *   ['/docs/en/gitbook-dir'],
     *   'en',
     *   '/docs',
     *   activeSignatures
     * );
     * 
     * console.log([...activeSignatures]); // ['_root', 'guide', 'guide/concepts', ...]
     * ```
     */
    public collectActiveDirectorySignatures(
        items: SidebarItem[],
        currentDirSignature: string,
        gitbookPaths: string[],
        lang: string,
        absDocsPath: string,
        activeSignatures: Set<string>
    ): void {
        activeSignatures.add(currentDirSignature);
        
        for (const item of items) {
            if (item._isDirectory || (item.items && item.items.length > 0)) {
                const itemKeyPart = this.pathProcessor.extractRelativeKeyForCurrentDir(item, currentDirSignature);
                const nextDirSignature = currentDirSignature === '_root' 
                    ? itemKeyPart 
                    : normalizePathSeparators(path.join(currentDirSignature, itemKeyPart));
                
                if (!this.pathProcessor.isGitBookRoot(nextDirSignature, lang, gitbookPaths, absDocsPath)) {
                    activeSignatures.add(nextDirSignature);
                    
                    if (item.items && item.items.length > 0) {
                        this.collectActiveDirectorySignatures(item.items, nextDirSignature, gitbookPaths, lang, absDocsPath, activeSignatures);
                    }
                }
            }
        }
    }

    /**
     * Gets all JSON configuration directories under a specified path.
     * 
     * Scans the provided base path for subdirectories that could contain
     * JSON configuration files. Excludes hidden directories (starting with '.')
     * and returns a clean list of directory names for further processing.
     * 
     * @param {string} basePath - Base path to scan for JSON configuration directories
     * @returns {Promise<string[]>} Promise resolving to array of directory names
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const jsonDirs = await manager.getAllJsonDirectories(
     *   '/docs/.vitepress/config/sidebar/en'
     * );
     * // Returns: ['guide', 'api', 'tutorials']
     * ```
     */
    public async getAllJsonDirectories(basePath: string): Promise<string[]> {
        try {
            const entries = await this.fs.readDir(basePath);
            const directories: string[] = [];
            
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    directories.push(entry.name);
                }
            }
            
            return directories;
        } catch (error) {
            return [];
        }
    }

    /**
     * Identifies outdated configuration directories for cleanup.
     * 
     * Performs conservative identification of configuration directories that
     * are no longer needed by checking if their corresponding physical
     * directories still exist in the file system. Only marks directories
     * as outdated when the source content has been completely removed.
     * 
     * The identification process:
     * 1. Discovers all existing configuration directories
     * 2. Maps each configuration directory to its physical source location
     * 3. Checks physical directory existence in the file system
     * 4. Marks configuration directories as outdated only when source is gone
     * 5. Returns conservative list to prevent accidental data loss
     * 
     * @param {string} rootDirSignature - Root directory signature to start search from
     * @param {string} lang - Language code for path construction
     * @param {Set<string>} activeDirectorySignatures - Set of currently active signatures
     * @returns {Promise<string[]>} Promise resolving to array of outdated directory signatures
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const outdatedDirs = await manager.identifyOutdatedDirectories(
     *   '_root',
     *   'en',
     *   activeSignatures
     * );
     * // Returns: ['old-guide', 'deprecated/features'] (only if physical dirs are gone)
     * ```
     */
    public async identifyOutdatedDirectories(
        rootDirSignature: string,
        lang: string,
        activeDirectorySignatures: Set<string>
    ): Promise<string[]> {
        try {
            const langConfigPath = path.join(this.docsPath, '..', '.vitepress', 'config', 'sidebar', lang);
            const outdatedDirs: string[] = [];
            
            const allConfigDirs = await this.findAllConfigDirectories(langConfigPath, rootDirSignature);
            
            for (const configDir of allConfigDirs) {
                const physicalDirPath = this.getPhysicalDirPath(configDir, lang);
                const physicalExists = await this.fs.exists(physicalDirPath);
                
                if (!physicalExists) {
                    outdatedDirs.push(configDir);
                }
            }
            
            return outdatedDirs;
        } catch (error) {
            console.error('Error identifying outdated directories:', error);
            return [];
        }
    }

    /**
     * Recursively finds all directories containing configuration files.
     * 
     * Initiates a recursive search through the configuration directory
     * structure to identify all directories that contain JSON configuration
     * files. This is used for comprehensive directory discovery during
     * cleanup and maintenance operations.
     * 
     * @param {string} basePath - Base path to start recursive search from
     * @param {string} rootSignature - Root signature for path construction
     * @returns {Promise<string[]>} Promise resolving to array of configuration directory signatures
     * @since 1.0.0
     * @private
     */
    private async findAllConfigDirectories(basePath: string, rootSignature: string): Promise<string[]> {
        const configDirs: string[] = [];
        
        try {
            await this.findConfigDirectoriesRecursive(basePath, rootSignature, configDirs);
        } catch (error) {
        }
        
        return configDirs;
    }

    /**
     * Recursively searches for directories containing configuration files.
     * 
     * Performs depth-first traversal of the directory structure to identify
     * all directories that contain JSON configuration files. Constructs
     * proper directory signatures and handles nested directory structures
     * while avoiding hidden directories.
     * 
     * @param {string} currentPath - Current file system path being processed
     * @param {string} currentSignature - Current directory signature being constructed
     * @param {string[]} results - Array to accumulate discovered configuration directories
     * @returns {Promise<void>} Promise resolving when recursive search completes
     * @since 1.0.0
     * @private
     */
    private async findConfigDirectoriesRecursive(
        currentPath: string,
        currentSignature: string,
        results: string[]
    ): Promise<void> {
        try {
            if (await this.hasConfigFiles(currentPath)) {
                results.push(currentSignature);
            }
            
            const entries = await this.fs.readDir(currentPath);
            
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const childPath = path.join(currentPath, entry.name);
                    const childSignature = currentSignature === '_root' 
                        ? entry.name 
                        : normalizePathSeparators(path.join(currentSignature, entry.name));
                    
                    await this.findConfigDirectoriesRecursive(childPath, childSignature, results);
                }
            }
        } catch (error) {
        }
    }

    /**
     * Checks if a directory contains any JSON configuration files.
     * 
     * Scans a directory for the presence of known JSON configuration files
     * (locales.json, order.json, collapsed.json, hidden.json). Returns true
     * if any configuration files are found, indicating this is an active
     * configuration directory.
     * 
     * @param {string} dirPath - Directory path to check for configuration files
     * @returns {Promise<boolean>} Promise resolving to true if configuration files exist
     * @since 1.0.0
     * @private
     * @example
     * ```typescript
     * const hasConfigs = await this.hasConfigFiles('/config/sidebar/en/guide');
     * // Returns: true if any of locales.json, order.json, etc. exist
     * ```
     */
    private async hasConfigFiles(dirPath: string): Promise<boolean> {
        const configFiles = ['locales.json', 'order.json', 'collapsed.json', 'hidden.json'];
        
        for (const configFile of configFiles) {
            try {
                const filePath = path.join(dirPath, configFile);
                if (await this.fs.exists(filePath)) {
                    return true;
                }
            } catch (error) {
            }
        }
        
        return false;
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
     * @example
     * ```typescript
     * const path1 = this.getPhysicalDirPath('_root', 'en');
     * // Returns: '/docs/en'
     * 
     * const path2 = this.getPhysicalDirPath('guide/concepts', 'en');
     * // Returns: '/docs/en/guide/concepts'
     * ```
     */
    private getPhysicalDirPath(dirSignature: string, lang: string): string {
        if (dirSignature === '_root') {
            return normalizePathSeparators(path.join(this.docsPath, lang));
        }
        return normalizePathSeparators(path.join(this.docsPath, lang, dirSignature));
    }
} 

