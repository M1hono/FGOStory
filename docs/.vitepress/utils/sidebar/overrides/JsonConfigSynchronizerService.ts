/**
 * @fileoverview Main JSON configuration synchronization service orchestrator.
 * 
 * This module provides the primary orchestration service for JSON configuration
 * synchronization across sidebar structures. It coordinates multiple specialized
 * services to handle directory signatures, archival, cleanup, and recursive
 * synchronization while maintaining GitBook compatibility and user customization
 * preservation.
 * 
 * @module JsonConfigSynchronizerService
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import {
    SidebarItem,
    JsonFileMetadata,
} from '../types';
import { FileSystem } from '../shared/FileSystem';
import { normalizePathSeparators, sanitizeTitleForPath } from '../shared/objectUtils';
import { JsonFileHandler, JsonOverrideFileType } from './JsonFileHandler';
import { MetadataManager } from './MetadataManager';
import { SyncEngine } from './SyncEngine';
import { JsonItemSorter } from './JsonItemSorter';
import { PathKeyProcessor } from './PathKeyProcessor';
import { DirectorySignatureManager } from './DirectorySignatureManager';
import { DirectoryArchiveService } from './DirectoryArchiveService';
import { DirectoryCleanupService } from './DirectoryCleanupService';
import { RecursiveSynchronizer } from './RecursiveSynchronizer';

/**
 * Primary orchestration service for JSON configuration synchronization.
 * 
 * Coordinates the complete JSON configuration synchronization process by
 * orchestrating multiple specialized services. Handles the full lifecycle
 * of synchronization including directory signature management, archival
 * of outdated configurations, cleanup operations, and recursive processing
 * while preserving user customizations and maintaining GitBook compatibility.
 * 
 * Key responsibilities:
 * - Service orchestration and dependency injection
 * - GitBook integration and exclusion handling
 * - Directory signature management and active tracking
 * - Outdated configuration identification and cleanup
 * - Recursive synchronization coordination
 * - User customization preservation throughout the process
 * 
 * @class JsonConfigSynchronizerService
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const synchronizer = new JsonConfigSynchronizerService('/docs', fileSystem);
 * 
 * const synchronizedItems = await synchronizer.synchronize(
 *   '/en/guide/',
 *   sidebarItems,
 *   'en',
 *   false,
 *   gitbookPaths
 * );
 * ```
 */
export class JsonConfigSynchronizerService {
    private readonly docsPath: string;
    private readonly absDocsPath: string;

    private jsonFileHandler: JsonFileHandler;
    private metadataManager: MetadataManager;
    private syncEngine: SyncEngine;
    private jsonItemSorter: JsonItemSorter;

    private pathProcessor: PathKeyProcessor;
    private directorySignatureManager: DirectorySignatureManager;
    private archiveService: DirectoryArchiveService;
    private cleanupService: DirectoryCleanupService;
    private recursiveSynchronizer: RecursiveSynchronizer;

    /**
     * Creates an instance of JsonConfigSynchronizerService.
     * 
     * Initializes the synchronization service with comprehensive dependency
     * injection and service coordination. Sets up all specialized services
     * with proper configuration paths and shared dependencies for seamless
     * operation across the synchronization process.
     * 
     * @param {string} docsPath - Absolute path to the docs directory
     * @param {FileSystem} fs - File system interface for all file operations
     * @since 1.0.0
     * @example
     * ```typescript
     * const synchronizer = new JsonConfigSynchronizerService(
     *   '/docs',
     *   new NodeFileSystem()
     * );
     * ```
     */
    constructor(docsPath: string, fs: FileSystem) {
        this.absDocsPath = normalizePathSeparators(docsPath);
        this.docsPath = normalizePathSeparators(docsPath);
        
        const baseOverridesPath = normalizePathSeparators(path.join(this.docsPath, '..', '.vitepress', 'config', 'sidebar'));
        const metadataStorageBasePath = normalizePathSeparators(path.join(baseOverridesPath, '.metadata'));

        this.jsonFileHandler = new JsonFileHandler(fs, baseOverridesPath);
        this.metadataManager = new MetadataManager(fs, metadataStorageBasePath);
        this.syncEngine = new SyncEngine(); 
        this.jsonItemSorter = new JsonItemSorter();

        this.pathProcessor = new PathKeyProcessor();
        this.directorySignatureManager = new DirectorySignatureManager(fs, this.docsPath);
        this.archiveService = new DirectoryArchiveService(this.jsonFileHandler, this.metadataManager, fs, this.docsPath);
        this.cleanupService = new DirectoryCleanupService(this.jsonFileHandler, this.metadataManager, fs, this.docsPath);
        this.recursiveSynchronizer = new RecursiveSynchronizer(
            this.jsonFileHandler,
            this.metadataManager,
            this.syncEngine,
            this.jsonItemSorter,
            this.absDocsPath
        );
    }

