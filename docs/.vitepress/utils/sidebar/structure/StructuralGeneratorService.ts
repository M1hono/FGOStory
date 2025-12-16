/**
 * @fileoverview Main structural generator service for sidebar creation.
 * 
 * This module provides the central service responsible for generating the complete
 * sidebar item structure for individual sidebar root views. It orchestrates the
 * entire process including configuration resolution, recursive directory processing,
 * file handling, group extraction, depth management, and hierarchical organization.
 * 
 * @module StructuralGeneratorService
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { SidebarItem, EffectiveDirConfig, FileConfig, GroupConfig, ExternalLinkConfig } from '../types';
import { ConfigReaderService } from '../config';
import { FileSystem } from '../shared/FileSystem';
import { normalizePathSeparators } from '../shared/objectUtils';
import { ItemProcessorFunction, RecursiveViewGeneratorFunction } from './groupProcessor';
import { processItem } from './itemProcessor';
import { sortItems } from './itemSorter';

/**
 * Service responsible for generating hierarchical sidebar item structures.
 * 
 * The StructuralGeneratorService coordinates the entire sidebar generation process
 * for individual sidebar root views. It manages recursive directory processing,
 * configuration resolution, file handling, group extraction, external link
 * processing, and hierarchical organization while respecting depth limits,
 * visibility settings, and ordering configurations.
 * 
 * @class StructuralGeneratorService
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const service = new StructuralGeneratorService(
 *   '/docs',
 *   configReader,
 *   fileSystem,
 *   gitBookExclusions
 * );
 * 
 * const sidebarItems = await service.generateSidebarView(
 *   '/docs/en/guide',
 *   effectiveConfig,
 *   'en',
 *   0,
 *   false
 * );
 * ```
 */
export class StructuralGeneratorService {
    private readonly configReader: ConfigReaderService;
    private readonly fs: FileSystem;
    private readonly globalGitBookExclusionList: string[];
    private readonly docsPath: string;

    /**
     * Creates an instance of StructuralGeneratorService.
     * 
     * Initializes the service with necessary dependencies for sidebar generation.
     * All paths are normalized for cross-platform compatibility during construction.
     * 
     * @param {string} docsPath - Absolute path to the /docs directory
     * @param {ConfigReaderService} configReader - Instance for reading directory configurations
     * @param {FileSystem} fileSystem - File system interface for file operations
     * @param {string[]} [globalGitBookExclusionList=[]] - Array of absolute paths to GitBook directories to exclude
     * @since 1.0.0
     */
    constructor(
        docsPath: string,
        configReader: ConfigReaderService, 
        fileSystem: FileSystem, // Or remove if using direct fs
        globalGitBookExclusionList: string[] = []
    ) {
        this.docsPath = normalizePathSeparators(docsPath);
        this.configReader = configReader;
        this.fs = fileSystem; 
        this.globalGitBookExclusionList = globalGitBookExclusionList.map(p => normalizePathSeparators(p));
    }

    /**
     * Checks if an absolute path is within any globally excluded GitBook directories.
     * 
     * Determines whether a given path falls within any of the configured GitBook
     * exclusion directories by comparing normalized paths. Used to filter out
     * GitBook-specific content that should not appear in generated sidebars.
     * 
     * @param {string} absPath - The absolute path to check for exclusion
     * @returns {boolean} True if the path is excluded, false otherwise
     * @since 1.0.0
     * @private
     */
    private isGitBookExcluded(absPath: string): boolean {
        const normalizedAbsPath = normalizePathSeparators(absPath);
        return this.globalGitBookExclusionList.some(excludedPath => 
            normalizedAbsPath === excludedPath || normalizedAbsPath.startsWith(excludedPath + '/')
        );
    }

