/**
 * @fileoverview Vite plugin for automatic sidebar generation and hot reloading.
 * 
 * This module provides a Vite plugin that integrates sidebar generation
 * into the build process and development workflow. Features include:
 * - Automatic sidebar generation on build start
 * - Hot reloading when markdown files or configurations change
 * - Intelligent caching and change detection
 * - VitePress-specific integration and reload triggers
 * - Multi-language support with per-language generation
 * 
 * @module SidebarPlugin
 * @version 1.0.0
 * @author VitePress Sidebar Generator
 * @since 1.0.0
 */

import { Plugin } from "vite";
import { resolve } from "path";
import { existsSync, statSync, readdirSync, utimesSync } from "fs";
import {
    _internalConfigureSidebar,
    getSidebar,
    clearCache,
    getConfig,
    type SidebarLibConfig,
} from "./lib";

/**
 * Configuration options specific to the sidebar Vite plugin.
 * Extends the base SidebarLibConfig with plugin-specific settings.
 * 
 * @interface SidebarPluginConfig
 * @extends SidebarLibConfig
 * @since 1.0.0
 */
export interface SidebarPluginConfig extends SidebarLibConfig {
    /** Enable hot reloading in development mode. Defaults to true */
    hotReload?: boolean;
    /** Delay in milliseconds before triggering reload after file changes. Defaults to 100ms */
    reloadDelay?: number;
}

/**
 * Flag to prevent concurrent sidebar generation processes.
 * Ensures only one generation runs at a time to avoid conflicts.
 * 
 * @type {boolean}
 * @since 1.0.0
 * @private
 */
let isGenerating = false;

/**
 * Timestamp of the last sidebar generation.
 * Used for throttling and avoiding unnecessary regenerations.
 * 
 * @type {number}
 * @since 1.0.0
 * @private
 */
let lastGenerationTime = 0;

