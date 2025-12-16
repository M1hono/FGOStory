import path from "node:path";
import matter from "gray-matter";
import { SidebarItem, EffectiveDirConfig, FileConfig } from "../types";
import { FileSystem } from "../shared/FileSystem";
import { ConfigReaderService } from "../config";
import { generateLink } from "./linkGenerator";
import { generatePathKey } from "./pathKeyGenerator";
import { normalizePathSeparators } from "../shared/objectUtils";

/**
 * @fileoverview Core processor for individual file system entries in sidebar generation.
 * 
 * This module provides the main processing logic for converting file system
 * entries (files and directories) into sidebar items. It handles configuration
 * application, link generation, depth management, and hierarchical structure
 * creation while respecting visibility and priority settings.
 * 
 * @module ItemProcessor
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

/**
 * Checks if an absolute path is excluded due to GitBook restrictions.
 * 
 * Determines whether a given path falls within any of the globally excluded
 * GitBook directories by comparing normalized paths. Used to filter out
 * GitBook-specific directories that should not appear in the sidebar.
 * 
 * @param {string} absPath - The absolute path to check for exclusion
 * @param {string[]} exclusionList - Array of absolute paths to excluded GitBook directories
 * @returns {boolean} True if the path should be excluded, false otherwise
 * @since 1.0.0
 * @private
 */
function isGitBookExcluded(absPath: string, exclusionList: string[]): boolean {
    const normalizedAbsPath = normalizePathSeparators(absPath);
    return exclusionList.some(
        (excludedPath) =>
            normalizedAbsPath === excludedPath ||
            normalizedAbsPath.startsWith(excludedPath + "/")
    );
}

/**
 * Processes a markdown file entry and creates a SidebarItem.
 * 
 * Handles individual markdown files by reading their frontmatter, extracting
 * configuration like title and priority, generating appropriate links, and
 * creating SidebarItem objects. Automatically skips non-markdown files and
 * index.md files (which represent directories).
 * 
 * @param {string} entryName - The filename (e.g., 'my-doc.md')
 * @param {string} normalizedItemAbsPath - Normalized absolute path to the file
 * @param {string} itemRelativePathKey - The relative path key for this file
 * @param {string} docsAbsPath - Absolute path to the /docs directory
 * @param {string} lang - Current language code
 * @param {FileSystem} fs - FileSystem instance for file operations
 * @param {EffectiveDirConfig} parentViewEffectiveConfig - Config of the parent directory providing context
 * @returns {Promise<SidebarItem | null>} A SidebarItem for the file or null if it should be excluded
 * @since 1.0.0
 * @private
 */
async function processFileEntry(
    entryName: string,
    normalizedItemAbsPath: string,
    itemRelativePathKey: string,
    docsAbsPath: string,
    lang: string,
    fs: FileSystem,
    parentViewEffectiveConfig: EffectiveDirConfig
): Promise<SidebarItem | null> {
    if (!entryName.toLowerCase().endsWith('.md')) {
        return null;
    }

    if (entryName.toLowerCase() === "index.md") {
        return null;
    }

    let fileFrontmatter: Partial<FileConfig> = {};
    try {
        const fileContent = await fs.readFile(normalizedItemAbsPath);
        fileFrontmatter = matter(fileContent).data as Partial<FileConfig>;
    } catch (e: any) {
        if (e.code !== "ENOENT") {
        }
    }

    const hidden = fileFrontmatter.hidden ?? false;
    if (hidden) {
        return null;
    }

    const title = fileFrontmatter.title || entryName.replace(/\.md$/i, "");
    
    const relativeToLangRoot = normalizePathSeparators(
        path.relative(path.join(docsAbsPath, lang), normalizedItemAbsPath)
    );
    let link = `/${lang}/${relativeToLangRoot.replace(/\.md$/i, ".html")}`.replace(/\/+/g, "/");
    if (link.startsWith("//")) link = link.substring(1);

    let priority = fileFrontmatter.priority;
    if (priority === undefined && parentViewEffectiveConfig.itemOrder) {
        const fileKey = entryName.replace(/\.md$/i, "");
        if (parentViewEffectiveConfig.itemOrder.hasOwnProperty(fileKey)) {
            priority = parentViewEffectiveConfig.itemOrder[fileKey];
        }
    }

    return {
        text: title,
        link: link,
        _priority: priority,
        _relativePathKey: itemRelativePathKey,
        _hidden: hidden,
        _isDirectory: false,
        _isRoot: false,
    };
}

