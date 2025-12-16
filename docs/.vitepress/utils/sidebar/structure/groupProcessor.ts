/**
 * @fileoverview Group processing utilities for sidebar generation.
 * 
 * This module handles the extraction and processing of grouped content within
 * sidebar structures. Groups allow organizing related content from different
 * directories into separate, independent sidebar sections. This is particularly
 * useful for creating thematic groupings that transcend the physical directory
 * structure.
 * 
 * @module GroupProcessor
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { SidebarItem, GroupConfig, EffectiveDirConfig } from '../types';
import { FileSystem } from '../shared/FileSystem';
import { ConfigReaderService } from '../config';
import { generateLink } from './linkGenerator';
import { sortItems } from './itemSorter';
import { normalizePathSeparators } from '../shared/objectUtils';

/**
 * Type definition for item processing callback function.
 * Used for processing individual file system entries during sidebar generation.
 * 
 * @typedef {Function} ItemProcessorFunction
 * @since 1.0.0
 */
export type ItemProcessorFunction = (
    entryName: string,
    itemAbsPath: string,
    isDir: boolean,
    parentConfigForEntry: EffectiveDirConfig,
    lang: string,
    depthForEntry: number,
    isDevMode: boolean,
    configReader: ConfigReaderService,
    fs: FileSystem,
    recursiveGeneratorForSubDir: any,
    globalGitBookExclusionList: string[],
    docsAbsPath: string
) => Promise<SidebarItem | null>;

/**
 * Type definition for recursive sidebar view generation callback function.
 * Used for generating nested sidebar content recursively.
 * 
 * @typedef {Function} RecursiveViewGeneratorFunction
 * @since 1.0.0
 */
export type RecursiveViewGeneratorFunction = (
    contentPath: string,
    effectiveConfig: EffectiveDirConfig,
    lang: string,
    depth: number,
    isDevMode: boolean
) => Promise<SidebarItem[]>;

/**
 * Processes a group configuration and generates its standalone SidebarItem.
 * 
 * Creates an independent sidebar section that extracts content from the specified
 * path and organizes it under a group title. This allows content from nested
 * directories to be promoted to top-level sections for better organization.
 * 
 * @param {GroupConfig} groupConfig - Group configuration from frontmatter
 * @param {string} baseDirAbsPath - Absolute path of the directory defining this group
 * @param {EffectiveDirConfig} parentDirEffectiveConfig - Effective config of the parent directory
 * @param {string} lang - Current language code
 * @param {boolean} isDevMode - Whether running in development mode
 * @param {ConfigReaderService} configReader - Configuration reader service
 * @param {FileSystem} fs - File system interface
 * @param {RecursiveViewGeneratorFunction} recursiveViewGenerator - Function to generate nested content
 * @param {string[]} globalGitBookExclusionList - Paths to exclude from processing
 * @param {string} docsAbsPath - Absolute path to docs root
 * @returns {Promise<SidebarItem | null>} Promise resolving to a SidebarItem for the group, or null if invalid
 * @since 1.0.0
 * @example
 * ```typescript
 * const groupItem = await processGroup(
 *   { title: 'API Reference', path: './api/', priority: 1 },
 *   '/docs/guide',
 *   effectiveConfig,
 *   'en',
 *   false,
 *   configReader,
 *   fs,
 *   recursiveGenerator,
 *   [],
 *   '/docs'
 * );
 * ```
 */
