/**
 * @fileoverview Project configuration for VitePress template
 * @author M1hono
 * @version 1.0.0
 */

/**
 * Main project configuration
 * Modify values below to customize your VitePress site
 */
export const projectConfig: ProjectConfig = {
    /**
     * Project name， Must be your repo name.
     */
    name: "M1honoVitepressTemplate",

    /**
     * IMPORTANT: Change this to your repository name for GitHub Pages deployment
     * Format: "/your-repo-name/"
     */
    base: "/M1honoVitepressTemplate/",

    keyWords: ["VitePress", "template", "documentation", "wiki", "markdown"],
    version: "1.0.0",
    author: "M1hono",
    license: "CC BY-SA 4.0",

    /**
     * Favicon configuration
     * Can be a local file path (relative to base) or external URL
     */
    favicon: "logo.png", // or "favicon.ico" or "https://example.com/icon.svg"

    /**
     * Logo configuration
     * Can be a simple string path or an object with light/dark theme logos
     */
    logo: {
        light: "/logo.png",
        dark: "/logodark.png",
        alt: "Site Logo",
    },
    repository: {
        type: "git",
        url: "https://github.com/M1hono/M1honoVitepressTemplate",
    },
    homepage: "https://m1hono.github.io/M1honoVitepressTemplate/",

    defaultCurrency: "CNY",

    /**
     * Language configurations for multi-language support
     * Add or modify languages here to enable i18n functionality
     * See LanguageConfig interface below for detailed field documentation
     */
    languages: [
        {
            code: "zh-CN",
            name: "zh-CN",
            displayName: "简体中文",
            isDefault: false,
            link: "/zh-CN/",
            label: "简体中文",
            fileName: "zh.ts",
            giscusLang: "zh-CN",
        },
        {
            code: "en-US",
            name: "en-US",
            displayName: "English",
            isDefault: true,
            link: "/en-US/",
            label: "English",
            fileName: "en.ts",
            giscusLang: "en",
        },
    ],

    paths: {
        root: ".",
        docs: "./src",
        src: "./src",
        public: "./src/public",
        vitepress: "./.vitepress",
        config: "./.vitepress/config",
        theme: "./.vitepress/theme",
        scripts: "./.vitepress/scripts",
        utils: "./.vitepress/utils",
        cache: "./.vitepress/cache",
        build: "./.vitepress/dist",
    },

    /**
     * Algolia search configuration
     * Set up your Algolia credentials to enable search
     */
    algolia: {
        appId: "",
        apiKey: "",
        indexName: "",
    },

    /**
     * Feature toggles
     * Enable or disable features as needed
     */
    features: {
        search: false,
        gitChangelog: true,
        mermaid: true,
        drawio: true,
        markmap: true,
        multilingual: true,
        autoSidebar: true,
        editLink: true,
    },

    customSnippetFileNames: [],

    /**
     * Deployment configuration
     * Set type to control deployment strategy: 'github-pages' | 'server' | 'custom'
     * Note: SSH credentials (host, username, private key) are managed via GitHub repository secrets
     */
    deployment: {
        type: "github-pages",
        server: {
            remotePath: "/var/www/html",
            port: 22,
            excludeFiles: [".git", "node_modules", "*.log"],
        },
        custom: {
            deployCommand: "",
            postDeployCommand: "",
        },
    },

    /**
     * Configuration for the "Copy Link" button
     */
    copyLinkConfig: {
        removeLanguage: false,
    },

    /**
     * Header social media links
     */
    headerSocialLinks: [
        {
            icon: "github",
            link: "https://github.com/M1hono/M1honoVitepressTemplate",
            ariaLabel: "GitHub Repository",
        },
    ],

    /**
     * Edit link configuration
     */
    editLink: {
        pattern:
            "https://github.com/M1hono/M1honoVitepressTemplate/edit/main/docs/src/:path",
        text: "Edit this page on GitHub",
    },

    /**
     * Configuration for floating social media buttons
     * Add or modify buttons that appear on the side of the page
     */
    socialButtons: [
        {
            name: "discord",
            title: "Join our Discord",
            link: "https://discord.gg/uPJHxU46td",
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="#ffffff" d="m22 24l-5.25-5l.63 2H4.5A2.5 2.5 0 0 1 2 18.5v-15A2.5 2.5 0 0 1 4.5 1h15A2.5 2.5 0 0 1 22 3.5V24M12 6.8c-2.68 0-4.56 1.15-4.56 1.15c1.03-.92 2.83-1.45 2.83-1.45l-.17-.17c-1.69.03-3.22 1.2-3.22 1.2c-1.72 3.59-1.61 6.69-1.61 6.69c1.4 1.81 3.48 1.68 3.48 1.68l.71-.9c-1.25-.27-2.04-1.38-2.04-1.38S9.3 14.9 12 14.9s4.58-1.28 4.58-1.28s-.79 1.11-2.04 1.38l.71.9s2.08.13 3.48-1.68c0 0 .11-3.1-1.61-6.69c0 0-1.53-1.17-3.22-1.2l-.17.17s1.8.53 2.83 1.45c0 0-1.88-1.15-4.56-1.15m-2.07 3.79c.65 0 1.18.57 1.17 1.27c0 .69-.52 1.27-1.17 1.27c-.64 0-1.16-.58-1.16-1.27c0-.7.51-1.27 1.16-1.27m4.17 0c.65 0 1.17.57 1.17 1.27c0 .69-.52 1.27-1.17 1.27c-.64 0-1.16-.58-1.16-1.27c0-.7.51-1.27 1.16-1.27Z"/></svg>',
        },
        {
            name: "github",
            title: "View on GitHub",
            link: "https://github.com/M1hono",
            icon: '<svg t="1752769057351" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1755" width="200" height="200"><path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z" p-id="1756" fill="#ffffff"></path></svg>',
        },
    ],

    /**
     * Special path configurations for the 'Back' button
     * Defines custom navigation behavior for specific URL patterns
     */
    specialBackPaths: [
        {
            regex: "^/(\\w{2}-\\w{2}|\\w{2})/guide/advanced/\\w+",
            targetPath: "/{1}/guide/advanced/",
        },
        {
            regex: "^/(\\w{2}-\\w{2}|\\w{2})/blog/(\\d{4})/\\w+",
            targetPath: "/{1}/blog/{2}/",
        },
        {
            regex: "^/(\\w{2}-\\w{2}|\\w{2})/reference/components/\\w+",
            targetPath: "/{1}/reference/components/",
        },
    ],

    /**
     * Footer options configuration
     */
    footerOptions: {
        showIcp: false,
        showPolice: false,
        showLicense: true,
        licenseText: "CC BY-SA 4.0",
        licenseLink: "https://creativecommons.org/licenses/by-sa/4.0/",
        showSiteStats: false,
        siteStatsProvider: "busuanzi",
    },

    /**
     * Draw.io plugin configuration
     */
    drawio: {
        width: "100%",
        height: "600px",
        page: 0,
        darkMode: "auto",
        resize: true,
        pages: true,
        zoom: true,
        layers: false,
        lightbox: true,
        highlight: "#0000ff",
        transparent: false,
    },

    /**
     * Markdown Variables plugin configuration
     */
    mdVar: {
        prefix: "-%",
        noVarPrefix: "\\%",
        persistence: true,
        styling: "default",
    },
};