/**
 * Creates a link-only item for a subdirectory that defines a new sidebar root.
 * 
 * When a subdirectory has `root: true` in its frontmatter, it should be treated
 * as an independent sidebar section. This function creates a link-only item
 * that points to the root directory without expanding its contents in the
 * current sidebar context.
 * 
 * @param {string} entryName - The directory name
 * @param {string} normalizedItemAbsPath - Normalized absolute path to the directory
 * @param {string} itemRelativePathKey - The relative path key for this directory
 * @param {EffectiveDirConfig} dirEffectiveConfig - The effective configuration for this directory
 * @param {string} docsAbsPath - Absolute path to the /docs directory
 * @param {string} lang - Current language code
 * @param {FileSystem} fs - FileSystem instance for operations
 * @returns {Promise<SidebarItem | null>} A SidebarItem representing the root link or null if not linkable
 * @since 1.0.0
 * @private
 */
async function createRootLinkItem(
    entryName: string,
    normalizedItemAbsPath: string,
    itemRelativePathKey: string,
    dirEffectiveConfig: EffectiveDirConfig,
    docsAbsPath: string,
    lang: string,
    fs: FileSystem
): Promise<SidebarItem | null> {
    const linkToSubRoot = await generateLink(
        entryName,
        "directory",
        path.dirname(normalizedItemAbsPath),
        docsAbsPath,
        lang,
        fs
    );

    if (!linkToSubRoot) {
        return null;
    }

    return {
        text: dirEffectiveConfig.title,
        link: linkToSubRoot,
        items: [],
        collapsed: dirEffectiveConfig.collapsed,
        _priority: dirEffectiveConfig.priority,
        _relativePathKey: itemRelativePathKey,
        _isDirectory: true,
        _isRoot: true,
        _hidden: dirEffectiveConfig.hidden || false,
    };
}

/**
 * Recursively checks if a directory contains any markdown files at any depth.
 * 
 * Performs a depth-limited search through directory structures to determine
 * if there are any markdown files (excluding index.md) that would justify
 * including the directory in the sidebar. Used to avoid empty directory
 * items that would confuse navigation.
 * 
 * @param {string} dirPath - Absolute path to the directory to search
 * @param {FileSystem} fs - FileSystem instance for directory operations
 * @param {number} [maxDepth=5] - Maximum depth to search (prevents infinite recursion)
 * @returns {Promise<boolean>} True if any .md files are found at any depth, false otherwise
 * @since 1.0.0
 * @private
 */
async function hasNestedMarkdownContent(
    dirPath: string,
    fs: FileSystem,
    maxDepth: number = 5
): Promise<boolean> {
    if (maxDepth <= 0) {
        return false;
    }

    try {
        const entries = await fs.readDir(dirPath);
        
        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            
            if (entry.isFile() && entry.name.toLowerCase().endsWith('.md') && entry.name.toLowerCase() !== 'index.md') {
                return true;
            }
            
            if (entry.isDirectory()) {
                const hasNestedContent = await hasNestedMarkdownContent(entryPath, fs, maxDepth - 1);
                if (hasNestedContent) {
                    return true;
                }
            }
        }
            } catch (e: any) {
        }
    
    return false;
}