    /**
     * Validates and processes external links from configuration.
     * 
     * Converts external link configurations into valid SidebarItems while
     * performing validation on URLs, text content, and visibility settings.
     * Generates unique keys for external links and filters out invalid
     * or hidden entries.
     * 
     * @param {ExternalLinkConfig[]} externalLinks - Array of external link configurations
     * @param {string} baseRelativePathKey - Base relative path for generating unique keys
     * @returns {SidebarItem[]} Array of valid SidebarItems for external links
     * @since 1.0.0
     * @private
     */
    private processExternalLinks(
        externalLinks: ExternalLinkConfig[],
        baseRelativePathKey: string
    ): SidebarItem[] {
        if (!externalLinks || externalLinks.length === 0) {
            return [];
        }

        const externalLinkItems: SidebarItem[] = [];

        for (const linkConfig of externalLinks) {
            if (linkConfig.hidden) {
                continue;
            }

            if (!linkConfig.text || !linkConfig.link) {
                console.warn('External link must have both text and link properties:', linkConfig);
                continue;
            }

            if (!linkConfig.link.startsWith('http://') && !linkConfig.link.startsWith('https://')) {
                console.warn('External link must start with http:// or https://:', linkConfig.link);
                continue;
            }

            const linkKey = `external:${linkConfig.text}`;
            const relativePathKey = baseRelativePathKey ? `${baseRelativePathKey}${linkKey}` : linkKey;

            const externalLinkItem: SidebarItem = {
                text: linkConfig.text,
                link: linkConfig.link,
                _priority: linkConfig.priority ?? 0,
                _relativePathKey: relativePathKey,
                _hidden: linkConfig.hidden ?? false,
                _isDirectory: false,
                _isRoot: false,
            };

            externalLinkItems.push(externalLinkItem);
        }

        return externalLinkItems;
    }

    /**
     * Generates flattened content for a root directory.
     * 
     * Creates a single root section that contains all subdirectory content
     * flattened into a unified hierarchy instead of separate top-level items.
     * This approach is used for root directories to create cleaner sidebar
     * structures with better organization and navigation flow.
     * 
     * @param {string} rootContentPath - Absolute path to the root directory
     * @param {EffectiveDirConfig} rootConfig - The effective configuration for the root directory
     * @param {string} lang - Current language code
     * @param {boolean} isDevMode - Boolean indicating if running in development mode
     * @returns {Promise<SidebarItem>} Promise resolving to a single SidebarItem with all content flattened
     * @since 1.0.0
     * @private
     */
    private async generateRootSectionWithFlattenedContent(
        rootContentPath: string,
        rootConfig: EffectiveDirConfig,
        lang: string,
        isDevMode: boolean
    ): Promise<SidebarItem> {
        const normalizedRootPath = normalizePathSeparators(rootContentPath);
        
        const rootSection: SidebarItem = {
            text: rootConfig.title || "Untitled",
            items: [],
            collapsed: rootConfig.collapsed,
            _priority: rootConfig.priority,
            _relativePathKey: "",
            _isDirectory: true,
            _isRoot: true,
            _hidden: rootConfig.hidden || false
        };

        let entries: { name: string; path: string; dirent?: any; isDirectory(): boolean; isFile(): boolean; }[] = [];
        try {
            const dirents = await this.fs.readDir(normalizedRootPath); 
            entries = dirents.map(d => ({ 
                name: d.name, 
                path: path.join(normalizedRootPath, d.name),
                dirent: d,
                isDirectory: () => d.isDirectory(), 
                isFile: () => d.isFile()
            }));
        } catch (error: any) {
        }

        const flattenedContent = await this.flattenDirectoryContent(
            entries,
            normalizedRootPath,
            rootConfig,
            lang,
            0,
            isDevMode
        );

        const externalLinkItems = this.processExternalLinks(
            rootConfig.externalLinks || [],
            rootConfig._baseRelativePathForChildren ?? ""
        );

        const allContent = [...flattenedContent, ...externalLinkItems];

        const sortedContent = sortItems(allContent, rootConfig.itemOrder);

        rootSection.items = sortedContent;
        return rootSection;
    }

