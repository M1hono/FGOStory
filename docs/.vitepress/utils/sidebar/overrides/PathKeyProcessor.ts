/**
 * @fileoverview Path key processing utilities for JSON configuration synchronization.
 * 
 * This module provides sophisticated path key processing capabilities for sidebar
 * configuration synchronization. It handles the extraction of relative keys,
 * directory signature processing, and GitBook root detection while managing
 * complex nested directory structures and content path relationships.
 * 
 * @module PathKeyProcessor
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { SidebarItem } from '../types';
import { normalizePathSeparators, sanitizeTitleForPath } from '../shared/objectUtils';

/**
 * Advanced path key processor for sidebar configuration synchronization.
 * 
 * Provides comprehensive path key processing capabilities for JSON configuration
 * synchronization. Handles complex scenarios including nested directory structures,
 * content path extraction, relative key generation, and GitBook root detection.
 * Essential for maintaining accurate configuration mappings across hierarchical
 * sidebar structures.
 * 
 * Key capabilities:
 * - Relative key extraction for current directory contexts
 * - Content path detection and processing
 * - Version pattern recognition for modded content structures
 * - Directory signature generation for configuration files
 * - GitBook root detection and handling
 * - Cross-platform path normalization
 * 
 * @class PathKeyProcessor
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const processor = new PathKeyProcessor();
 * 
 * // Extract relative key for current directory context
 * const relativeKey = processor.extractRelativeKeyForCurrentDir(
 *   sidebarItem,
 *   'modpack/kubejs/1.20.1/Introduction'
 * );
 * 
 * // Get signature for root view
 * const signature = processor.getSignatureForRootView('/en/guide/', 'en');
 * 
 * // Check if item is GitBook root
 * const isGitBook = processor.isGitBookRoot(
 *   'my-gitbook',
 *   'en',
 *   gitbookPaths,
 *   docsPath
 * );
 * ```
 */
export class PathKeyProcessor {
    
    /**
     * Extracts the relative key for the current directory from a full path key.
     * 
     * Processes complex path relationships to extract the immediate child component
     * relative to the current directory context. Handles nested structures,
     * version patterns, and maintains proper file/directory formatting with
     * appropriate trailing slashes for directories and extension preservation
     * for files.
     * 
     * The extraction process:
     * 1. For root level (_root): Returns immediate child component
     * 2. For nested directories: Analyzes path structure to find content portion
     * 3. Uses version pattern detection (e.g., "1.20.1") as structural markers
     * 4. Falls back to longest suffix matching for complex hierarchies
     * 5. Preserves file extensions and directory trailing slashes
     * 
     * @param {SidebarItem} item - The sidebar item to extract the key from
     * @param {string} currentConfigDirSignature - Current directory signature context
     * @returns {string} Relative key for the current directory context
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * // Root level extraction
     * const rootKey = processor.extractRelativeKeyForCurrentDir(
     *   { _relativePathKey: 'Introduction/Concepts/', _isDirectory: true },
     *   '_root'
     * ); // Returns: "Introduction/"
     * 
     * // Nested directory extraction
     * const nestedKey = processor.extractRelativeKeyForCurrentDir(
     *   { _relativePathKey: 'Introduction/Addon/ProbeJS/', _isDirectory: true },
     *   'modpack/kubejs/1.20.1/Introduction/Addon'
     * ); // Returns: "ProbeJS/"
     * 
     * // File extraction
     * const fileKey = processor.extractRelativeKeyForCurrentDir(
     *   { _relativePathKey: 'Introduction/setup.md', _isDirectory: false },
     *   'modpack/kubejs/1.20.1/Introduction'
     * ); // Returns: "setup.md"
     * ```
     */
    public extractRelativeKeyForCurrentDir(item: SidebarItem, currentConfigDirSignature: string): string {
        const fullKey = item._relativePathKey || sanitizeTitleForPath(item.text || 'untitled');
        
        if (currentConfigDirSignature === '_root') {
            const parts = fullKey.split('/').filter(p => p.length > 0);
            let result: string;
            
            if (item._isDirectory) {
                result = parts.length > 0 ? parts[0] + '/' : fullKey;
            } else {
                result = parts.length > 0 ? parts[0] : fullKey;
                if (!result.includes('.') && item.text && item.text.includes('.')) {
                    result = item.text;
                }
            }
            
            return result;
        }
        
        const configParts = currentConfigDirSignature.split('/');
        
        let contentPathStartIndex = -1;
        
        for (let i = 0; i < configParts.length; i++) {
            if (/^\d+\.\d+(\.\d+)?$/.test(configParts[i])) {
                contentPathStartIndex = i + 1;
                break;
            }
        }
        
        if (contentPathStartIndex === -1) {
            for (let i = 1; i < configParts.length; i++) {
                const testContentPath = configParts.slice(i).join('/');
                if (fullKey.startsWith(testContentPath + '/') || fullKey === testContentPath + '/') {
                    contentPathStartIndex = i;
                    break;
                }
            }
        }
        
        if (contentPathStartIndex >= 0 && contentPathStartIndex < configParts.length) {
            const contentPath = configParts.slice(contentPathStartIndex).join('/');
            
            if (fullKey.startsWith(contentPath + '/')) {
                const relativePart = fullKey.substring(contentPath.length + 1);
                
                const parts = relativePart.split('/').filter(p => p.length > 0);
                let result: string;
                
                if (item._isDirectory) {
                    result = parts.length > 0 ? parts[0] + '/' : relativePart;
                } else {
                    result = parts.length > 0 ? parts[0] : relativePart;
                    if (result.endsWith('/')) {
                        result = result.slice(0, -1);
                    }
                }
                
                return result;
            } else if (fullKey === contentPath + '/') {
                return '';
            }
        }
        
        const parts = fullKey.split('/').filter(p => p.length > 0);
        let result: string;
        
        if (item._isDirectory) {
            result = parts.length > 0 ? parts[parts.length - 1] + '/' : fullKey;
        } else {
            result = parts.length > 0 ? parts[parts.length - 1] : fullKey;
            if (result.endsWith('/')) {
                result = result.slice(0, -1);
            }
        }
        
        return result;
    }

