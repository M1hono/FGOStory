/**
 * @fileoverview High-level library interface for sidebar generation and caching.
 * 
 * This module provides a convenient API for integrating sidebar generation
 * into build processes and development workflows. It handles:
 * - Configuration management and validation
 * - Multi-level caching (memory and file-based)
 * - Language-specific sidebar generation
 * - Automatic cache invalidation based on file changes
 * - Synchronous and asynchronous access patterns
 * 
 * @module SidebarLib
 * @version 1.0.0
 * @author VitePress Sidebar Generator
 * @since 1.0.0
 */

import { resolve } from "path";
import {
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
    statSync,
    readdirSync,
} from "fs";
import { generateSidebars } from "./main";

/**
 * Configuration options for the sidebar library.
 * Controls how sidebars are generated, cached, and served.
 * 
 * @interface SidebarLibConfig
 * @since 1.0.0
 */
export interface SidebarLibConfig {
    /** Root directory of the project. Defaults to process.cwd() */
    rootDir?: string;
    /** Relative path to the docs directory from rootDir. Defaults to "./docs" */
    docsDir?: string;
    /** Relative path to the cache directory from rootDir. Defaults to "./.vitepress/cache/sidebar" */
    cacheDir?: string;
    /** Enable debug logging for troubleshooting. Defaults to false */
    debug?: boolean;
    /** Enable development mode features. Defaults to NODE_ENV === "development" */
    devMode?: boolean;
    /** Array of language codes to generate sidebars for. Required field */
    languages: string[];
}

/**
 * Default configuration values for the sidebar library.
 * Provides sensible defaults for all configuration options except languages.
 * 
 * @constant {Omit<Required<SidebarLibConfig>, "languages">}
 * @since 1.0.0
 * @private
 */
const defaultConfig: Omit<Required<SidebarLibConfig>, "languages"> = {
    rootDir: process.cwd(),
    docsDir: "./docs",
    cacheDir: "./.vitepress/cache/sidebar",
    debug: false,
    devMode: process.env.NODE_ENV === "development",
};

/**
 * Currently active configuration for the sidebar library.
 * Set via configureSidebar() or sidebarPlugin configuration.
 * 
 * @type {SidebarLibConfig | null}
 * @since 1.0.0
 * @private
 */
let currentConfig: SidebarLibConfig | null = null;

/**
 * In-memory cache for recently generated sidebars.
 * Improves performance by avoiding repeated generation for the same language.
 * 
 * @type {Map<string, {data: any, timestamp: number}>}
 * @since 1.0.0
 * @private
 */
const memoryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Cache expiration time in milliseconds (5 minutes).
 * Both memory cache and file cache entries expire after this duration.
 * 
 * @constant {number}
 * @since 1.0.0
 * @private
 */
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Internal function to configure the sidebar library.
 * Used by both the deprecated configureSidebar() and the sidebarPlugin.
 * 
 * @param {SidebarLibConfig} config - Configuration object with sidebar settings
 * @throws {Error} When languages array is missing or empty
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * _internalConfigureSidebar({
 *   rootDir: '/path/to/project',
 *   languages: ['en', 'zh'],
 *   debug: true
 * });
 * ```
 */
export function _internalConfigureSidebar(config: SidebarLibConfig): void {
    if (!config.languages || config.languages.length === 0) {
        throw new Error(
            "[SidebarLib] Configuration error: languages array is required and cannot be empty"
        );
    }

    currentConfig = { ...defaultConfig, ...config };

    if (currentConfig.debug) {
        console.log("[SidebarLib] Configuration updated:", currentConfig);
    }
}

/**
 * @deprecated Use sidebarPlugin configuration instead
 */
export function configureSidebar(config: SidebarLibConfig): void {
    console.warn('[SidebarLib] configureSidebar() is deprecated. Please configure via sidebarPlugin() in your vite config instead.');
    _internalConfigureSidebar(config);
}

/**
 * Retrieves the current sidebar configuration with all defaults applied.
 * If no configuration has been set, returns a default configuration with a warning.
 * 
 * @returns {Required<SidebarLibConfig>} Complete configuration object with all properties defined
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const config = getConfig();
 * console.log(config.languages); // ['en', 'zh']
 * console.log(config.debug); // false
 * ```
 */
