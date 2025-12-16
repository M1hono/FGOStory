#!/usr/bin/env node

import { resolve, dirname, join, relative } from "path";
import {
    readFileSync,
    writeFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
} from "fs";
import matter from "gray-matter";
import { fileURLToPath } from "url";

// Get current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "../..");

/**
 * Load project configuration from TypeScript file
 */
function loadProjectConfig() {
    try {
        const configPath = resolve(
            projectRoot,
            ".vitepress/config/project-config.ts"
        );
        const configContent = readFileSync(configPath, "utf-8");

        // Extract languages configuration using regex
        const languagesMatch = configContent.match(
            /languages:\s*\[([\s\S]*?)\]/
        );
        if (!languagesMatch) {
            throw new Error("Could not find languages configuration");
        }

        const languagesStr = languagesMatch[1];

        // Extract individual language objects
        const languageObjects = [];
        const langMatches = [...languagesStr.matchAll(/\{([\s\S]*?)\}/g)];

        for (const match of langMatches) {
            const langObj = {};
            const langContent = match[1];

            // Extract properties
            const codeMatch = langContent.match(/code:\s*"([^"]+)"/);
            const linkMatch = langContent.match(/link:\s*"([^"]+)"/);
            const displayNameMatch = langContent.match(
                /displayName:\s*"([^"]+)"/
            );
            const isDefaultMatch = langContent.match(
                /isDefault:\s*(true|false)/
            );

            if (codeMatch) langObj.code = codeMatch[1];
            if (linkMatch) langObj.link = linkMatch[1];
            if (displayNameMatch) langObj.displayName = displayNameMatch[1];
            if (isDefaultMatch)
                langObj.isDefault = isDefaultMatch[1] === "true";

            if (langObj.code) {
                languageObjects.push(langObj);
            }
        }

        // Extract paths configuration
        const pathsMatch = configContent.match(/paths:\s*\{([\s\S]*?)\}/);
        const paths = { docs: "./docs", config: "./.vitepress/config" }; // defaults

        if (pathsMatch) {
            const pathsContent = pathsMatch[1];
            const docsMatch = pathsContent.match(/docs:\s*"([^"]+)"/);
            const configMatch = pathsContent.match(/config:\s*"([^"]+)"/);

            if (docsMatch) paths.docs = docsMatch[1];
            if (configMatch) paths.config = configMatch[1];
        }

        return {
            languages: languageObjects,
            paths: paths,
        };
    } catch (error) {
        console.warn("Failed to load project config:", error.message);
        console.warn("Using fallback configuration");

        // Fallback configuration
        return {
            languages: [
                {
                    code: "zh-CN",
                    displayName: "简体中文",
                    isDefault: true,
                    link: "/zh/",
                },
                {
                    code: "en-US",
                    displayName: "English",
                    isDefault: false,
                    link: "/en/",
                },
            ],
            paths: {
                docs: "./docs",
                config: "./.vitepress/config",
            },
        };
    }
}

// Load project configuration
const PROJECT_CONFIG = loadProjectConfig();

// Use paths from project config
const docsPath = resolve(
    projectRoot,
    PROJECT_CONFIG.paths.docs.replace("./", "")
);
const configPath = resolve(
    projectRoot,
    PROJECT_CONFIG.paths.config.replace("./", "")
);
const sidebarConfigPath = join(configPath, "sidebar");

/**
 * Sidebar Configuration to Frontmatter Sync Script
 *
 * This script reads the processed JSON configuration files from .vitepress/config/sidebar/
 * and syncs them back to the frontmatter of the corresponding markdown files.
 *
 * Key features:
 * - Reuses existing sidebar system components
 * - Handles _self_ configurations for directories
 * - Processes all four config types: locales, hidden, order, collapsed
 * - Auto-generates missing index.md files
 * - Preserves existing frontmatter while updating sidebar configs
 */
class ConfigToFrontmatterSync {
    constructor() {
        this.docsPath = docsPath;
        this.sidebarConfigPath = sidebarConfigPath;
        this.processedFiles = 0;
        this.createdIndexFiles = 0;
        this.dryRun = false;
        this.verbose = false;

        // Get languages from project config
        this.configuredLanguages = PROJECT_CONFIG.languages;
    }