export async function processGroup(
    groupConfig: GroupConfig,
    baseDirAbsPath: string,
    parentDirEffectiveConfig: EffectiveDirConfig,
    lang: string,
    isDevMode: boolean,
    configReader: ConfigReaderService,
    fs: FileSystem,
    recursiveViewGenerator: RecursiveViewGeneratorFunction,
    globalGitBookExclusionList: string[],
    docsAbsPath: string
): Promise<SidebarItem | null> {
    const groupTitle = groupConfig.title;
    const groupPath = groupConfig.path;

    const groupContentAbsPath = normalizePathSeparators(
        path.resolve(baseDirAbsPath, groupPath)
    );

    try {
        const stat = await fs.stat(groupContentAbsPath);
        if (!stat.isDirectory()) {
            console.warn(`Group path is not a directory: ${groupContentAbsPath}`);
            return null;
        }
    } catch (error) {
        console.warn(`Group path does not exist: ${groupContentAbsPath}`);
        return null;
    }

    const groupIndexPath = path.join(groupContentAbsPath, 'index.md');
    let groupEffectiveConfig: EffectiveDirConfig;
    
    try {
        const groupFrontmatter = await configReader.getLocalFrontmatter(groupIndexPath);
        
        const baseConfig = {
            ...parentDirEffectiveConfig,
            externalLinks: [],
            groups: [],
            itemOrder: {}
        };
        
        groupEffectiveConfig = {
            ...baseConfig,
            ...groupFrontmatter,
            title: groupTitle,
            root: false,
            priority: groupConfig.priority ?? (groupFrontmatter.priority || 0),
            maxDepth: groupConfig.maxDepth ?? (groupFrontmatter.maxDepth || parentDirEffectiveConfig.maxDepth),
            path: groupContentAbsPath,
            _baseRelativePathForChildren: '',
            itemOrder: Array.isArray(groupFrontmatter.itemOrder) ? {} : (groupFrontmatter.itemOrder || {})
        };
    } catch (error) {
        groupEffectiveConfig = {
            ...parentDirEffectiveConfig,
            title: groupTitle,
            root: false,
            priority: groupConfig.priority ?? 0,
            maxDepth: groupConfig.maxDepth ?? parentDirEffectiveConfig.maxDepth,
            path: groupContentAbsPath,
            _baseRelativePathForChildren: '',
            externalLinks: [],
            groups: [],
            itemOrder: {}
        };
    }

    groupEffectiveConfig = {
        ...groupEffectiveConfig,
        title: groupTitle,
        priority: groupConfig.priority ?? groupEffectiveConfig.priority ?? 0,
        maxDepth: groupConfig.maxDepth ?? groupEffectiveConfig.maxDepth,
        _baseRelativePathForChildren: ''
    };

    const groupItems = await recursiveViewGenerator(
        groupContentAbsPath,
        groupEffectiveConfig,
        lang,
        0,
        isDevMode
    );

    if (!groupItems || groupItems.length === 0) {
        return null;
    }

    const groupLink = await generateLink(
        groupTitle,
        'group',
        baseDirAbsPath,
        docsAbsPath,
        lang,
        fs,
        groupConfig
    );

    const groupSidebarItem: SidebarItem = {
        text: groupTitle,
        link: groupLink || undefined,
        items: groupItems,
        collapsed: true,
        _priority: groupConfig.priority ?? 0,
        _relativePathKey: groupPath,
        _isDirectory: true,
        _isRoot: false,
        _hidden: false
    };

    return groupSidebarItem;
}

/**
 * Extracts grouped content from sidebar items and returns filtered results.
 * 
 * Processes group configurations to create independent sidebar sections while
 * removing the original grouped content from the main sidebar structure. This
 * prevents duplication and allows for clean separation of grouped content.
 * 
 * @param {SidebarItem[]} sidebarItems - Original sidebar items
 * @param {GroupConfig[]} groups - Group configurations to process
 * @param {string} baseDirAbsPath - Base directory path
 * @param {EffectiveDirConfig} parentConfig - Parent directory configuration
 * @param {string} lang - Language code
 * @param {boolean} isDevMode - Development mode flag
 * @param {ConfigReaderService} configReader - Configuration reader
 * @param {FileSystem} fs - File system interface
 * @param {RecursiveViewGeneratorFunction} recursiveViewGenerator - Recursive generator function
 * @param {string[]} globalGitBookExclusionList - Exclusion list
 * @param {string} docsAbsPath - Docs root path
 * @returns {Promise<{extractedGroups: SidebarItem[], filteredItems: SidebarItem[]}>} Promise resolving to extracted groups and filtered items
 * @since 1.0.0
 * @example
 * ```typescript
 * const { extractedGroups, filteredItems } = await extractGroups(
 *   originalItems,
 *   groupConfigs,
 *   '/docs/guide',
 *   effectiveConfig,
 *   'en',
 *   false,
 *   configReader,
 *   fs,
 *   recursiveGenerator,
 *   [],
 *   '/docs'
 * );
 * ```
 */