export function sidebarPlugin(config: SidebarPluginConfig): Plugin {
    if (!config.languages || config.languages.length === 0) {
        throw new Error(
            "[SidebarPlugin] Configuration error: languages array is required and cannot be empty"
        );
    }

    _internalConfigureSidebar(config);

    const finalConfig = getConfig();
    const hotReload = config.hotReload !== false;
    const reloadDelay = config.reloadDelay || 100;

    const docsPath = resolve(finalConfig.rootDir, finalConfig.docsDir);
    const configPath = resolve(
        finalConfig.rootDir,
        ".vitepress/config/sidebar"
    );
    const generatedPath = resolve(
        finalConfig.rootDir,
        ".vitepress/config/generated"
    );

    /**
     * Determines if sidebar regeneration is needed for a specific language.
     * 
     * Checks if the cached sidebar file exists and compares modification times
     * of source files (index.md files and JSON configurations) against the
     * cached sidebar to determine if regeneration is necessary.
     * 
     * @param {string} lang - Language code to check regeneration for
     * @returns {boolean} True if regeneration is needed, false if cache is valid
     * @since 1.0.0
     * @private
     */
    function needsRegeneration(lang: string): boolean {
        const sidebarFile = resolve(
            generatedPath,
            `sidebar_${lang || "root"}.json`
        );

        if (!existsSync(sidebarFile)) {
            return true;
        }

        const sidebarStat = statSync(sidebarFile);
        const sidebarTime = sidebarStat.mtime.getTime();

        const indexFiles = findIndexFiles(resolve(docsPath, lang));
        for (const indexFile of indexFiles) {
            if (existsSync(indexFile)) {
                const indexStat = statSync(indexFile);
                if (indexStat.mtime.getTime() > sidebarTime) {
                    return true;
                }
            }
        }

        const jsonConfigDir = resolve(configPath, lang);
        if (existsSync(jsonConfigDir)) {
            const hasNewerConfigs = checkNewerConfigs(
                jsonConfigDir,
                sidebarTime
            );
            if (hasNewerConfigs) {
                return true;
            }
        }

        return false;
    }

    /**
     * Recursively finds all index.md files within a directory tree.
     * 
     * Performs a depth-first search through the directory structure,
     * collecting absolute paths to all index.md files found. Handles
     * read errors gracefully by skipping inaccessible directories.
     * 
     * @param {string} dir - Root directory path to search from
     * @returns {string[]} Array of absolute paths to index.md files
     * @since 1.0.0
     * @private
     */
    function findIndexFiles(dir: string): string[] {
        const results: string[] = [];

        if (!existsSync(dir)) return results;

        try {
            const items = readdirSync(dir);
            for (const item of items) {
                const fullPath = resolve(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    results.push(...findIndexFiles(fullPath));
                } else if (item === "index.md") {
                    results.push(fullPath);
                }
            }
        } catch (error) {
        }

        return results;
    }

    /**
     * Recursively checks if any JSON configuration files are newer than the sidebar.
     * 
     * Scans a configuration directory and all its subdirectories for JSON files,
     * comparing their modification times against the provided sidebar timestamp.
     * Returns true if any configuration file has been modified more recently.
     * 
     * @param {string} configDir - Directory path containing configuration files
     * @param {number} sidebarTime - Sidebar modification timestamp in milliseconds
     * @returns {boolean} True if any config file is newer than the sidebar
     * @since 1.0.0
     * @private
     */
    function checkNewerConfigs(
        configDir: string,
        sidebarTime: number
    ): boolean {
        try {
            const items = readdirSync(configDir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = resolve(configDir, item.name);

                if (item.isDirectory()) {
                    if (checkNewerConfigs(fullPath, sidebarTime)) {
                        return true;
                    }
                } else if (item.name.endsWith(".json")) {
                    const stat = statSync(fullPath);
                    if (stat.mtime.getTime() > sidebarTime) {
                        return true;
                    }
                }
            }
        } catch (error) {
        }

        return false;
    }

    function findAllJsonConfigFiles(): string[] {
        const results: string[] = [];

        if (!existsSync(configPath)) return results;

        function scanDirectory(dir: string) {
            try {
                const items = readdirSync(dir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = resolve(dir, item.name);

                    if (item.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (item.name.endsWith(".json")) {
                        results.push(fullPath);
                    }
                }
            } catch (error) {
            }
        }

        scanDirectory(configPath);
        return results;
    }

    async function generateSidebarsForAllLanguages() {
        if (isGenerating) {
            return;
        }

        isGenerating = true;
        const currentTime = Date.now();

        try {
            for (const lang of finalConfig.languages) {
                if (needsRegeneration(lang)) {
                    try {
                        await getSidebar(lang);

                        if (finalConfig.debug) {
                            console.log(
                                `[SidebarPlugin] Generated sidebar for ${lang}`
                            );
                        }
                    } catch (error) {
                        console.error(
                            `[SidebarPlugin] Failed to generate sidebar for ${lang}:`,
                            error
                        );
                    }
                }
            }

            lastGenerationTime = currentTime;
        } finally {
            isGenerating = false;
        }
    }

    function shouldTriggerRegeneration(filePath: string): boolean {
        return (
            filePath.endsWith("index.md") ||
            (filePath.includes(".vitepress/config/sidebar") &&
                filePath.endsWith(".json"))
        );
    }

    function triggerVitePressReload(server: any) {
        if (!hotReload) return;

        const configFile = resolve(
            finalConfig.rootDir,
            ".vitepress/config.mts"
        );
        if (existsSync(configFile)) {
            const now = new Date();
            utimesSync(configFile, now, now);
        }

        setTimeout(() => {
            server.ws.send({
                type: "full-reload",
            });
        }, reloadDelay);

        setTimeout(() => {
            server.ws.send({
                type: "update",
                updates: [],
            });
        }, reloadDelay + 100);
    }

    return {
        name: "vitepress-smart-sidebar",

        async buildStart() {
            if (finalConfig.debug) {
                console.log(
                    "[SidebarPlugin] Starting build with config:",
                    finalConfig
                );
                console.log(
                    "[SidebarPlugin] Configured languages:",
                    finalConfig.languages
                );
            }

            await generateSidebarsForAllLanguages();
        },

        configureServer(server) {
            if (finalConfig.debug) {
                console.log("[SidebarPlugin] Configuring development server");
                console.log(
                    "[SidebarPlugin] Watching languages:",
                    finalConfig.languages
                );
            }

            server.watcher.on("change", async (filePath) => {
                if (shouldTriggerRegeneration(filePath)) {
                    setTimeout(async () => {
                        if (Date.now() - lastGenerationTime > 1000) {
                            const lang = extractLanguageFromPath(filePath);
                            if (
                                lang !== null &&
                                finalConfig.languages.includes(lang)
                            ) {
                                clearCache(lang);
                            }

                            await generateSidebarsForAllLanguages();
                            triggerVitePressReload(server);
                        }
                    }, reloadDelay);
                }
            });

            server.watcher.on("add", async (filePath) => {
                if (shouldTriggerRegeneration(filePath)) {
                    const lang = extractLanguageFromPath(filePath);
                    if (lang !== null && finalConfig.languages.includes(lang)) {
                        clearCache(lang);
                    }

                    await generateSidebarsForAllLanguages();
                    triggerVitePressReload(server);
                }
            });

            server.watcher.on("unlink", async (filePath) => {
                if (shouldTriggerRegeneration(filePath)) {
                    const lang = extractLanguageFromPath(filePath);
                    if (lang !== null && finalConfig.languages.includes(lang)) {
                        clearCache(lang);
                    }

                    await generateSidebarsForAllLanguages();
                    triggerVitePressReload(server);
                }
            });

            const jsonConfigFiles = findAllJsonConfigFiles();
            for (const jsonFile of jsonConfigFiles) {
                server.watcher.add(jsonFile);
            }
        },
    };
}

function extractLanguageFromPath(filePath: string): string | null {
    const docsPath = resolve(process.cwd(), "docs");
    const relativePath = resolve(filePath).replace(docsPath, "");

    const match = relativePath.match(/^[\/\\]([^\/\\]+)/);
    if (match) {
        const potentialLang = match[1];
        if (
            existsSync(resolve(docsPath, potentialLang)) &&
            statSync(resolve(docsPath, potentialLang)).isDirectory()
        ) {
            return potentialLang;
        }
    }

    return "";
}