/**
 * Language configuration interface for multi-language support
 *
 * @example
 * ```ts
 * const enConfig: LanguageConfig = {
 *   code: "en-US",           // Must match VitePress locale key
 *   name: "en-US",           // Internal identifier, usually same as code
 *   displayName: "English",  // What users see in language switcher
 *   isDefault: true,         // Makes this the default language (use "root" in VitePress)
 *   link: "/en-US/",         // URL path, determines VitePress language routing
 *   label: "English",        // Fallback for displayName in UI components
 *   fileName: "en.ts",       // Translation file name in i18n directory
 *   giscusLang: "en"         // Language for Giscus comment system
 * }
 * ```
 */
export interface LanguageConfig {
    /** ISO 639-1 language code (e.g., "en-US", "zh-CN") - must match VitePress locale configuration */
    code: string;

    /** Internal identifier for the language, typically same as code for consistency */
    name: string;

    /** Human-readable name shown in language switcher dropdown and UI */
    displayName: string;

    /** Set to true for default language (becomes "root" in VitePress config) */
    isDefault?: boolean;

    /** URL path prefix like "/en-US/" - determines VitePress language routing behavior */
    link?: string;

    /** Display label for UI components, falls back to displayName if not set */
    label?: string;

    /** Translation file name (e.g., "en.ts", "zh.ts") for i18n message files */
    fileName?: string;

    /** Language code for Giscus comment system integration */
    giscusLang?: string;
}

/**
 * File system paths configuration for VitePress project structure
 *
 * @example
 * ```ts
 * const paths: PathConfig = {
 *   root: ".",                    // Project root, usually current directory
 *   docs: "./src",               // Where your .md files live
 *   src: "./src",                // Source directory (same as docs typically)
 *   public: "./src/public",      // Static assets (images, favicons, etc.)
 *   vitepress: "./.vitepress",   // VitePress configuration folder
 *   config: "./.vitepress/config", // Configuration files location
 *   theme: "./.vitepress/theme",   // Custom theme files
 *   scripts: "./.vitepress/scripts", // Build and utility scripts
 *   utils: "./.vitepress/utils",    // Helper functions and utilities
 *   cache: "./.vitepress/cache",    // Build cache directory
 *   build: "./.vitepress/dist"      // Final build output directory
 * }
 * ```
 */
export interface PathConfig {
    /** Project root directory, typically "." for current directory */
    root: string;

    /** Documentation source directory where .md files are located */
    docs: string;

    /** Source files directory, usually same as docs for VitePress */
    src: string;

    /** Static assets directory for images, favicons, and other public files */
    public: string;

    /** VitePress configuration directory containing all VitePress-specific files */
    vitepress: string;

    /** Configuration files directory for project settings and options */
    config: string;

    /** Custom theme directory for theme overrides and customizations */
    theme: string;

    /** Build and utility scripts directory for automation and tooling */
    scripts: string;

    /** Utility functions directory for shared helper functions */
    utils: string;

    /** Build cache directory for faster subsequent builds */
    cache: string;

    /** Final build output directory where generated site files are placed */
    build: string;
}

/**
 * Configuration for the "Copy Link" button
 */
export interface CopyLinkConfig {
    /** Whether to remove the language key from the copied URL */
    removeLanguage: boolean;
}

/**
 * Configuration for a single social media button
 */
export interface SocialButton {
    /** Unique name for the button (used for i18n keys and CSS classes) */
    name: string;
    /** The text to display as a tooltip on hover */
    title: string;
    /** The URL the button links to */
    link: string;
    /** The raw SVG string for the button's icon */
    icon: string;
}

/**
 * Configuration for special 'Back' button navigation paths
 */
export interface SpecialBackPath {
    /** A string representing the regex to match the current path */
    regex: string;
    /** A template for the target path, where {n} is replaced by the nth capture group from the regex */
    targetPath: string;
}

/**
 * Footer options configuration interface
 */
export interface FooterOptionsConfig {
    /** Whether to show ICP filing information */
    showIcp: boolean;
    /** Whether to show police filing information */
    showPolice: boolean;
    /** Whether to show license information */
    showLicense: boolean;
    /** License text to display */
    licenseText: string;
    /** License link URL */
    licenseLink: string;
    /** Whether to show site statistics (visits, page views) */
    showSiteStats: boolean;
    /**
     * Site statistics provider ('busuanzi' | 'vercount' | 'custom') 
     * Currently, only 'busuanzi' is supported.
    */
    siteStatsProvider: 'busuanzi' | 'vercount' | 'custom';
}