export async function extractGroups(
    sidebarItems: SidebarItem[],
    groups: GroupConfig[],
    baseDirAbsPath: string,
    parentConfig: EffectiveDirConfig,
    lang: string,
    isDevMode: boolean,
    configReader: ConfigReaderService,
    fs: FileSystem,
    recursiveViewGenerator: RecursiveViewGeneratorFunction,
    globalGitBookExclusionList: string[],
    docsAbsPath: string
): Promise<{ extractedGroups: SidebarItem[]; filteredItems: SidebarItem[] }> {
    const extractedGroups: SidebarItem[] = [];
    const pathsToRemove = new Set<string>();

    for (const groupConfig of groups) {
        const groupItem = await processGroup(
            groupConfig,
            baseDirAbsPath,
            parentConfig,
            lang,
            isDevMode,
            configReader,
            fs,
            recursiveViewGenerator,
            globalGitBookExclusionList,
            docsAbsPath
        );

        if (groupItem) {
            extractedGroups.push(groupItem);
            
            const groupAbsPath = normalizePathSeparators(
                path.resolve(baseDirAbsPath, groupConfig.path)
            );
            pathsToRemove.add(groupAbsPath);
        }
    }

    const filteredItems = filterItemsByPaths(sidebarItems, pathsToRemove);

    return { extractedGroups, filteredItems };
}

/**
 * Removes sidebar items that match the specified absolute paths.
 * 
 * Filters out items whose file paths or directory paths match any of the
 * paths in the removal set. Recursively processes nested items to ensure
 * complete removal of grouped content.
 * 
 * @param {SidebarItem[]} items - Sidebar items to filter
 * @param {Set<string>} pathsToRemove - Set of absolute paths to remove
 * @returns {SidebarItem[]} Filtered sidebar items with specified paths removed
 * @since 1.0.0
 * @private
 */
function filterItemsByPaths(items: SidebarItem[], pathsToRemove: Set<string>): SidebarItem[] {
    return items.filter(item => {
        if (item._filePath && pathsToRemove.has(normalizePathSeparators(item._filePath))) {
            return false;
        }
        
        if (item._isDirectory && item._relativePathKey) {
            const itemPath = item._relativePathKey.replace(/\/$/, '');
            for (const pathToRemove of pathsToRemove) {
                if (pathToRemove.endsWith(itemPath) || pathToRemove.includes(`/${itemPath}/`)) {
                    return false;
                }
            }
        }
        
        if (item.items) {
            item.items = filterItemsByPaths(item.items, pathsToRemove);
        }
        
        return true;
    });
}

/**
 * Converts a string to a URL-safe slug format.
 * 
 * Transforms text into lowercase, replaces spaces with hyphens, removes
 * non-word characters, and cleans up multiple hyphens. Used for generating
 * consistent path segments from titles and names.
 * 
 * @param {string} text - Text to convert to slug format
 * @returns {string} URL-safe slug string
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * slugify('Core Concepts & Ideas'); // 'core-concepts-ideas'
 * slugify('Getting Started!'); // 'getting-started'
 * ```
 */
function slugify(text: string): string {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Checks if an absolute path is excluded due to GitBook restrictions.
 * 
 * Determines whether a given path falls within any of the globally excluded
 * GitBook directories by comparing normalized paths.
 * 
 * @param {string} absPath - Absolute path to check
 * @param {string[]} exclusionList - Array of absolute paths to excluded GitBook directories
 * @returns {boolean} True if the path should be excluded, false otherwise
 * @since 1.0.0
 * @private
 */
function isGitBookExcluded(absPath: string, exclusionList: string[]): boolean {
    const normalizedAbsPath = normalizePathSeparators(absPath);
    return exclusionList.some(excludedPath => 
        normalizedAbsPath === excludedPath || normalizedAbsPath.startsWith(excludedPath + '/')
    );
} 