export function getConfig(): Required<SidebarLibConfig> {
    if (!currentConfig) {
        console.warn('[SidebarLib] No configuration found. Please ensure sidebarPlugin is properly configured in your vite config.');
        
        return {
            ...defaultConfig,
            languages: ['']
        };
    }
    return currentConfig as Required<SidebarLibConfig>;
}

/**
 * Validates that a language code is configured in the current sidebar configuration.
 * 
 * @param {string} lang - Language code to validate
 * @throws {Error} When the language is not in the configured languages array
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * validateLanguage('en'); // OK if 'en' is configured
 * validateLanguage('fr'); // Throws error if 'fr' not configured
 * ```
 */
function validateLanguage(lang: string): void {
    const config = getConfig();

    if (!config.languages.includes(lang)) {
        throw new Error(
            `[SidebarLib] Language "${lang}" is not configured. Available languages: ${config.languages.join(
                ", "
            )}`
        );
    }
}

/**
 * Generates a unique cache key for a specific language.
 * 
 * @param {string} lang - Language code to generate key for
 * @returns {string} Cache key in format "sidebar_{lang}" or "sidebar_root" for empty lang
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * getCacheKey('en'); // Returns "sidebar_en"
 * getCacheKey(''); // Returns "sidebar_root"
 * ```
 */
function getCacheKey(lang: string): string {
    return `sidebar_${lang || "root"}`;
}

/**
 * Resolves the absolute file path for a language's cache file.
 * 
 * @param {string} lang - Language code to get cache path for
 * @returns {string} Absolute path to the cache file
 * @since 1.0.0
 * @private
 * @example
 * ```typescript
 * getFileCachePath('en'); // "/project/.vitepress/cache/sidebar/sidebar_en.json"
 * ```
 */
function getFileCachePath(lang: string): string {
    const config = getConfig();
    const cacheDir = resolve(config.rootDir, config.cacheDir);
    return resolve(cacheDir, `${getCacheKey(lang)}.json`);
}

function isFileCacheValid(lang: string): boolean {
    const config = getConfig();
    const cachePath = getFileCachePath(lang);

    if (!existsSync(cachePath)) {
        return false;
    }

    try {
        const cacheStats = statSync(cachePath);
        const now = Date.now();

        if (now - cacheStats.mtime.getTime() > CACHE_EXPIRY) {
            return false;
        }

        const docsPath = resolve(config.rootDir, config.docsDir, lang);
        if (existsSync(docsPath)) {
            const docsStats = statSync(docsPath);
            if (docsStats.mtime.getTime() > cacheStats.mtime.getTime()) {
                return false;
            }
        }

        return true;
    } catch (error) {
        if (config.debug) {
            console.warn(`[SidebarLib] Error checking cache validity:`, error);
        }
        return false;
    }
}

function readFileCache(lang: string): any | null {
    if (!isFileCacheValid(lang)) {
        return null;
    }

    const config = getConfig();
    const cachePath = getFileCachePath(lang);

    try {
        const content = readFileSync(cachePath, "utf-8");
        const data = JSON.parse(content);

        if (config.debug) {
            console.log(`[SidebarLib] File cache hit for ${lang}`);
        }

        return data;
    } catch (error) {
        if (config.debug) {
            console.warn(`[SidebarLib] Error reading file cache:`, error);
        }
        return null;
    }
}

function writeFileCache(lang: string, data: any): void {
    const config = getConfig();
    const cachePath = getFileCachePath(lang);
    const cacheDir = resolve(config.rootDir, config.cacheDir);

    try {
        if (!existsSync(cacheDir)) {
            mkdirSync(cacheDir, { recursive: true });
        }

        writeFileSync(cachePath, JSON.stringify(data, null, 2));

        if (config.debug) {
            console.log(`[SidebarLib] File cache written for ${lang}`);
        }
    } catch (error) {
        if (config.debug) {
            console.warn(`[SidebarLib] Error writing file cache:`, error);
        }
    }
}