    parseArgs(args) {
        const config = {
            dryRun: false,
            verbose: false,
            language: null,
            help: false,
        };

        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--dry-run":
                    config.dryRun = true;
                    break;
                case "--verbose":
                case "-v":
                    config.verbose = true;
                    break;
                case "--language":
                case "-l":
                    config.language = args[++i];
                    break;
                case "--help":
                case "-h":
                    config.help = true;
                    break;
            }
        }

        return config;
    }

    showHelp() {
        console.log(`
📝 Sidebar Config to Frontmatter Sync Script
    USAGE:
    npm run sync-config-to-frontmatter -- [options]

    OPTIONS:
    -l, --language <lang>    Process specific language only (e.g., 'zh', 'en')
        --dry-run            Preview changes without applying them
    -v, --verbose            Show detailed processing information
    -h, --help               Show this help message

    DESCRIPTION:
    This script reads the processed JSON configuration files from .vitepress/config/sidebar/
    and syncs the values back to the frontmatter of corresponding markdown files.
    
    Config types processed:
    - locales.json  → title field
    - hidden.json   → hidden field  
    - order.json    → priority field
    - collapsed.json → collapsed field (directories only)

    EXAMPLES:
    # Sync all languages
    npm run sync-config-to-frontmatter

    # Sync only Chinese docs
    npm run sync-config-to-frontmatter -- -l zh

    # Preview changes without applying
    npm run sync-config-to-frontmatter -- --dry-run -v
        `);
    }

    /**
     * Get all available languages from project config and validate against sidebar config
     */
    getAvailableLanguages() {
        try {
            // Get language codes from project config
            const configLanguages = this.configuredLanguages.map((lang) => {
                // Extract language code from link (e.g., /zh/ -> zh, /en/ -> en)
                const match = lang.link?.match(/^\/([^\/]+)\//);
                return match ? match[1] : lang.code.split("-")[0]; // fallback to first part of code
            });

            if (!existsSync(this.sidebarConfigPath)) {
                console.warn(
                    `Sidebar config directory does not exist: ${this.sidebarConfigPath}`
                );
                return configLanguages;
            }

            // Validate that sidebar config directories exist for configured languages
            const actualDirs = readdirSync(this.sidebarConfigPath, {
                withFileTypes: true,
            })
                .filter(
                    (entry) =>
                        entry.isDirectory() && !entry.name.startsWith(".")
                )
                .map((entry) => entry.name);

            const validLanguages = configLanguages.filter((lang) =>
                actualDirs.includes(lang)
            );

            if (this.verbose) {
                console.log(
                    `📋 Configured languages: ${configLanguages.join(", ")}`
                );
                console.log(
                    `📁 Available sidebar dirs: ${actualDirs.join(", ")}`
                );
                console.log(`✅ Valid languages: ${validLanguages.join(", ")}`);
            }

            return validLanguages;
        } catch (error) {
            console.warn(
                "Could not read sidebar config directory:",
                error.message
            );
            // Fallback to project config languages
            return this.configuredLanguages.map((lang) => {
                const match = lang.link?.match(/^\/([^\/]+)\//);
                return match ? match[1] : lang.code.split("-")[0];
            });
        }
    }

    /**
     * Read JSON configuration file safely
     */
    readJsonFile(type, lang, signature) {
        const filePath = signature
            ? join(this.sidebarConfigPath, lang, signature, `${type}.json`)
            : join(this.sidebarConfigPath, lang, `${type}.json`);

        try {
            if (existsSync(filePath)) {
                const content = readFileSync(filePath, "utf-8");
                if (content.trim() === "") return {};
                return JSON.parse(content);
            }
        } catch (error) {
            if (this.verbose) {
                console.warn(`Failed to read ${filePath}:`, error.message);
            }
        }
        return {};
    }

    /**
     * Find all configuration directories recursively
     */
    findAllConfigDirectories(lang) {
        const langConfigPath = join(this.sidebarConfigPath, lang);
        if (!existsSync(langConfigPath)) {
            return [];
        }

        const configDirs = [];

        const scanDirectory = (currentPath, currentSignature) => {
            try {
                // Check if current directory has config files
                const hasConfigs = [
                    "locales",
                    "hidden",
                    "order",
                    "collapsed",
                ].some((type) => existsSync(join(currentPath, `${type}.json`)));

                if (hasConfigs) {
                    configDirs.push(currentSignature);
                }

                // Recursively scan subdirectories
                const entries = readdirSync(currentPath, {
                    withFileTypes: true,
                });
                for (const entry of entries) {
                    if (entry.isDirectory() && !entry.name.startsWith(".")) {
                        const childPath = join(currentPath, entry.name);
                        const childSignature =
                            currentSignature === "_root"
                                ? entry.name
                                : join(currentSignature, entry.name).replace(
                                      /\\/g,
                                      "/"
                                  );

                        scanDirectory(childPath, childSignature);
                    }
                }
            } catch (error) {
                if (this.verbose) {
                    console.warn(
                        `Error scanning ${currentPath}:`,
                        error.message
                    );
                }
            }
        };

        scanDirectory(langConfigPath, "_root");
        return configDirs;
    }

    /**
     * Convert directory signature to actual file system path
     */
    signatureToPath(signature, lang) {
        if (signature === "_root") {
            return join(this.docsPath, lang);
        }
        return join(this.docsPath, lang, signature);
    }

    /**
     * Extract frontmatter configuration and sync with JSON configs
     */
    syncConfigToFrontmatter(filePath, configs) {
        try {
            let content = "";
            let parsed = { data: {}, content: "" };

            if (existsSync(filePath)) {
                content = readFileSync(filePath, "utf-8");
                parsed = matter(content);
            }

            // Ensure data object exists
            if (!parsed.data) {
                parsed.data = {};
            }

            let hasChanges = false;
            const changes = [];

            // Sync title from locales config
            if (
                configs.title !== undefined &&
                configs.title !== parsed.data.title
            ) {
                const oldValue = parsed.data.title || "(none)";
                parsed.data.title = configs.title;
                hasChanges = true;
                changes.push(`title: "${oldValue}" → "${configs.title}"`);
            }

            // Sync hidden from hidden config
            if (
                configs.hidden !== undefined &&
                configs.hidden !== parsed.data.hidden
            ) {
                const oldValue = parsed.data.hidden ?? "(none)";
                parsed.data.hidden = configs.hidden;
                hasChanges = true;
                changes.push(`hidden: ${oldValue} → ${configs.hidden}`);
            }

            // Sync priority from order config
            if (
                configs.priority !== undefined &&
                configs.priority !== parsed.data.priority
            ) {
                const oldValue = parsed.data.priority ?? "(none)";
                parsed.data.priority = configs.priority;
                hasChanges = true;
                changes.push(`priority: ${oldValue} → ${configs.priority}`);
            }

            // Sync collapsed from collapsed config (directories only)
            if (
                configs.collapsed !== undefined &&
                configs.collapsed !== parsed.data.collapsed
            ) {
                const oldValue = parsed.data.collapsed ?? "(none)";
                parsed.data.collapsed = configs.collapsed;
                hasChanges = true;
                changes.push(`collapsed: ${oldValue} → ${configs.collapsed}`);
            }

            if (hasChanges || this.verbose) {
                const relativePath = relative(process.cwd(), filePath);
                console.log(
                    `📄 ${relativePath}${existsSync(filePath) ? "" : " (new)"}`
                );
                changes.forEach((change) => console.log(`   ${change}`));
            }

            // Only write if there are actual changes or file doesn't exist
            if ((hasChanges || !existsSync(filePath)) && !this.dryRun) {
                // Ensure directory exists
                const dir = dirname(filePath);
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }

                // Generate new content
                const newContent = matter.stringify(
                    parsed.content,
                    parsed.data
                );

                // Only write if content actually differs or file doesn't exist
                let shouldWrite = !existsSync(filePath);
                if (!shouldWrite && existsSync(filePath)) {
                    const currentContent = readFileSync(filePath, "utf-8");
                    shouldWrite = currentContent !== newContent;
                }

                if (shouldWrite) {
                    writeFileSync(filePath, newContent);
                    this.processedFiles++;

                    if (!existsSync(filePath)) {
                        this.createdIndexFiles++;
                    }
                }
            }

            return hasChanges;
        } catch (error) {
            console.error(
                `❌ Error processing ${relative(process.cwd(), filePath)}: ${
                    error.message
                }`
            );
            return false;
        }
    }

    /**
     * Process a single configuration directory
     */
    processConfigDirectory(signature, lang) {
        const actualPath = this.signatureToPath(signature, lang);

        if (this.verbose) {
            console.log(
                `🔍 Processing config directory: ${signature} → ${relative(
                    this.docsPath,
                    actualPath
                )}`
            );
        }

        // Read all four config types
        const localesConfig = this.readJsonFile("locales", lang, signature);
        const hiddenConfig = this.readJsonFile("hidden", lang, signature);
        const orderConfig = this.readJsonFile("order", lang, signature);
        const collapsedConfig = this.readJsonFile("collapsed", lang, signature);

        // Process _self_ configuration (for directory's own index.md)
        if (
            localesConfig._self_ !== undefined ||
            hiddenConfig._self_ !== undefined ||
            orderConfig._self_ !== undefined ||
            collapsedConfig._self_ !== undefined
        ) {
            const indexPath = join(actualPath, "index.md");
            const selfConfigs = {};

            if (localesConfig._self_ !== undefined) {
                selfConfigs.title = localesConfig._self_;
            }
            if (hiddenConfig._self_ !== undefined) {
                selfConfigs.hidden = hiddenConfig._self_;
            }
            if (orderConfig._self_ !== undefined) {
                selfConfigs.priority = orderConfig._self_;
            }
            if (collapsedConfig._self_ !== undefined) {
                selfConfigs.collapsed = collapsedConfig._self_;
            }

            this.syncConfigToFrontmatter(indexPath, selfConfigs);
        }

        // Process individual file and directory configurations
        const allKeys = new Set([
            ...Object.keys(localesConfig),
            ...Object.keys(hiddenConfig),
            ...Object.keys(orderConfig),
            ...Object.keys(collapsedConfig),
        ]);

        for (const key of allKeys) {
            if (key === "_self_") continue;

            const configs = {};

            if (localesConfig[key] !== undefined) {
                configs.title = localesConfig[key];
            }
            if (hiddenConfig[key] !== undefined) {
                configs.hidden = hiddenConfig[key];
            }
            if (orderConfig[key] !== undefined) {
                configs.priority = orderConfig[key];
            }
            if (collapsedConfig[key] !== undefined) {
                configs.collapsed = collapsedConfig[key];
            }

            // Determine target file path
            let targetPath;
            if (key.endsWith("/")) {
                // Directory - sync to its index.md
                targetPath = join(actualPath, key, "index.md");
            } else if (key.endsWith(".md")) {
                // Markdown file
                targetPath = join(actualPath, key);
            } else {
                // Assume it's a file without extension, add .md
                targetPath = join(actualPath, `${key}.md`);
            }

            this.syncConfigToFrontmatter(targetPath, configs);
        }
    }

    /**
     * Process a single language
     */
    async processLanguage(lang) {
        console.log(`🌐 Processing language: ${lang}`);

        const configDirectories = this.findAllConfigDirectories(lang);

        if (configDirectories.length === 0) {
            console.log(`   No configuration directories found for ${lang}`);
            return;
        }

        console.log(
            `   Found ${configDirectories.length} configuration directories`
        );

        for (const signature of configDirectories) {
            this.processConfigDirectory(signature, lang);
        }
    }

    /**
     * Show processing summary
     */
    showSummary() {
        console.log("\n📊 Summary:");
        console.log(`   Processed files: ${this.processedFiles}`);
        console.log(`   Created index.md files: ${this.createdIndexFiles}`);

        if (this.dryRun && this.processedFiles > 0) {
            console.log("\n💡 Run without --dry-run to apply changes");
        }
    }

    /**
     * Main execution function
     */
    async run(args = process.argv.slice(2)) {
        console.log("🚀 Sidebar Config to Frontmatter Sync\n");

        const config = this.parseArgs(args);

        if (config.help) {
            this.showHelp();
            return;
        }

        this.dryRun = config.dryRun;
        this.verbose = config.verbose;

        // Determine languages to process
        const availableLanguages = this.getAvailableLanguages();
        const languagesToProcess = config.language
            ? [config.language]
            : availableLanguages;

        if (languagesToProcess.length === 0) {
            console.log("❌ No languages found to process");
            return;
        }

        // Show configuration
        console.log("⚙️  Configuration:");
        console.log(`   Languages: ${languagesToProcess.join(", ")}`);
        console.log(`   Dry run: ${this.dryRun ? "Yes" : "No"}`);
        console.log(`   Verbose: ${this.verbose ? "Yes" : "No"}`);
        console.log("");

        if (this.dryRun) {
            console.log("🧪 DRY RUN MODE - No files will be modified\n");
        }

        // Process each language
        for (const lang of languagesToProcess) {
            await this.processLanguage(lang);
        }

        this.showSummary();
    }
}

// Run the script if called directly
import { pathToFileURL } from "url";

const scriptPath = pathToFileURL(process.argv[1]).href;
const isMainModule = import.meta.url === scriptPath;

if (isMainModule) {
    const syncer = new ConfigToFrontmatterSync();
    syncer.run().catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
}

export default ConfigToFrontmatterSync;