    /**
     * Recursively flattens content from directories and files into a single array.
     * 
     * Processes directory entries to create a flattened hierarchy where content
     * from nested directories is promoted to create cleaner navigation structures.
     * Handles both files and directories, respects configuration settings,
     * manages depth limits, and maintains proper hierarchical relationships.
     * 
     * @param {Array} entries - Array of directory entries to process
     * @param {string} currentPath - Current directory path being processed
     * @param {EffectiveDirConfig} parentConfig - Configuration from parent directory
     * @param {string} lang - Current language code
     * @param {number} currentDepth - Current recursion depth
     * @param {boolean} isDevMode - Boolean indicating if running in development mode
     * @returns {Promise<SidebarItem[]>} Promise resolving to an array of flattened SidebarItems
     * @since 1.0.0
     * @private
     */
    private async flattenDirectoryContent(
        entries: { name: string; path: string; isDirectory(): boolean; isFile(): boolean; }[],
        currentPath: string,
        parentConfig: EffectiveDirConfig,
        lang: string,
        currentDepth: number,
        isDevMode: boolean
    ): Promise<SidebarItem[]> {
        const flattenedItems: SidebarItem[] = [];
        const baseRelativePathKey = parentConfig._baseRelativePathForChildren ?? "";

        for (const entry of entries) {
            const itemAbsPath = normalizePathSeparators(entry.path);
            
            if (this.isGitBookExcluded(itemAbsPath)) {
                continue;
            }

            if (entry.isFile()) {
                if (entry.name.toLowerCase() === "index.md") {
                    continue;
                }

                const fileItem = await processItem(
                    entry.name,
                    itemAbsPath,
                    false,
                    parentConfig,
                    lang,
                    currentDepth,
                    isDevMode,
                    this.configReader,
                    this.fs,
                    this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction,
                    this.globalGitBookExclusionList,
                    this.docsPath
                );

                if (fileItem) {
                    flattenedItems.push(fileItem);
                }
            } else {
                const dirIndexPath = path.join(itemAbsPath, "index.md");
                const dirEffectiveConfig = await this.configReader.getEffectiveConfig(
                    dirIndexPath,
                    lang,
                    isDevMode
                );

                if (dirEffectiveConfig.hidden) {
                    continue;
                }

                if (dirEffectiveConfig.root && currentDepth > 0) {
                    const rootLinkItem = await processItem(
                        entry.name,
                        itemAbsPath,
                        true, // isDir
                        parentConfig,
                        lang,
                        currentDepth,
                        isDevMode,
                        this.configReader,
                        this.fs,
                        this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction,
                        this.globalGitBookExclusionList,
                        this.docsPath
                    );

                    if (rootLinkItem) {
                        flattenedItems.push(rootLinkItem);
                    }
                    continue;
                }

                // Get subdirectory entries to check content
                    let subEntries: { name: string; path: string; isDirectory(): boolean; isFile(): boolean; }[] = [];
                let hasMarkdownFiles = false;
                let hasSubdirectories = false;
                
                try {
                        const subDirents = await this.fs.readDir(itemAbsPath);
                        
                        subEntries = subDirents.map(d => ({
                            name: d.name,
                            path: path.join(itemAbsPath, d.name),
                            isDirectory: () => d.isDirectory(),
                            isFile: () => d.isFile()
                        }));

                    // Check what type of content this directory has
                    for (const subEntry of subEntries) {
                        if (subEntry.isFile() && subEntry.name.toLowerCase().endsWith('.md') && subEntry.name.toLowerCase() !== 'index.md') {
                            hasMarkdownFiles = true;
                        }
                        if (subEntry.isDirectory()) {
                            hasSubdirectories = true;
                        }
                    }
                    } catch (error: any) {
                        if (error.code !== 'ENOENT') {
                        console.warn(`Could not read directory ${itemAbsPath}:`, error.message);
                        }
                        continue;
                    }

                // For file-only directories (like flandre/), always create a directory item
                // This ensures RecursiveSynchronizer can generate JSON configs for them
                if (hasMarkdownFiles && !hasSubdirectories) {
                    
                    // Process all markdown files in this directory
                    const dirRelativeKey = baseRelativePathKey ? `${baseRelativePathKey}${entry.name}/` : `${entry.name}/`;
                    const dirConfigForFiles = {
                        ...dirEffectiveConfig,
                        _baseRelativePathForChildren: dirRelativeKey
                    };

                    const fileItems: SidebarItem[] = [];
                    for (const subEntry of subEntries) {
                        if (subEntry.isFile() && subEntry.name.toLowerCase().endsWith('.md') && subEntry.name.toLowerCase() !== 'index.md') {
                            const fileItem = await processItem(
                                subEntry.name,
                                subEntry.path,
                                false, // isDir
                                dirConfigForFiles,
                                lang,
                                currentDepth + 1,
                                isDevMode,
                                this.configReader,
                                this.fs,
                                this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction,
                                this.globalGitBookExclusionList,
                                this.docsPath
                            );
                            if (fileItem) {
                                fileItems.push(fileItem);
                            }
                        }
                    }

                    // Create the directory item with the files as children
                    const directoryItem = await processItem(
                        entry.name,
                        itemAbsPath,
                        true, // isDir
                        parentConfig,
                        lang,
                        currentDepth,
                        isDevMode,
                        this.configReader,
                        this.fs,
                        this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction,
                        this.globalGitBookExclusionList,
                        this.docsPath
                    );

                    if (directoryItem) {
                        directoryItem.items = fileItems.length > 0 ? fileItems : undefined;
                        flattenedItems.push(directoryItem);
                    }
                    continue;
                }

                // For regular directories (with subdirectories), check if we should continue based on maxDepth
                // dirEffectiveConfig.maxDepth already includes proper inheritance:
                // - If directory has own maxDepth config, uses that
                // - If directory doesn't have own config, inherits from parent/global
                if (currentDepth < dirEffectiveConfig.maxDepth) {
                    
                    // Create directory config for flattening
                    const dirRelativeKey = baseRelativePathKey ? `${baseRelativePathKey}${entry.name}/` : `${entry.name}/`;
                    const dirConfigForFlattening = {
                        ...dirEffectiveConfig,
                        _baseRelativePathForChildren: dirRelativeKey
                    };

                    // Recursively process subdirectory content
                    const subContent = await this.flattenDirectoryContent(
                        subEntries,
                        itemAbsPath,
                        dirConfigForFlattening,
                        lang,
                        currentDepth + 1,
                        isDevMode
                    );

                    // Create directory item - ALWAYS create it for directories with subdirectories
                    // This ensures proper hierarchical structure even if subdirectories return no visible items
                    
                    const directoryItem = await processItem(
                        entry.name,
                        itemAbsPath,
                        true, // isDir
                        parentConfig,
                        lang,
                        currentDepth,
                        isDevMode,
                        this.configReader,
                        this.fs,
                        this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction,
                        this.globalGitBookExclusionList,
                        this.docsPath
                    );

                    if (directoryItem) {
                        // Set nested content as children - this creates proper hierarchy
                        directoryItem.items = subContent.length > 0 ? subContent : undefined;
                        flattenedItems.push(directoryItem);
                    }
                } else {
                    // At max depth, just add the directory as a link-only item if linkable
                    const directoryItem = await processItem(
                        entry.name,
                        itemAbsPath,
                        true, // isDir
                        parentConfig,
                        lang,
                        currentDepth,
                        isDevMode,
                        this.configReader,
                        this.fs,
                        this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction,
                        this.globalGitBookExclusionList,
                        this.docsPath
                    );

                    if (directoryItem) {
                        flattenedItems.push(directoryItem);
                    }
                }
            }
        }

        return flattenedItems;
    }

