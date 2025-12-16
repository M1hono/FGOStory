/**
 * @fileoverview Configuration hierarchy resolution service for sidebar generation.
 * 
 * This module provides functionality to resolve and merge configuration hierarchies
 * from multiple sources including global defaults, directory-specific settings,
 * and frontmatter overrides. It ensures proper inheritance and precedence rules
 * are applied throughout the configuration resolution process.
 * 
 * @module ConfigHierarchyResolver
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { normalizePathSeparators } from '../shared/objectUtils';

/**
 * @function getPathHierarchy
 * @description Determines the hierarchy of potential index.md file paths from a target directory
 * up to the language root. Used for configuration inheritance resolution.
 * @param {string} targetDirPath - Absolute path to the target directory for which to resolve config
 * @param {string} langRootAbsPath - Absolute path to the language root (e.g., /path/to/project/docs/en)
 * @param {string} docsAbsPath - Absolute path to the docs root (e.g., /path/to/project/docs)
 * @returns {string[]} An array of absolute paths to potential index.md files, ordered from
 *          most general (language root) to most specific (target directory)
 * @public
 * @example
 * ```typescript
 * getPathHierarchy(
 *   '/docs/en/guide/concepts',
 *   '/docs/en',
 *   '/docs'
 * );
 * // Returns: ['/docs/en/index.md', '/docs/en/guide/index.md', '/docs/en/guide/concepts/index.md']
 * ```
 */
export function getPathHierarchy(
    targetDirPath: string,
    langRootAbsPath: string,
    docsAbsPath: string
): string[] {
    const normalizedTargetDirPath = normalizePathSeparators(targetDirPath);
    const normalizedLangRootAbsPath = normalizePathSeparators(langRootAbsPath);

    const hierarchyIndexMdPaths: string[] = [];
    let currentPath = normalizedTargetDirPath;

    while (true) {
        hierarchyIndexMdPaths.push(path.join(currentPath, 'index.md'));
        
        if (currentPath === normalizedLangRootAbsPath) {
            break;
        }

        const parentPath = normalizePathSeparators(path.dirname(currentPath));

        if (parentPath === currentPath || !parentPath.startsWith(normalizedLangRootAbsPath) || parentPath.length < normalizedLangRootAbsPath.length) {
            break;
        }
        currentPath = parentPath;
    }
    return hierarchyIndexMdPaths.reverse();
} 

