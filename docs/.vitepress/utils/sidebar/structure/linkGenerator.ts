/**
 * @fileoverview Link generation utilities for sidebar items.
 * 
 * This module provides functionality for generating appropriate links for
 * sidebar items, including directories with index.md files and groups.
 * It handles URL normalization, path resolution, and link validation
 * across different content types and language configurations.
 * 
 * @module LinkGenerator
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from "node:path";
import { GroupConfig } from "../types";
import { FileSystem } from "../shared/FileSystem";
import { normalizePathSeparators } from "../shared/objectUtils";

/**
 * Generates a normalized URL link for a directory path relative to the language root.
 * 
 * Converts an absolute directory path into a URL-safe link format appropriate
 * for VitePress navigation. Handles language prefixes, path normalization,
 * and ensures proper slash formatting for directory links.
 * 
 * @param {string} dirAbsPath - Absolute path to the directory
 * @param {string} docsAbsPath - Absolute path to the /docs directory
 * @param {string} lang - Current language code
 * @returns {string} Normalized URL link (e.g., /en/path/to/dir/)
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * normalizeDirPathToUrl('/docs/en/guide', '/docs', 'en'); // '/en/guide/'
 * normalizeDirPathToUrl('/docs/guide', '/docs', ''); // '/guide/'
 * ```
 */
function normalizeDirPathToUrl(
    dirAbsPath: string,
    docsAbsPath: string,
    lang: string
): string {
    const langRootAbsPath = normalizePathSeparators(
        path.join(docsAbsPath, lang)
    );
    let relativePath = normalizePathSeparators(
        path.relative(langRootAbsPath, dirAbsPath)
    );

    if (relativePath === "" || relativePath === ".") {
        relativePath = "";
    } else {
        relativePath = relativePath + "/";
    }

    let link: string;
    if (!lang || lang === '') {
        link = relativePath ? `/${relativePath}` : "/";
    } else {
        link = `/${lang}/${relativePath}`;
    }
    
    link = link.replace(/([^:])\/\/+/g, "$1/");
    
    if (link !== "/" && !link.endsWith("/")) {
        link += "/";
    }
    
    link = link.replace(/\/\/+/g, "/");

    return link;
}

/**
 * Normalizes a group title or directory name into a URL-safe slug.
 * 
 * Converts human-readable titles into path-safe strings by converting to
 * lowercase, replacing spaces with hyphens, removing unsafe characters,
 * and cleaning up multiple consecutive hyphens.
 * 
 * @param {string} text - Text to convert to slug format
 * @returns {string} URL-safe slug string
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * slugify("Core Concepts"); // "core-concepts"
 * slugify("Getting Started!"); // "getting-started"
 * ```
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

/**
 * Generates a link for a directory or group item based on content and configuration.
 * 
 * Creates appropriate links for sidebar items by checking for the presence of
 * index.md files, resolving group configurations, and applying proper URL
 * formatting. Returns null for items that should not be clickable.
 * 
 * @param {string} itemName - The name of the directory (e.g., "concepts") or group title (e.g., "Core Concepts")
 * @param {"directory" | "group"} itemType - Type of item: 'directory' or 'group'
 * @param {string} currentDirAbsPath - Absolute FS path to the directory where the item resides
 * @param {string} docsAbsPath - Absolute path to the 'docs' directory
 * @param {string} lang - Current language code
 * @param {FileSystem} fs - FileSystem instance for file operations
 * @param {GroupConfig} [groupConfig] - Optional group configuration if generating a link for a group
 * @returns {Promise<string | null>} The link string if clickable (e.g., /en/guide/concepts/), or null if not
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const link = await generateLink(
 *   'concepts',
 *   'directory',
 *   '/docs/en/guide',
 *   '/docs',
 *   'en',
 *   fs
 * );
 * ```
 */
export async function generateLink(
    itemName: string,
    itemType: "directory" | "group",
    currentDirAbsPath: string,
    docsAbsPath: string,
    lang: string,
    fs: FileSystem,
    groupConfig?: GroupConfig
): Promise<string | null> {
    const normalizedCurrentDirAbsPath =
        normalizePathSeparators(currentDirAbsPath);

    if (itemType === "group" && groupConfig) {
        let targetDirForGroupIndexMdAbs: string | null = null;

        if (groupConfig.path) {
            targetDirForGroupIndexMdAbs = normalizePathSeparators(
                path.resolve(normalizedCurrentDirAbsPath, groupConfig.path)
            );
            if (
                await fs.exists(
                    path.join(targetDirForGroupIndexMdAbs, "index.md")
                )
            ) {
                return normalizeDirPathToUrl(
                    targetDirForGroupIndexMdAbs,
                    docsAbsPath,
                    lang
                );
            }
        }

        const sluggedTitle = slugify(groupConfig.title);
        if (sluggedTitle) {
            const potentialDirFromTitleAbs = normalizePathSeparators(
                path.join(normalizedCurrentDirAbsPath, sluggedTitle)
            );
            if (
                await fs.exists(path.join(potentialDirFromTitleAbs, "index.md"))
            ) {
                return normalizeDirPathToUrl(
                    potentialDirFromTitleAbs,
                    docsAbsPath,
                    lang
                );
            }
        }
        return null;
    }

    if (itemType === "directory") {
        const directoryFullPathAbs = normalizePathSeparators(
            path.join(currentDirAbsPath, itemName)
        );
        const indexPath = path.join(directoryFullPathAbs, "index.md");
        
        const indexExists = await fs.exists(indexPath);
        
        if (indexExists) {
            const link = normalizeDirPathToUrl(
                directoryFullPathAbs,
                docsAbsPath,
                lang
            );
            return link;
        }
    }

    return null;
}

