/**
 * @fileoverview Path key generation utilities for sidebar items.
 * 
 * This module provides functionality for generating unique path-based
 * identifiers for sidebar items. These path keys are used for item
 * identification, ordering, and relationship tracking within the
 * hierarchical sidebar structure.
 * 
 * @module PathKeyGenerator
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { normalizePathSeparators } from '../shared/objectUtils';

/**
 * Generates a unique path key for a sidebar item based on its location.
 * 
 * Creates a consistent, relative path-based identifier that can be used
 * for item tracking, ordering configuration, and hierarchical relationship
 * management. The key is relative to the parent directory and uses
 * normalized path separators for cross-platform compatibility.
 * 
 * @param {string} itemAbsPath - Absolute path to the item (file or directory)
 * @param {string} parentDirAbsPath - Absolute path to the parent directory
 * @returns {string} Normalized relative path key for the item
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * generatePathKey('/docs/en/guide/concepts', '/docs/en/guide'); // 'concepts'
 * generatePathKey('/docs/en/guide/intro.md', '/docs/en/guide'); // 'intro.md'
 * generatePathKey('/docs/en/advanced/api/', '/docs/en'); // 'advanced/api/'
 * ```
 */
export function generatePathKey(itemAbsPath: string, parentDirAbsPath: string): string {
    const normalizedItemPath = normalizePathSeparators(itemAbsPath);
    const normalizedParentPath = normalizePathSeparators(parentDirAbsPath);
    
    const relativePath = path.relative(normalizedParentPath, normalizedItemPath);
    return normalizePathSeparators(relativePath);
} 