/**
 * Processes a directory entry and creates a SidebarItem with children.
 * 
 * Handles directory processing by reading its configuration, recursively
 * generating content for subdirectories within depth limits, determining
 * appropriate links, and creating hierarchical sidebar structures. Manages
 * the relationship between parent and child configurations.
 * 
 * @param {string} entryName - The directory name
 * @param {string} normalizedItemAbsPath - Normalized absolute path to the directory
 * @param {string} itemRelativePathKey - The relative path key for this directory
 * @param {EffectiveDirConfig} dirEffectiveConfig - The effective configuration for this directory
 * @param {EffectiveDirConfig} parentViewEffectiveConfig - Configuration from the parent directory
 * @param {number} currentLevelDepth - Current recursion depth (0-indexed)
 * @param {string} lang - Current language code
 * @param {boolean} isDevMode - Whether running in development mode
 * @param {string} docsAbsPath - Absolute path to the /docs directory
 * @param {FileSystem} fs - FileSystem instance for operations
 * @param {Function} recursiveGenerator - Function for recursive sidebar generation
 * @returns {Promise<SidebarItem | null>} A SidebarItem for the directory or null if it should be excluded
 * @since 1.0.0
 * @private
 */
async function processDirectoryEntry(
    entryName: string,
    normalizedItemAbsPath: string,
    itemRelativePathKey: string,
    dirEffectiveConfig: EffectiveDirConfig,
    parentViewEffectiveConfig: EffectiveDirConfig,
    currentLevelDepth: number,
    lang: string,
    isDevMode: boolean,
    docsAbsPath: string,
    fs: FileSystem,
    recursiveGenerator: (
        contentPath: string,
        effectiveConfig: EffectiveDirConfig,
        lang: string,
        depth: number,
        devMode: boolean
    ) => Promise<SidebarItem[]>
): Promise<SidebarItem | null> {
    let subItems: SidebarItem[] = [];
    
    if (currentLevelDepth < parentViewEffectiveConfig.maxDepth) {
        const subDirContextConfig = {
            ...dirEffectiveConfig,
            _baseRelativePathForChildren: itemRelativePathKey,
        };
        
        subItems = await recursiveGenerator(
            normalizedItemAbsPath,
            subDirContextConfig,
            lang,
            currentLevelDepth + 1,
            isDevMode
        );
    }

    const linkToDir = await generateLink(
        entryName,
        "directory",
        path.dirname(normalizedItemAbsPath),
        docsAbsPath,
        lang,
        fs
    );

    if (subItems.length === 0 && !linkToDir) {
        const hasNestedContent = await hasNestedMarkdownContent(normalizedItemAbsPath, fs);
        if (!hasNestedContent) {
            return null;
        }
    }

    const directoryTitle = await getDirectoryTitle(
        entryName,
        normalizedItemAbsPath,
        fs
    );

    return {
        text: directoryTitle,
        link: linkToDir || undefined,
        items: subItems.length > 0 ? subItems : [],
        collapsed: dirEffectiveConfig.collapsed,
        _priority: dirEffectiveConfig.priority,
        _relativePathKey: itemRelativePathKey,
        _isDirectory: true,
        _isRoot: false,
        _hidden: dirEffectiveConfig.hidden || false,
    };
}

/**
 * Determines the appropriate title for a directory.
 * 
 * Resolves the display title for a directory by checking its index.md file
 * for a frontmatter title. Falls back to the directory name if no custom
 * title is found or if the index.md file cannot be read.
 * 
 * Priority order: 1. Directory's own frontmatter title, 2. Directory name
 * 
 * @param {string} entryName - The directory name (fallback title)
 * @param {string} normalizedItemAbsPath - Normalized absolute path to the directory
 * @param {FileSystem} fs - FileSystem instance for reading index.md
 * @returns {Promise<string>} The resolved directory title
 * @since 1.0.0
 * @private
 */
async function getDirectoryTitle(
    entryName: string,
    normalizedItemAbsPath: string,
    fs: FileSystem
): Promise<string> {
    let directoryTitle = entryName;
    
    try {
        const dirIndexPath = path.join(normalizedItemAbsPath, "index.md");
        if (await fs.exists(dirIndexPath)) {
            const dirIndexContent = await fs.readFile(dirIndexPath);
            const dirFrontmatter = matter(dirIndexContent).data;
            if (dirFrontmatter && dirFrontmatter.title) {
                directoryTitle = dirFrontmatter.title;
            }
        }
    } catch (e: any) {
    }

    return directoryTitle;
}