/**
 * Draw.io plugin configuration interface
 */
export interface DrawioConfig {
    /** Default width of diagrams */
    width: string;
    /** Default height of diagrams */
    height: string;
    /** Start page index */
    page: number;
    /** Dark mode setting */
    darkMode: "light" | "dark" | "auto";
    /** Enable toolbar resize */
    resize: boolean;
    /** Enable toolbar change pages */
    pages: boolean;
    /** Enable toolbar zoom */
    zoom: boolean;
    /** Enable toolbar layers */
    layers: boolean;
    /** Enable toolbar lightbox */
    lightbox: boolean;
    /** Highlight color */
    highlight: string;
    /** Transparent background */
    transparent: boolean;
}

/**
 * Markdown Variables plugin configuration interface
 */
export interface MdVarConfig {
    /** Strings that start with this prefix are treated as variables */
    prefix: string;
    /** Strings that start with this prefix are NOT treated as variables */
    noVarPrefix: string;
    /** Enable variable persistence across pages */
    persistence: boolean;
    /** Styling theme: "default", "thr" (The Hacker Recipes), or custom CSS */
    styling: "default" | "thr" | string;
}

/**
 * Deployment configuration interface for different deployment strategies
 * SSH credentials (host, username, private key) are managed via GitHub repository secrets for security
 *
 * @example
 * ```ts
 * // GitHub Pages deployment (default) - no additional configuration needed
 * const githubDeployment: DeploymentConfig = {
 *   type: 'github-pages',
 *   server: { remotePath: '', port: 22, excludeFiles: [] },
 *   custom: { deployCommand: '', postDeployCommand: '' }
 * }
 *
 * // Server deployment via SSH - credentials managed via GitHub secrets
 * const serverDeployment: DeploymentConfig = {
 *   type: 'server',
 *   server: {
 *     remotePath: '/var/www/html',              // Where to deploy files on server
 *     port: 22,                                 // SSH port (usually 22)
 *     excludeFiles: ['.git', 'node_modules', '*.log']  // Files to exclude from deployment
 *   },
 *   custom: { deployCommand: '', postDeployCommand: '' }
 * }
 * // Note: Set SSH_HOST, SSH_USERNAME, SSH_PRIVATE_KEY in GitHub repository secrets
 *
 * // Custom deployment with user-defined commands
 * const customDeployment: DeploymentConfig = {
 *   type: 'custom',
 *   server: { remotePath: '', port: 22, excludeFiles: [] },
 *   custom: {
 *     deployCommand: 'vercel --prod --dir docs/.vitepress/dist',
 *     postDeployCommand: 'curl -X POST https://your-webhook.com/deployed'
 *   }
 * }
 * ```
 */
export interface DeploymentConfig {
    /** Deployment strategy type: 'github-pages' | 'server' | 'custom' */
    type: "github-pages" | "server" | "custom";

    /** Server deployment configuration (only used when type is 'server') - SSH credentials managed via GitHub secrets */
    server: {
        /** Remote path on server where files should be deployed (e.g., '/var/www/html', '/home/user/public_html') */
        remotePath: string;
        /** SSH port number (default: 22, some servers use custom ports like 2222) */
        port: number;
        /** Files and directories to exclude from deployment (e.g., ['.git', 'node_modules', '*.log']) */
        excludeFiles: string[];
    };

    /** Custom deployment configuration (only used when type is 'custom') */
    custom: {
        /** Custom deployment command (e.g., 'vercel deploy', 'docker push', 'rsync -avz ...') */
        deployCommand: string;
        /** Optional post-deployment command (e.g., webhooks, cache invalidation, service restarts) */
        postDeployCommand: string;
    };
}

/**
 * Complete project configuration interface containing all VitePress site settings
 *
 * @example
 * ```ts
 * const config: ProjectConfig = {
 *   name: "my-docs",                    // Site title and project name
 *   base: "/my-repo/",                  // GitHub Pages base path (CRITICAL for deployment)
 *   keyWords: ["docs", "guide"],        // SEO keywords for meta tags
 *   description: "My documentation",    // Site description for SEO
 *   version: "1.0.0",                   // Current project version
 *   author: "Your Name",                // Project author for metadata
 *   license: "MIT",                     // License type
 *   repository: {                       // Git repository information
 *     type: "git",
 *     url: "https://github.com/user/repo"
 *   },
 *   homepage: "https://user.github.io/repo/", // Live site URL
 *   defaultCurrency: "USD",             // For financial components
 *   languages: [...],                   // Multi-language configuration
 *   paths: {...},                       // File system paths
 *   features: {...},                    // Feature toggles
 *   sidebarTags: {...},                 // Sidebar tags configuration
 *   algolia: {...},                     // Search configuration
 *   deployment: {...}                   // Deployment configuration
 * }
 * ```
 */
export interface ProjectConfig {
    /** Project name used in site title, metadata, and branding */
    name: string;

    /** Base URL path for deployment - MUST match your repository name for GitHub Pages (e.g., "/my-repo/") */
    base: string;

    /** SEO keywords array for meta tags and search engine optimization */
    keyWords: string[];

    /** Current project version for display and tracking */
    version: string;

    /** Project author name for copyright and metadata */
    author: string;

    /** License type (e.g., "MIT", "Apache-2.0") for legal information */
    license: string;

    /** Favicon path (relative to base) or external URL */
    favicon: string;

    /** Logo configuration - can be string for single logo or object for light/dark themes */
    logo:
        | string
        | {
              /** Logo for light theme */
              light: string;
              /** Logo for dark theme */
              dark: string;
              /** Alt text for the logo */
              alt?: string;
          };