    /**
     * Synchronizes an entire sidebar tree with JSON configuration files.
     * 
     * Orchestrates the complete synchronization process for a sidebar tree,
     * including GitBook detection, directory signature management, cleanup
     * operations, and recursive processing. Preserves user customizations
     * while ensuring configuration files remain synchronized with the
     * current sidebar structure.
     * 
     * The synchronization process:
     * 1. Validates input and performs GitBook exclusion check
     * 2. Collects active directory signatures from sidebar structure
     * 3. Identifies and processes outdated configuration directories
     * 4. Archives directories with user modifications
     * 5. Cleans up directories with only system-generated content
     * 6. Performs recursive synchronization of all items
     * 7. Reapplies migrated values for final consistency
     * 
     * @param {string} rootPathKey - Root path key for the sidebar (e.g., '/en/guide/')
     * @param {SidebarItem[]} sidebarTreeInput - Array of sidebar items to synchronize
     * @param {string} lang - Language code for configuration organization
     * @param {boolean} isDevMode - Whether running in development mode
     * @param {string[]} langGitbookPaths - Array of GitBook paths to exclude from processing
     * @returns {Promise<SidebarItem[]>} Promise resolving to synchronized sidebar items
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const synchronizedTree = await synchronizer.synchronize(
     *   '/en/guide/',
     *   [
     *     { text: 'Introduction', link: '/en/guide/intro' },
     *     { text: 'Concepts', items: [...] }
     *   ],
     *   'en',
     *   false,
     *   ['/docs/en/gitbook-section']
     * );
     * 
     * // Returns: Sidebar items with applied JSON configurations
     * ```
     */
    public async synchronize(
        rootPathKey: string,
        sidebarTreeInput: SidebarItem[], 
        lang: string, 
        isDevMode: boolean,
        langGitbookPaths: string[]
    ): Promise<SidebarItem[]> {
        if (!Array.isArray(sidebarTreeInput)) {
            return []; 
        }

        const rootConfigDirectorySignature = this.pathProcessor.getSignatureForRootView(rootPathKey, lang);
        
        const normalizedGitbookPaths = langGitbookPaths.map(p => normalizePathSeparators(p));

        const isGitBook = this.pathProcessor.isGitBookRoot(rootConfigDirectorySignature, lang, normalizedGitbookPaths, this.absDocsPath);
        
        if (isGitBook) {
            return sidebarTreeInput;
        }

        const processedTree = sidebarTreeInput.map(item => JSON.parse(JSON.stringify(item))) as SidebarItem[];
        
        const activeDirectorySignatures = new Set<string>();
        this.directorySignatureManager.collectActiveDirectorySignatures(
            processedTree, 
            rootConfigDirectorySignature, 
            normalizedGitbookPaths, 
            lang, 
            this.absDocsPath, 
            activeDirectorySignatures
        );

        const outdatedDirs = await this.directorySignatureManager.identifyOutdatedDirectories(
            rootConfigDirectorySignature, 
            lang, 
            activeDirectorySignatures
        );

        await this.archiveService.archiveOutdatedDirectories(outdatedDirs, lang);

        await this.cleanupService.cleanupOutdatedDirectories(outdatedDirs, lang);
        
        await this.recursiveSynchronizer.synchronizeItemsRecursively(
            processedTree, 
            rootConfigDirectorySignature, 
            lang, 
            isDevMode, 
            normalizedGitbookPaths, 
            true
        );

        await this.recursiveSynchronizer.reapplyMigratedValues(
            processedTree, 
            rootConfigDirectorySignature, 
            lang, 
            normalizedGitbookPaths
        );
        
        return processedTree;
    }
} 