    /**
     * Derives the directory path signature for JSON configuration files.
     * 
     * Converts a global sidebar root path key into a normalized directory
     * signature suitable for organizing JSON configuration files. Handles
     * language prefixes, path normalization, and special cases like root
     * directories and single-language sites.
     * 
     * The signature generation process:
     * 1. Normalizes path separators for cross-platform compatibility
     * 2. Removes language prefixes to get path relative to language root
     * 3. Handles special cases for root directories ('_root')
     * 4. Manages both multi-language and single-language site structures
     * 5. Removes trailing slashes for clean directory signatures
     * 
     * @param {string} rootPathKey - Global path key for the sidebar root (e.g., '/en/guide/')
     * @param {string} lang - Language code (e.g., 'en', empty for single-language sites)
     * @returns {string} Path signature relative to language folder (e.g., 'guide', '_root')
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * // Multi-language site
     * const signature1 = processor.getSignatureForRootView('/en/guide/', 'en');
     * // Returns: "guide"
     * 
     * // Root directory
     * const signature2 = processor.getSignatureForRootView('/en/', 'en');
     * // Returns: "_root"
     * 
     * // Single-language site
     * const signature3 = processor.getSignatureForRootView('/guide/', '');
     * // Returns: "guide"
     * 
     * // Complex nested path
     * const signature4 = processor.getSignatureForRootView('/en/docs/api/v2/', 'en');
     * // Returns: "docs/api/v2"
     * ```
     */
    public getSignatureForRootView(rootPathKey: string, lang: string): string {
        let normalizedKey = normalizePathSeparators(rootPathKey);
        const langPrefix = lang ? `/${lang}/` : '/';
        let pathRelativeToLangRoot: string;

        if (lang && normalizedKey.startsWith(langPrefix)) {
            pathRelativeToLangRoot = normalizedKey.substring(langPrefix.length);
        } else if (lang && normalizedKey === `/${lang}`) {
            pathRelativeToLangRoot = '';
        } else if (!lang && normalizedKey.startsWith('/')) {
            pathRelativeToLangRoot = normalizedKey.substring(1);
        } else if (lang && !normalizedKey.startsWith(langPrefix)){
            pathRelativeToLangRoot = normalizedKey.startsWith('/') ? normalizedKey.substring(1) : normalizedKey;

        } else {
            pathRelativeToLangRoot = normalizedKey;
        }

        if (pathRelativeToLangRoot.endsWith('/')) {
            pathRelativeToLangRoot = pathRelativeToLangRoot.slice(0, -1);
        }
        return pathRelativeToLangRoot === '' ? '_root' : pathRelativeToLangRoot;
    }

    /**
     * Determines if a sidebar item represents a GitBook root directory.
     * 
     * Checks whether a given sidebar item path corresponds to a GitBook root
     * directory by comparing its absolute path against a list of known GitBook
     * paths for the current language. This is essential for proper handling
     * of GitBook integration and avoiding configuration conflicts.
     * 
     * The detection process:
     * 1. Excludes '_root' signatures (cannot be GitBook paths)
     * 2. Constructs absolute path from relative components
     * 3. Normalizes path for cross-platform compatibility
     * 4. Performs exact match against known GitBook directories
     * 
     * @param {string} itemContentPathRelativeToLang - Path relative to language folder (e.g., 'my-gitbook-folder')
     * @param {string} lang - Current language code
     * @param {string[]} langGitbookPaths - Array of absolute paths to GitBook directories for current language
     * @param {string} absDocsPath - Absolute path to the docs directory
     * @returns {boolean} True if the item represents a GitBook root directory
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * // Check if directory is GitBook root
     * const isGitBook = processor.isGitBookRoot(
     *   'my-gitbook-folder',
     *   'en',
     *   ['/docs/en/my-gitbook-folder', '/docs/en/another-gitbook'],
     *   '/docs'
     * ); // Returns: true
     * 
     * // Root directory check
     * const isRootGitBook = processor.isGitBookRoot(
     *   '_root',
     *   'en',
     *   gitbookPaths,
     *   '/docs'
     * ); // Returns: false (root cannot be GitBook)
     * 
     * // Non-GitBook directory
     * const isRegular = processor.isGitBookRoot(
     *   'regular-folder',
     *   'en',
     *   gitbookPaths,
     *   '/docs'
     * ); // Returns: false
     * ```
     */
    public isGitBookRoot(itemContentPathRelativeToLang: string, lang: string, langGitbookPaths: string[], absDocsPath: string): boolean {
        if (itemContentPathRelativeToLang === '_root') return false;
        const itemAbsPath = normalizePathSeparators(path.join(absDocsPath, lang, itemContentPathRelativeToLang));
        return langGitbookPaths.includes(itemAbsPath);
    }
} 