    /** Git repository information for source links and integrations */
    repository: {
        /** Repository type, typically "git" */
        type: string;
        /** Full repository URL for GitHub integration and edit links */
        url: string;
    };

    /** Live site URL for canonical links and social media */
    homepage: string;

    /** Default currency code for Bills component and financial calculations */
    defaultCurrency: string;

    /** Multi-language configuration array for i18n support */
    languages: LanguageConfig[];

    /** File system paths configuration for project structure */
    paths: PathConfig;

    /** Feature toggle flags for enabling/disabling optional functionality */
    features: {
        /** Enable Algolia search integration (requires algolia config) */
        search: boolean;
        /** Enable Git-based changelog generation from commit history */
        gitChangelog: boolean;
        /** Enable Mermaid diagram support in markdown */
        mermaid: boolean;
        /** Enable Draw.io diagram support in markdown */
        drawio: boolean;
            /** Enable Markmap diagram support in markdown */
        markmap: boolean;
        /** Enable multi-language support and language switcher */
        multilingual: boolean;
        /** Enable automatic sidebar generation from file structure */
        autoSidebar: boolean;
        /** Enable edit link in page footer */
        editLink: boolean;
    };

    /** Custom code snippet file names for hero page floating animation effects */
    customSnippetFileNames?: string[];

    /** Algolia search service configuration (leave empty to disable search) */
    algolia: {
        /** Algolia application ID from your Algolia dashboard */
        appId: string;
        /** Algolia search API key (public, not admin key) */
        apiKey: string;
        /** Algolia search index name for your documentation */
        indexName: string;
    };

    /** Deployment configuration for different deployment strategies */
    deployment: DeploymentConfig;

    /** Configuration for floating social media buttons */
    socialButtons: SocialButton[];

    /** Special path configurations for the 'Back' button */
    specialBackPaths: SpecialBackPath[];

    /** Configuration for the "Copy Link" button */
    copyLinkConfig: CopyLinkConfig;

    /** Social media links in header */
    headerSocialLinks?: Array<{
        icon: string | { svg: string };
        link: string;
        ariaLabel?: string;
    }>;

    /** Edit link configuration */
    editLink?: {
        pattern: string;
        text?: string;
    };

    /** Footer options configuration */
    footerOptions: FooterOptionsConfig;

    /** Draw.io plugin configuration */
    drawio: DrawioConfig;

    /** Markdown Variables plugin configuration */
    mdVar: MdVarConfig;
}

/**
 * Get all configured languages from project configuration
 * @returns Array of all language configurations
 *
 * @example
 * ```ts
 * const languages = getLanguages();
 * console.log(languages.map(lang => lang.displayName)); // ["English", "简体中文"]
 * ```
 */
export function getLanguages(): LanguageConfig[] {
    return projectConfig.languages;
}

/**
 * Get the default language configuration
 * Returns the language marked as default, or first language as fallback
 * @returns Default language configuration
 *
 * @example
 * ```ts
 * const defaultLang = getDefaultLanguage();
 * console.log(defaultLang.code); // "en-US"
 * ```
 */
export function getDefaultLanguage(): LanguageConfig {
    return (
        projectConfig.languages.find((lang) => lang.isDefault) ||
        projectConfig.languages[0]
    );
}

/**
 * Get array of all language codes for iteration and validation
 * @returns Array of language codes (e.g., ['en-US', 'zh-CN'])
 *
 * @example
 * ```ts
 * const codes = getLanguageCodes();
 * if (codes.includes('zh-CN')) {
 *   console.log('Chinese is supported');
 * }
 * ```
 */
export function getLanguageCodes(): string[] {
    return projectConfig.languages.map((lang) => lang.code);
}

/**
 * Get all language links
 * @returns Array of language links (e.g., ['/zh/', '/en/'])
 *
 * @example
 * ```ts
 * const links = getLanguageLinks();
 * // Returns: ['/zh/', '/en/']
 * ```
 */
export function getLanguageLinks(): string[] {
    return projectConfig.languages.map((lang) => lang.link);
}

/**
 * Find language configuration by language code
 * @param code - Language code to search for (e.g., 'en-US', 'zh-CN')
 * @returns Language configuration or undefined if not found
 *
 * @example
 * ```ts
 * const chinese = getLanguageByCode('zh-CN');
 * if (chinese) {
 *   console.log(chinese.displayName); // "简体中文"
 * }
 * ```
 */
export function getLanguageByCode(code: string): LanguageConfig | undefined {
    return projectConfig.languages.find((lang) => lang.code === code);
}

/**
 * Generate VitePress-compatible locales configuration
 * Converts our language config to the format VitePress expects
 * @returns VitePress locales configuration object
 *
 * @example
 * ```ts
 * const locales = getLocalesConfig();
 * // Returns: {
 * //   root: { label: 'English', lang: 'en-US', link: '/' },
 * //   'zh-CN': { label: '简体中文', lang: 'zh-CN', link: '/zh-CN/' }
 * // }
 * ```
 */
export function getLocalesConfig() {
    const locales: Record<string, any> = {};

    projectConfig.languages.forEach((lang) => {
        const key = lang.isDefault ? "root" : lang.code;
        locales[key] = {
            label: lang.label || lang.displayName,
            lang: lang.name,
            link: lang.link || (lang.isDefault ? "/" : `/${lang.code}/`),
        };
    });

    return locales;
}

/**
 * Get the default currency setting for financial components
 * @returns Default currency code (e.g., 'CNY', 'USD', 'EUR')
 *
 * @example
 * ```ts
 * const currency = getDefaultCurrency();
 * console.log(`Using ${currency} for calculations`); // "Using CNY for calculations"
 * ```
 */
export function getDefaultCurrency(): string {
    return projectConfig.defaultCurrency;
}

