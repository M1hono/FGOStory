/**
 * @fileoverview Configuration reading service for sidebar generation.
 * 
 * This service is responsible for loading and merging sidebar configurations
 * from global `.sidebarrc.yml` and hierarchical `index.md` frontmatter files.
 * It acts as a facade, orchestrating calls to more specialized loader, parser,
 * resolver, merger, and defaults provider modules/functions.
 * 
 * @module ConfigReaderService
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { 
    GlobalSidebarConfig, 
    DirectoryConfig, 
    EffectiveDirConfig
} from '../types';
import { deepMerge, normalizePathSeparators } from '../shared/objectUtils';
import { loadGlobalConfig } from './globalConfigLoader';
import { loadFrontmatter } from './frontmatterParser';
import { getPathHierarchy } from './configHierarchyResolver';
import { applyConfigDefaults } from './configDefaultsProvider';

/**
 * @class ConfigReaderService
 * @description Service responsible for loading and merging sidebar configurations
 * from global `.sidebarrc.yml` and hierarchical `index.md` frontmatter.
 * Provides caching mechanisms for improved performance and manages configuration
 * inheritance from global to local scope with proper precedence handling.
 */
export class ConfigReaderService {
    private readonly docsPath: string;
    private globalConfigCache: GlobalSidebarConfig | null | undefined = undefined;
    private frontmatterCache: Map<string, Partial<DirectoryConfig>> = new Map();

    /**
     * @constructor
     * @description Creates an instance of ConfigReaderService.
     * @param {string} docsPath - Absolute path to the root of the documentation (e.g., /path/to/project/docs)
     */
    constructor(docsPath: string) {
        this.docsPath = path.resolve(docsPath);
    }

    /**
     * @method getGlobalConfig
     * @description Loads and caches global configuration from `docs/.sidebarrc.yml`.
     * Delegates to `loadGlobalConfig` helper for actual file reading and parsing.
     * @returns {Promise<Partial<GlobalSidebarConfig>>} A promise resolving to a partial GlobalSidebarConfig object,
     *          or an empty object if not found or an error occurs
     * @private
     */
    private async getGlobalConfig(): Promise<Partial<GlobalSidebarConfig>> {
        if (this.globalConfigCache !== undefined) {
            return this.globalConfigCache === null ? {} : this.globalConfigCache;
        }
        this.globalConfigCache = await loadGlobalConfig(this.docsPath);
        return this.globalConfigCache === null ? {} : this.globalConfigCache!;
    }

    /**
     * @method getFrontmatter
     * @description Loads and caches frontmatter from a given index.md file path.
     * Delegates to `loadFrontmatter` helper for actual file reading and parsing.
     * @param {string} absoluteIndexMdPath - Absolute path to the index.md file
     * @returns {Promise<Partial<DirectoryConfig>>} A promise resolving to a partial DirectoryConfig object from the frontmatter,
     *          or an empty object if not found, no frontmatter, or an error occurs
     * @private
     */
    private async getFrontmatter(absoluteIndexMdPath: string): Promise<Partial<DirectoryConfig>> {
        const normalizedPath = normalizePathSeparators(absoluteIndexMdPath);
        if (!this.frontmatterCache.has(normalizedPath)) {
            const fm = await loadFrontmatter(normalizedPath);
            this.frontmatterCache.set(normalizedPath, fm);
            return fm;
        }
        return this.frontmatterCache.get(normalizedPath)!;
    }

    /**
     * @method getEffectiveConfig
     * @description Retrieves the effective, merged configuration for a directory specified by its `index.md` path.
     * This is the main public method of this service. It considers global settings (`.sidebarrc.yml`), 
     * and hierarchically merges `index.md` frontmatter from the language root up to the specified `indexMdAbsPath`.
     * Finally, it applies system defaults to ensure a complete `EffectiveDirConfig`.
     * 
     * Configuration precedence (highest to lowest):
     * 1. Target directory's index.md frontmatter (including 'root' property)
     * 2. Parent directories' index.md frontmatter (excluding 'root' property)
     * 3. Global defaults from .sidebarrc.yml
     * 4. System defaults
     *
     * @param {string} indexMdAbsPath - Absolute path to the target directory's `index.md` file that defines the scope
     * @param {string} lang - The current language code (e.g., 'en', 'zh')
     * @param {boolean} isDevMode - Boolean indicating if running in development mode (affects draft status handling)
     * @returns {Promise<EffectiveDirConfig>} A promise resolving to a fully resolved `EffectiveDirConfig` object
     * @public
     * @example
     * ```typescript
     * const config = await configReader.getEffectiveConfig(
     *   '/docs/en/guide/index.md',
     *   'en',
     *   false
     * );
     * // Returns fully resolved EffectiveDirConfig with all defaults applied
     * ```
     */
    public async getEffectiveConfig(indexMdAbsPath: string, lang: string, isDevMode: boolean): Promise<EffectiveDirConfig> {
        const globalConfigData = await this.getGlobalConfig();
        const directoryPath = normalizePathSeparators(path.dirname(indexMdAbsPath));
        const langRootPath = normalizePathSeparators(path.join(this.docsPath, lang));

        const hierarchyIndexMdPaths = getPathHierarchy(directoryPath, langRootPath, this.docsPath);

        let mergedConfig: Partial<EffectiveDirConfig> = {}; 

        if (globalConfigData.defaults) {
            mergedConfig = deepMerge<Partial<EffectiveDirConfig>>({}, globalConfigData.defaults as Partial<EffectiveDirConfig>);
        }

        for (const hIndexMdPath of hierarchyIndexMdPaths) {
            const frontmatter = await this.getFrontmatter(hIndexMdPath);
            const { root: _, ...frontmatterWithoutRoot } = frontmatter;
            mergedConfig = deepMerge<Partial<EffectiveDirConfig>>(mergedConfig, frontmatterWithoutRoot as Partial<EffectiveDirConfig>);
        }
        
        const targetFrontmatter = await this.getFrontmatter(indexMdAbsPath); 
        mergedConfig = deepMerge<Partial<EffectiveDirConfig>>(mergedConfig, targetFrontmatter as Partial<EffectiveDirConfig>);

        const finalConfig = applyConfigDefaults(
            mergedConfig, 
            directoryPath, 
            lang, 
            isDevMode,
            globalConfigData.defaults
        );

        return finalConfig;
    }

    public async getLocalFrontmatter(absoluteIndexMdPath: string): Promise<Partial<DirectoryConfig>> {
        return await this.getFrontmatter(absoluteIndexMdPath);
    }

    /**
     * @method clearCache
     * @description Clears the internal caches for global configuration and frontmatter data.
     * This should be called if underlying files (`.sidebarrc.yml`, `index.md` files) change
     * to ensure fresh data is loaded on the next access.
     * @returns {void}
     * @public
     */
    public clearCache(): void {
        this.globalConfigCache = undefined;
        this.frontmatterCache.clear();
    }
} 

