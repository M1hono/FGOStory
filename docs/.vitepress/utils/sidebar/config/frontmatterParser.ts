/**
 * @fileoverview Frontmatter parsing utilities for sidebar configuration.
 * 
 * This module provides functionality to parse frontmatter content from markdown files
 * and extract configuration data. It handles error cases gracefully and provides
 * fallback mechanisms for invalid or missing frontmatter.
 * 
 * @module FrontmatterParser
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { DirectoryConfig } from '../types';

/**
 * @function loadFrontmatter
 * @description Loads and parses frontmatter from a markdown file.
 * Reads the specified index.md file and extracts frontmatter configuration data.
 * Returns an empty object if the file doesn't exist, has no frontmatter, or parsing fails.
 * @param {string} absoluteIndexMdPath - Absolute path to the index.md file to parse
 * @returns {Promise<Partial<DirectoryConfig>>} A promise resolving to parsed frontmatter as DirectoryConfig,
 *          or an empty object if parsing fails or file doesn't exist
 * @public
 * @example
 * ```typescript
 * const frontmatter = await loadFrontmatter('/docs/en/guide/index.md');
 * // Returns: { title: "Guide", collapsed: true, priority: 1, ... }
 * ```
 */
export async function loadFrontmatter(absoluteIndexMdPath: string): Promise<Partial<DirectoryConfig>> {
    try {
        const content = await fs.readFile(absoluteIndexMdPath, 'utf-8');
        const parsed = matter(content);
        return parsed.data as Partial<DirectoryConfig>;
    } catch (error) {
        return {};
    }
} 