/**
 * Get file system paths configuration for build tools and utilities
 * @returns Complete path configuration object
 *
 * @example
 * ```ts
 * const paths = getPaths();
 * console.log(paths.docs); // "./src"
 * console.log(paths.build); // "./.vitepress/dist"
 * ```
 */
export function getPaths(): PathConfig {
    return projectConfig.paths;
}

/**
 * Check if a specific feature is enabled in the configuration
 * @param feature - Feature name to check (e.g., 'search', 'mermaid', 'gitChangelog')
 * @returns True if feature is enabled, false otherwise
 *
 * @example
 * ```ts
 * if (isFeatureEnabled('search')) {
 *   console.log('Search is enabled');
 * }
 *
 * if (isFeatureEnabled('mermaid')) {
 *   // Initialize Mermaid diagrams
 * }
 * ```
 */
export function isFeatureEnabled(
    feature: keyof typeof projectConfig.features
): boolean {
    return projectConfig.features[feature];
}

/**
 * Get consolidated project information for metadata and integrations
 * @returns Object containing basic project info, repository data, and Algolia config
 *
 * @example
 * ```ts
 * const info = getProjectInfo();
 * console.log(info.name); // "vitepress-M1hono-template"
 * console.log(info.repository.url); // "https://github.com/..."
 * ```
 */
export function getProjectInfo() {
    return {
        name: projectConfig.name,
        base: projectConfig.base,
        version: projectConfig.version,
        author: projectConfig.author,
        license: projectConfig.license,
        favicon: projectConfig.favicon,
        logo: projectConfig.logo,
        repository: projectConfig.repository,
        homepage: projectConfig.homepage,
        headerSocialLinks: projectConfig.headerSocialLinks,
        editLink: projectConfig.editLink,
        footerOptions: projectConfig.footerOptions,
        drawio: projectConfig.drawio,
        mdVar: projectConfig.mdVar,
        algolia: {
            appId: projectConfig.algolia.appId,
            apiKey: projectConfig.algolia.apiKey,
            indexName: projectConfig.algolia.indexName,
        },
    };
}

/**
 * Get complete deployment configuration for CI/CD workflows and build systems
 * Access all deployment settings including server details and custom commands
 * @returns Complete deployment configuration object
 *
 * @example
 * ```ts
 * const deployment = getDeploymentConfig();
 * console.log(deployment.type); // "github-pages" | "server" | "custom"
 *
 * // Check server configuration for SSH deployments
 * if (deployment.type === 'server') {
 *   console.log(`Deploying to: ${deployment.server.remotePath}`);
 *   console.log(`SSH Port: ${deployment.server.port}`);
 *   console.log(`Excluded files: ${deployment.server.excludeFiles.join(', ')}`);
 * }
 *
 * // Check custom deployment commands
 * if (deployment.type === 'custom') {
 *   console.log(`Deploy command: ${deployment.custom.deployCommand}`);
 *   if (deployment.custom.postDeployCommand) {
 *     console.log(`Post-deploy: ${deployment.custom.postDeployCommand}`);
 *   }
 * }
 *
 * // Use in build scripts
 * if (deployment.type === 'github-pages') {
 *   console.log('Preparing GitHub Pages deployment...');
 * }
 * ```
 */
export function getDeploymentConfig(): DeploymentConfig {
    return projectConfig.deployment;
}

/**
 * Check if a specific deployment type is currently active
 * Useful for conditional logic in build scripts and CI/CD workflows
 * @param type - Deployment strategy to check ('github-pages' | 'server' | 'custom')
 * @returns True if the specified deployment type is currently configured as active
 *
 * @example
 * ```ts
 * // Conditional deployment logic
 * if (isDeploymentActive('github-pages')) {
 *   console.log('✅ GitHub Pages deployment is active');
 *   console.log('No additional configuration needed');
 * }
 *
 * if (isDeploymentActive('server')) {
 *   console.log('🖥️  Server deployment is active');
 *   console.log('Ensure SSH_HOST and SSH_USERNAME secrets are configured');
 * }
 *
 * if (isDeploymentActive('custom')) {
 *   console.log('⚙️  Custom deployment is active');
 *   console.log('Custom commands will be executed during deployment');
 * }
 *
 * // Use in build scripts
 * const buildForProduction = isDeploymentActive('github-pages') ||
 *                           isDeploymentActive('server');
 *
 * // Environment-specific builds
 * if (isDeploymentActive('custom')) {
 *   console.log('Running custom build optimizations...');
 * }
 * ```
 */
export function isDeploymentActive(
    type: "github-pages" | "server" | "custom"
): boolean {
    return projectConfig.deployment.type === type;
}

/**
 * Get the currently active deployment strategy type
 * Returns the deployment method configured in project settings
 * @returns Current deployment strategy type as a string literal
 *
 * @example
 * ```ts
 * const deploymentType = getActiveDeploymentType();
 *
 * // Switch-based deployment handling
 * switch (deploymentType) {
 *   case 'github-pages':
 *     console.log('🔄 Using GitHub Pages deployment');
 *     console.log('Site will be deployed to https://username.github.io/repo/');
 *     break;
 *
 *   case 'server':
 *     console.log('🖥️  Using server deployment via SSH');
 *     console.log('Files will be copied to remote server');
 *     break;
 *
 *   case 'custom':
 *     console.log('⚙️  Using custom deployment strategy');
 *     console.log('Custom commands will handle deployment');
 *     break;
 * }
 *
 * // Conditional environment setup
 * if (deploymentType === 'server') {
 *   console.log('Setting up SSH connection...');
 * } else if (deploymentType === 'custom') {
 *   console.log('Preparing custom deployment environment...');
 * }
 *
 * // Configuration validation
 * const config = getDeploymentConfig();
 * if (deploymentType === 'server' && !config.server.host) {
 *   throw new Error('Server host is required for server deployment');
 * }
 *
 * // Deployment-specific optimizations
 * const shouldOptimizeForCDN = deploymentType === 'github-pages';
 * const shouldCompressAssets = deploymentType !== 'github-pages';
 * ```
 */