async function generateSidebarForLang(lang: string): Promise<any> {
    const config = getConfig();

    if (config.debug) {
        console.log(`[SidebarLib] Generating sidebar for language: ${lang}`);
    }

    try {
        const result = await generateSidebars({
            docsPath: resolve(config.rootDir, config.docsDir),
            isDevMode: config.devMode,
            lang: lang,
        });

        if (!result) {
            if (config.debug) {
                console.warn(`[SidebarLib] No sidebar generated for ${lang}`);
            }
            return {};
        }

        const langPrefix = lang ? `/${lang}/` : "/";
        const langSidebar: Record<string, any[]> = {};

        for (const [path, items] of Object.entries(result)) {
            if (path.startsWith(langPrefix)) {
                const filteredItems = filterHiddenItems(items as any[]);
                if (filteredItems.length > 0) {
                    langSidebar[path] = filteredItems;
                }
            }
        }

        return langSidebar;
    } catch (error) {
        console.error(
            `[SidebarLib] Error generating sidebar for ${lang}:`,
            error
        );
        return {};
    }
}

function filterHiddenItems(items: any[]): any[] {
    if (!Array.isArray(items)) return items;

    return items
        .filter((item) => !item._hidden)
        .map((item) => {
            if (item.items && Array.isArray(item.items)) {
                return {
                    ...item,
                    items: filterHiddenItems(item.items),
                };
            }
            return item;
        });
}

function checkGeneratedFallback(lang: string): any | null {
    const config = getConfig();
    const generatedPath = resolve(
        config.rootDir,
        ".vitepress/config/generated",
        `sidebar_${lang || "root"}.json`
    );

    if (existsSync(generatedPath)) {
        try {
            const content = readFileSync(generatedPath, "utf-8");
            const data = JSON.parse(content);

            if (config.debug) {
                console.log(
                    `[SidebarLib] Using generated fallback for ${lang}`
                );
            }

            return data;
        } catch (error) {
            if (config.debug) {
                console.warn(
                    `[SidebarLib] Error reading generated fallback:`,
                    error
                );
            }
        }
    }

    return null;
}

function _getSidebarSyncInternal(lang: string): Record<string, any[]> {
    if (!currentConfig) {
        console.warn(`[SidebarLib] No configuration found. Auto-initializing with fallback config.`);
        _internalConfigureSidebar({
            languages: [''],
            debug: process.env.NODE_ENV === 'development'
        });
    }
    
    validateLanguage(lang);

    const config = getConfig();
    const cacheKey = getCacheKey(lang);
    const memoryItem = memoryCache.get(cacheKey);
    if (memoryItem && Date.now() - memoryItem.timestamp < CACHE_EXPIRY) {
        if (config.debug) {
            console.log(`[SidebarLib] Memory cache hit for ${lang}`);
        }
        return memoryItem.data;
    }
    const fileCache = readFileCache(lang);
    if (fileCache) {
        memoryCache.set(cacheKey, { data: fileCache, timestamp: Date.now() });
        return fileCache;
    }
    const fallback = checkGeneratedFallback(lang);
    if (fallback) {
        memoryCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
        writeFileCache(lang, fallback);
        return fallback;
    }

    if (config.debug) {
        console.warn(
            `[SidebarLib] No cache available for ${lang}, generating asynchronously...`
        );
    }

    generateSidebarForLang(lang)
        .then((data) => {
            memoryCache.set(cacheKey, { data, timestamp: Date.now() });
            writeFileCache(lang, data);
        })
        .catch((error) => {
            console.error(
                `[SidebarLib] Async generation failed for ${lang}:`,
                error
            );
        });

    return {};
}