/**
 * Processes a single file system entry and returns a SidebarItem or null.
 * 
 * This is the main entry point for processing individual items in the sidebar
 * generation. It coordinates between file and directory processing, handles
 * configuration resolution, applies exclusion rules, and manages the recursive
 * generation of hierarchical sidebar structures.
 * 
 * @param {string} entryName - Filename (e.g., 'my-doc.md') or dirname (e.g., 'concepts')
 * @param {string} itemAbsPath - Absolute path to the file or directory
 * @param {boolean} isDir - Whether the entry is a directory
 * @param {EffectiveDirConfig} parentViewEffectiveConfig - Config of the parent directory providing context
 * @param {string} lang - Current language code
 * @param {number} currentLevelDepth - 0-indexed recursion depth
 * @param {boolean} isDevMode - Whether running in development mode
 * @param {ConfigReaderService} configReader - Instance for reading directory configurations
 * @param {FileSystem} fs - FileSystem instance for file operations
 * @param {Function} recursiveGenerator - Main generateSidebarView method for recursion
 * @param {string[]} globalGitBookExclusionList - Array of absolute paths to excluded GitBook directories
 * @param {string} docsAbsPath - Absolute path to the /docs directory
 * @returns {Promise<SidebarItem | null>} A SidebarItem for the entry or null if it should be excluded
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const item = await processItem(
 *   'guide.md',
 *   '/docs/en/guide.md',
 *   false,
 *   effectiveConfig,
 *   'en',
 *   0,
 *   false,
 *   configReader,
 *   fs,
 *   recursiveGenerator,
 *   [],
 *   '/docs'
 * );
 * ```
 */
export async function processItem(
    entryName: string,
    itemAbsPath: string,
    isDir: boolean,
    parentViewEffectiveConfig: EffectiveDirConfig,
    lang: string,
    currentLevelDepth: number,
    isDevMode: boolean,
    configReader: ConfigReaderService,
    fs: FileSystem,
    recursiveGenerator: (
        contentPath: string,
        effectiveConfig: EffectiveDirConfig,
        lang: string,
        depth: number,
        devMode: boolean
    ) => Promise<SidebarItem[]>,
    globalGitBookExclusionList: string[],
    docsAbsPath: string
): Promise<SidebarItem | null> {
    const normalizedItemAbsPath = normalizePathSeparators(itemAbsPath);

    if (isGitBookExcluded(normalizedItemAbsPath, globalGitBookExclusionList)) {
        return null;
    }

    const parentKeyForChildren = parentViewEffectiveConfig._baseRelativePathForChildren ?? "";
    const parentDirAbsPath = path.dirname(normalizedItemAbsPath);
    const itemRelativePathKey = generatePathKey(
        normalizedItemAbsPath,
        parentDirAbsPath
    );

    if (!isDir) {
        return processFileEntry(
            entryName,
            normalizedItemAbsPath,
            itemRelativePathKey,
            docsAbsPath,
            lang,
            fs,
            parentViewEffectiveConfig
        );
    }

    const dirIndexPath = path.join(normalizedItemAbsPath, "index.md");
    const dirEffectiveConfig = await configReader.getEffectiveConfig(
        dirIndexPath,
        lang,
        isDevMode
    );

    if (dirEffectiveConfig.hidden) {
        return null;
    }

    const isProcessingWithinExistingRoot = currentLevelDepth > 0;
    
    if (
        dirEffectiveConfig.root &&
        normalizedItemAbsPath !== parentViewEffectiveConfig.path &&
        !isProcessingWithinExistingRoot
    ) {
        return createRootLinkItem(
            entryName,
            normalizedItemAbsPath,
            itemRelativePathKey,
            dirEffectiveConfig,
            docsAbsPath,
            lang,
            fs
        );
    }

    return processDirectoryEntry(
        entryName,
        normalizedItemAbsPath,
        itemRelativePathKey,
        dirEffectiveConfig,
        parentViewEffectiveConfig,
        currentLevelDepth,
        lang,
        isDevMode,
        docsAbsPath,
        fs,
        recursiveGenerator
    );
}