export function getActiveDeploymentType():
    | "github-pages"
    | "server"
    | "custom" {
    return projectConfig.deployment.type;
}

/**
 * Get server deployment configuration details
 * Returns server-specific settings for SSH deployments (excluding sensitive credentials)
 * @returns Server configuration object with deployment path, port, and exclusion settings
 *
 * @example
 * ```ts
 * const serverConfig = getServerDeploymentConfig();
 *
 * // Validate server configuration
 * if (!serverConfig.remotePath) {
 *   console.error('❌ Server deployment requires remotePath to be configured');
 *   console.log('Set remotePath in deployment.server configuration');
 * }
 *
 * // Log deployment target details
 * console.log(`📡 Deployment target: ${serverConfig.remotePath}`);
 * console.log(`🔌 SSH port: ${serverConfig.port}`);
 * console.log(`🚫 Excluded files: ${serverConfig.excludeFiles.join(', ')}`);
 *
 * // Note: SSH credentials are managed via GitHub secrets
 * console.log('📋 Required GitHub secrets: SSH_HOST, SSH_USERNAME, SSH_PRIVATE_KEY');
 *
 * // Build exclusion flags for rsync command
 * const excludeFlags = serverConfig.excludeFiles
 *   .map(file => `--exclude='${file}'`)
 *   .join(' ');
 * console.log(`🚫 Rsync exclude flags: ${excludeFlags}`);
 *
 * // Port validation
 * if (serverConfig.port < 1 || serverConfig.port > 65535) {
 *   console.warn(`⚠️  Invalid SSH port: ${serverConfig.port}`);
 * } else if (serverConfig.port !== 22) {
 *   console.info(`ℹ️  Using custom SSH port: ${serverConfig.port}`);
 * }
 * ```
 */
export function getServerDeploymentConfig() {
    return projectConfig.deployment.server;
}

/**
 * Get custom deployment configuration and commands
 * Returns user-defined deployment commands for custom deployment strategies
 * @returns Custom deployment configuration with deploy and post-deploy commands
 *
 * @example
 * ```ts
 * const customConfig = getCustomDeploymentConfig();
 *
 * // Validate custom deployment setup
 * if (!customConfig.deployCommand) {
 *   console.warn('⚠️  No deploy command specified for custom deployment');
 *   console.log('Add deployCommand to deployment.custom configuration');
 * }
 *
 * // Log deployment steps
 * console.log(`🚀 Deploy command: ${customConfig.deployCommand}`);
 * if (customConfig.postDeployCommand) {
 *   console.log(`📋 Post-deploy: ${customConfig.postDeployCommand}`);
 * }
 *
 * // Execute deployment commands (example for Node.js script)
 * import { execSync } from 'child_process';
 *
 * try {
 *   console.log('Executing deployment command...');
 *   execSync(customConfig.deployCommand, { stdio: 'inherit' });
 *
 *   if (customConfig.postDeployCommand) {
 *     console.log('Executing post-deployment command...');
 *     execSync(customConfig.postDeployCommand, { stdio: 'inherit' });
 *   }
 *
 *   console.log('✅ Custom deployment completed successfully');
 * } catch (error) {
 *   console.error('❌ Deployment failed:', error.message);
 * }
 *
 * // Platform-specific examples
 * const isDockerDeployment = customConfig.deployCommand.includes('docker');
 * const isVercelDeployment = customConfig.deployCommand.includes('vercel');
 * const isNetlifyDeployment = customConfig.deployCommand.includes('netlify');
 * ```
 */
export function getCustomDeploymentConfig() {
    return projectConfig.deployment.custom;
}

/**
 * Get the copy link configuration
 * @returns The copy link configuration object
 */
export function getCopyLinkConfig(): CopyLinkConfig {
    return projectConfig.copyLinkConfig || { removeLanguage: true };
}

/**
 * Get the social button configurations
 * @returns Array of social button configurations
 */
export function getSocialButtons(): SocialButton[] {
    return projectConfig.socialButtons || [];
}

/**
 * Get the special back path configurations
 * @returns Array of special back path configurations
 */
export function getSpecialBackPaths(): SpecialBackPath[] {
    return projectConfig.specialBackPaths || [];
}

/**
 * Extracts the language code from a given URL path.
 * It matches the path against the `link` property of the configured languages.
 * @param path - The URL path (e.g., '/zh-CN/guide/').
 * @returns The corresponding language code (e.g., 'zh-CN') or the default language code if no match is found.
 */
export function getLangCodeFromLink(path: string): string {
    const defaultLang = getDefaultLanguage();
    
    // Extract language code from path like /zh/, /en/, /zh-CN/
    const match = path.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
    if (match) {
        return match[1];
    }
    
    // If no language code found in path, return default
    return defaultLang.code;
}

/**
 * Get the appropriate search locale key for a language
 * Returns 'root' for default language, language code for others
 * @param langCode - Language code (e.g., 'en-US', 'zh-CN')
 * @returns 'root' for default language, or the language code for non-default languages
 *
 * @example
 * ```ts
 * const searchKey = getSearchLocaleKey('en-US'); // returns 'root' if en-US is default
 * const searchKey = getSearchLocaleKey('zh-CN'); // returns 'zh-CN' if not default
 * ```
 */
export function getSearchLocaleKey(langCode: string): string {
    const defaultLang = getDefaultLanguage();
    return langCode === defaultLang.code ? "root" : langCode;
}