export function getSidebarSync(lang: string): any {
    let cachedSidebar: any = null;
    let isGenerating = false;
    return new Proxy({}, {
        get(target, prop, receiver) {
            if (isGenerating) {
                return [];
            }
            if (cachedSidebar) {
                const result = Reflect.get(cachedSidebar, prop, receiver);
                return result === undefined ? [] : result;
            }
            try {
                isGenerating = true;
                cachedSidebar = _getSidebarSyncInternal(lang);
                const result = Reflect.get(cachedSidebar, prop, receiver);
                return result === undefined ? [] : result;
            } catch (error) {
                console.warn('[SidebarLib] Error generating sidebar:', error);
                return [];
            } finally {
                isGenerating = false;
            }
        },
        
        has(target, prop) {
            if (isGenerating) return false;
            if (!cachedSidebar) {
                try {
                    isGenerating = true;
                    cachedSidebar = _getSidebarSyncInternal(lang);
                } catch (error) {
                    console.warn('[SidebarLib] Error generating sidebar:', error);
                    return false;
                } finally {
                    isGenerating = false;
                }
            }
            return cachedSidebar ? Reflect.has(cachedSidebar, prop) : false;
        },
        
        ownKeys(target) {
            if (isGenerating) return [];
            if (!cachedSidebar) {
                try {
                    isGenerating = true;
                    cachedSidebar = _getSidebarSyncInternal(lang);
                } catch (error) {
                    console.warn('[SidebarLib] Error generating sidebar:', error);
                    return [];
                } finally {
                    isGenerating = false;
                }
            }
            return cachedSidebar ? Reflect.ownKeys(cachedSidebar) : [];
        },
        
        getOwnPropertyDescriptor(target, prop) {
            if (isGenerating) return undefined;
            if (!cachedSidebar) {
                try {
                    isGenerating = true;
                    cachedSidebar = _getSidebarSyncInternal(lang);
                } catch (error) {
                    console.warn('[SidebarLib] Error generating sidebar:', error);
                    return undefined;
                } finally {
                    isGenerating = false;
                }
            }
            return cachedSidebar ? Reflect.getOwnPropertyDescriptor(cachedSidebar, prop) : undefined;
        }
    });
}

export async function getSidebar(lang: string): Promise<Record<string, any[]>> {
    if (!currentConfig) {
        console.warn(`[SidebarLib] No configuration found. Auto-initializing with fallback config.`);
        _internalConfigureSidebar({
            languages: [''],
            debug: process.env.NODE_ENV === 'development'
        });
    }
    
    validateLanguage(lang);

    const config = getConfig();
    const cacheKey = getCacheKey(lang);

    const memoryItem = memoryCache.get(cacheKey);
    if (memoryItem && Date.now() - memoryItem.timestamp < CACHE_EXPIRY) {
        if (config.debug) {
            console.log(`[SidebarLib] Memory cache hit for ${lang}`);
        }
        return memoryItem.data;
    }

    const fileCache = readFileCache(lang);
    if (fileCache) {
        memoryCache.set(cacheKey, { data: fileCache, timestamp: Date.now() });
        return fileCache;
    }

    const data = await generateSidebarForLang(lang);

    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
    writeFileCache(lang, data);

    return data;
}

export async function getAllSidebars(): Promise<
    Record<string, Record<string, any[]>>
> {
    const config = getConfig();
    const result: Record<string, Record<string, any[]>> = {};

    for (const lang of config.languages) {
        result[lang || "root"] = await getSidebar(lang);
    }

    return result;
}

export function clearCache(lang?: string): void {
    const config = getConfig();

    if (lang) {
        validateLanguage(lang);

        const cacheKey = getCacheKey(lang);
        memoryCache.delete(cacheKey);

        const cachePath = getFileCachePath(lang);
        if (existsSync(cachePath)) {
            try {
                require("fs").unlinkSync(cachePath);
            } catch (error) {
                if (config.debug) {
                    console.warn(
                        `[SidebarLib] Error clearing file cache:`,
                        error
                    );
                }
            }
        }
    } else {
        memoryCache.clear();

        const cacheDir = resolve(config.rootDir, config.cacheDir);
        if (existsSync(cacheDir)) {
            try {
                const files = readdirSync(cacheDir);
                for (const file of files) {
                    if (file.startsWith("sidebar_") && file.endsWith(".json")) {
                        require("fs").unlinkSync(resolve(cacheDir, file));
                    }
                }
            } catch (error) {
                if (config.debug) {
                    console.warn(
                        `[SidebarLib] Error clearing cache directory:`,
                        error
                    );
                }
            }
        }
    }

    if (config.debug) {
        console.log(
            `[SidebarLib] Cache cleared${lang ? ` for ${lang}` : " (all)"}`
        );
    }
}

export function getConfiguredLanguages(): string[] {
    const config = getConfig();
    return [...config.languages];
}