    /**
     * Generates the complete SidebarItem array for a single sidebar root view.
     * 
     * This is the main public method that orchestrates the entire sidebar generation
     * process for a specific directory path. It handles root directory processing
     * with content flattening, regular directory processing with groups, file
     * processing, external links, and hierarchical organization. The method is
     * recursive for subdirectories that are not new roots themselves.
     * 
     * @param {string} currentContentPath - Absolute path to the directory currently being processed
     * @param {EffectiveDirConfig} effectiveConfigForThisView - The effective configuration governing this view
     * @param {string} lang - Current language code
     * @param {number} currentLevelDepth - Internal 0-indexed recursion depth for items within this view
     * @param {boolean} isDevMode - Boolean indicating if running in development mode (for draft status)
     * @returns {Promise<SidebarItem[]>} Promise resolving to an array of SidebarItem objects for the current path
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const sidebarItems = await service.generateSidebarView(
     *   '/docs/en/guide',
     *   effectiveConfig,
     *   'en',
     *   0,
     *   false
     * );
     * ```
     */
    public async generateSidebarView(
        currentContentPath: string,
        effectiveConfigForThisView: EffectiveDirConfig, 
        lang: string,
        currentLevelDepth: number, 
        isDevMode: boolean
    ): Promise<SidebarItem[]> {
        const normalizedCurrentContentPath = normalizePathSeparators(currentContentPath);
        
        const isRootDirectoryProcessing = currentLevelDepth === 0 && effectiveConfigForThisView.root;
        
        if (isRootDirectoryProcessing) {
            const rootSection = await this.generateRootSectionWithFlattenedContent(
                normalizedCurrentContentPath,
                effectiveConfigForThisView,
                lang,
                isDevMode
            );
            
            return [rootSection];
        }

        const generatedItems: SidebarItem[] = [];
        
        const baseRelativePathKeyForChildrenInThisScope = effectiveConfigForThisView._baseRelativePathForChildren ?? '';
        
        const currentScopeConfigWithBaseKey: EffectiveDirConfig = {
            ...effectiveConfigForThisView,
            _baseRelativePathForChildren: baseRelativePathKeyForChildrenInThisScope
        };

        let entries: { name: string; path: string; dirent?: any; isDirectory(): boolean; isFile(): boolean; }[] = [];
        
        try {
            const dirents = await this.fs.readDir(normalizedCurrentContentPath); 
            entries = dirents.map(d => ({ 
                name: d.name, 
                path: path.join(normalizedCurrentContentPath, d.name),
                dirent: d,
                isDirectory: () => d.isDirectory(), 
                isFile: () => d.isFile()
            }));
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.warn(`Could not read directory ${normalizedCurrentContentPath}:`, error.message);
            }
        }

        for (const entry of entries) {
            const itemAbsPath = normalizePathSeparators(entry.path);
            
            // Skip GitBook excluded paths
            if (this.isGitBookExcluded(itemAbsPath)) {
                continue;
            }
            
            const item = await processItem(
                entry.name,
                itemAbsPath,
                entry.isDirectory(),
                currentScopeConfigWithBaseKey,
                lang,
                currentLevelDepth, 
                isDevMode,
                this.configReader,
                this.fs,
                this.generateSidebarView.bind(this) as RecursiveViewGeneratorFunction, 
                this.globalGitBookExclusionList,
                this.docsPath
            );

            if (item) {
                generatedItems.push(item);
            }
        }

        // 2. External Links Processing
        const externalLinkItems = this.processExternalLinks(
            effectiveConfigForThisView.externalLinks || [],
            baseRelativePathKeyForChildrenInThisScope
        );
        
        // Combine file/directory items with external links
        const allItems = [...generatedItems, ...externalLinkItems];

        // 3. Sorting
        const sortedItems = sortItems(allItems, currentScopeConfigWithBaseKey.itemOrder);
        
        return sortedItems;
    }
} 