/**
 * Dynamically generate VitePress locales configuration
 * Imports and combines all language configurations from the lang directory
 * @param useRootForDefault - Whether to use 'root' key for default language (VitePress standard) or explicit language codes
 * @returns Promise resolving to VitePress-compatible locales configuration
 *
 * @example
 * ```ts
 * // In config.mts with standard VitePress i18n
 * import { generateLocalesConfig } from './config/project-config';
 *
 * export default defineConfig({
 *   ...commonConfig,
 *   locales: await generateLocalesConfig(true)
 * });
 *
 * // In config.mts with explicit language codes (legacy)
 * export default defineConfig({
 *   ...commonConfig,
 *   locales: await generateLocalesConfig(false)
 * });
 * ```
 */
export async function generateLocalesConfig(
    useRootForDefault: boolean = false
) {
    const locales: Record<string, any> = {};

    for (const lang of projectConfig.languages) {
        try {
            // Dynamic import based on fileName from language config
            const langModule = await import(
                /* @vite-ignore */ `./lang/${lang.fileName}`
            );

            // Try multiple possible keys to find the language configuration
            const possibleKeys = [
                lang.code.replace("-", "_"), // en-US -> en_US, zh-CN -> zh_CN
                lang.fileName?.replace(".ts", "").replace("-", "_"), // en.ts -> en, zh.ts -> zh
                lang.code, // en-US, zh-CN
                lang.name.replace("-", "_"), // fallback to name field
            ];

            let langConfig = null;

            // Try each possible key until we find a match
            for (const key of possibleKeys) {
                if (langModule[key as keyof typeof langModule]) {
                    langConfig = langModule[key as keyof typeof langModule];
                    break;
                }
            }

            if (langConfig) {
                // Choose locale key based on mode:
                // - useRootForDefault: use 'root' for default language (VitePress standard)
                // - !useRootForDefault: use explicit language codes (legacy compatibility)
                const localeKey =
                    useRootForDefault && lang.isDefault ? "root" : lang.code;
                locales[localeKey] = {
                    label: lang.displayName,
                    ...(langConfig as any),
                };
            } else {
                console.warn(
                    `Language configuration not found for ${
                        lang.code
                    }. Available exports: ${Object.keys(langModule).join(", ")}`
                );
            }
        } catch (error) {
            console.warn(
                `Failed to load language configuration for ${lang.code}:`,
                error
            );
        }
    }

    return locales;
}

/**
 * Automatically discover and import all language modules
 * Uses dynamic imports based on project configuration
 * @returns Promise resolving to object containing all language configurations and search locales
 *
 * @example
 * ```ts
 * const result = await autoDiscoverLanguageModules();
 * console.log(result.langModules); // { en_US: {...}, zh_CN: {...} }
 * console.log(result.searchLocales); // { root: {...}, 'zh-CN': {...} }
 * ```
 */
export async function autoDiscoverLanguageModules(): Promise<{
    langModules: Record<string, any>;
    searchLocales: Record<string, any>;
}> {
    const langModules: Record<string, any> = {};
    const searchLocales: Record<string, any> = {};

    for (const lang of projectConfig.languages) {
        if (!lang.fileName) {
            console.warn(
                `No fileName specified for language ${lang.code}, skipping`
            );
            continue;
        }

        try {
            // Dynamic import based on fileName from language config
            const langModule = await import(
                /* @vite-ignore */ `./lang/${lang.fileName}`
            );

            // Try multiple possible export keys for language config
            const possibleKeys = [
                lang.code.replace("-", "_"), // en-US -> en_US, zh-CN -> zh_CN
                lang.fileName.replace(".ts", "").replace("-", "_"), // en.ts -> en, zh.ts -> zh
                lang.code, // en-US, zh-CN
                lang.name.replace("-", "_"), // fallback to name field
            ];

            // Find the actual export and map it to the expected key
            let foundConfig = null;
            for (const key of possibleKeys) {
                if (langModule[key]) {
                    foundConfig = langModule[key];
                    // Use standardized key format (lang_code with underscores)
                    langModules[lang.code.replace("-", "_")] = foundConfig;
                    break;
                }
            }

            if (!foundConfig) {
                console.warn(
                    `No valid export found for ${
                        lang.code
                    }. Available exports: ${Object.keys(langModule).join(", ")}`
                );
            }

            // Also try to extract search configuration if it exists
            if (langModule.search) {
                // Use the search configuration directly as exported
                // The language files should manage their own key structure
                Object.assign(searchLocales, langModule.search);
            }
        } catch (error) {
            console.warn(
                `Failed to load language module for ${lang.code}:`,
                error
            );
        }
    }

    return { langModules, searchLocales };
}

/**
 * Fully automated VitePress locales configuration generation
 * Automatically discovers, imports, and configures all language modules
 * @param useRootForDefault - Whether to use 'root' key for default language (VitePress standard) or explicit language codes
 * @returns Promise resolving to VitePress-compatible locales configuration and search locales
 *
 * @example
 * ```ts
 * // In config.mts - completely automated!
 * import { generateLocalesConfigAuto } from './config/project-config';
 *
 * const { locales, searchLocales } = await generateLocalesConfigAuto(false);
 * export default defineConfig({
 *   ...commonConfig,
 *   locales
 * });
 * ```
 */
export async function generateLocalesConfigAuto(
    useRootForDefault: boolean = false
) {
    const { langModules, searchLocales } = await autoDiscoverLanguageModules();
    const locales = generateLocalesConfigFromModules(
        langModules,
        useRootForDefault
    );
    return { locales, searchLocales };
}

/**
 * Generate locales configuration from provided language modules
 * @param langModules - Object containing imported language configurations
 * @param useRootForDefault - Whether to use 'root' key for default language (VitePress standard) or explicit language codes
 * @returns VitePress-compatible locales configuration object
 *
 * @example
 * ```ts
 * // Manual approach (when you want to control module imports)
 * import { en_US } from './config/lang/en';
 * import { zh_CN } from './config/lang/zh';
 * import { generateLocalesConfigFromModules } from './config/project-config';
 *
 * const langModules = { en_US, zh_CN };
 *
 * export default defineConfig({
 *   ...commonConfig,
 *   locales: generateLocalesConfigFromModules(langModules, false)
 * });
 * ```
 */
export function generateLocalesConfigFromModules(
    langModules: Record<string, any>,
    useRootForDefault: boolean = false
) {
    const locales: Record<string, any> = {};

    for (const lang of projectConfig.languages) {
        // Try multiple possible keys to find the language configuration
        const possibleKeys = [
            lang.code.replace("-", "_"), // en-US -> en_US, zh-CN -> zh_CN
            lang.fileName?.replace(".ts", "").replace("-", "_"), // en.ts -> en, zh.ts -> zh
            lang.code, // en-US, zh-CN
            lang.name.replace("-", "_"), // fallback to name field
        ];

        let langConfig = null;
        let usedKey = "";

        // Try each possible key until we find a match
        for (const key of possibleKeys) {
            if (langModules[key as keyof typeof langModules]) {
                langConfig = langModules[
                    key as keyof typeof langModules
                ] as any;
                usedKey = key as string;
                break;
            }
        }

        if (langConfig) {
            // Choose locale key based on mode:
            // - useRootForDefault: use 'root' for default language, link-based codes for others
            // - !useRootForDefault: use explicit language codes (legacy compatibility)
            let localeKey: string;
            if (useRootForDefault && lang.isDefault) {
                localeKey = "root";
            } else if (useRootForDefault) {
                // Use language code extracted from link (e.g., '/en/' -> 'en')
                localeKey = getLangCodeFromLink(lang.link);
            } else {
                localeKey = lang.code;
            }
            locales[localeKey] = {
                label: lang.displayName,
                ...(langConfig as any),
            };
        } else {
            console.warn(
                `Language configuration not found for ${
                    lang.code
                }. Tried keys: ${possibleKeys.join(", ")}`
            );
            console.warn(
                `Available keys in langModules: ${Object.keys(langModules).join(
                    ", "
                )}`
            );
        }
    }

    return locales;
}

/**
 * Create auto-import helper for language modules
 * Generates import statements and langModules object based on project configuration
 * @returns Object containing import code and langModules object structure
 *
 * @example
 * ```ts
 * // This helps you generate the imports automatically
 * const helper = createAutoImportHelper();
 * console.log(helper.imports); // Shows what imports you need
 * console.log(helper.moduleMapping); // Shows the langModules structure
 * ```
 */
export function createAutoImportHelper() {
    const imports: string[] = [];
    const moduleMapping: string[] = [];

    for (const lang of projectConfig.languages) {
        if (!lang.fileName) continue;

        // Generate import statement
        const moduleVarName = lang.code.replace("-", "_");
        const filePath = `./config/lang/${lang.fileName.replace(".ts", "")}`;
        imports.push(`import { ${moduleVarName} } from "${filePath}"`);

        // Generate module mapping
        moduleMapping.push(`    ${moduleVarName}`);
    }

    const langModulesCode = `const langModules = {\n${moduleMapping.join(
        ",\n"
    )}\n};`;

    return {
        imports: imports.join("\n"),
        langModulesCode,
        moduleMapping,
        // For immediate use
        getRequiredImports: () => {
            const result: Record<string, any> = {};
            // This would be used in conjunction with actual imports
            return result;
        },
    };
}

/**
 * @deprecated Use generateLocalesConfigFromModules or generateLocalesConfigAuto instead
 * Synchronously generate VitePress locales configuration
 * For use in environments where dynamic imports are not available
 */
export function generateLocalesConfigSync(
    langModules: Record<string, any>,
    useRootForDefault: boolean = false
) {
    console.warn(
        "generateLocalesConfigSync is deprecated. Use generateLocalesConfigFromModules or generateLocalesConfigAuto instead."
    );
    return generateLocalesConfigFromModules(langModules, useRootForDefault);
}

/**
 * Validate current deployment configuration
 * Checks if the deployment setup is complete and properly configured
 * @returns Validation result object with status and any error messages
 *
 * @example
 * ```ts
 * const validation = validateDeploymentConfig();
 *
 * if (validation.isValid) {
 *   console.log('✅ Deployment configuration is valid');
 *   console.log(`Using ${validation.deploymentType} deployment`);
 * } else {
 *   console.error('❌ Deployment configuration issues:');
 *   validation.errors.forEach(error => console.error(`  - ${error}`));
 * }
 *
 * // Use in CI/CD pre-deployment checks
 * if (!validation.isValid) {
 *   process.exit(1); // Fail the build
 * }
 *
 * // Conditional warnings
 * if (validation.warnings.length > 0) {
 *   console.warn('⚠️  Deployment configuration warnings:');
 *   validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
 * }
 * ```
 */
export function validateDeploymentConfig() {
    const deployment = projectConfig.deployment;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate server deployment
    if (deployment.type === "server") {
        if (!deployment.server.remotePath) {
            errors.push(
                "Server deployment requires remotePath to be specified"
            );
        }
        if (deployment.server.port < 1 || deployment.server.port > 65535) {
            errors.push(`Invalid SSH port: ${deployment.server.port}`);
        }
        // Note: SSH credentials (host, username, private key) are managed via GitHub secrets
        warnings.push(
            "Ensure SSH_HOST, SSH_USERNAME, and SSH_PRIVATE_KEY secrets are configured in GitHub repository"
        );
    }

    // Validate custom deployment
    if (deployment.type === "custom") {
        if (!deployment.custom.deployCommand) {
            errors.push(
                "Custom deployment requires deployCommand to be specified"
            );
        }
    }

    return {
        isValid: errors.length === 0,
        deploymentType: deployment.type,
        errors,
        warnings,
    };
}
