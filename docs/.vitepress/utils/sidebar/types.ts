/**
 * @fileoverview Type definitions for the VitePress Sidebar Generator system.
 * 
 * This module contains all type definitions, interfaces, and enums used
 * throughout the sidebar generation system. It provides comprehensive
 * type safety for configuration objects, sidebar items, metadata tracking,
 * and service interfaces.
 * 
 * @module SidebarTypes
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

/**
 * @interface SidebarItem
 * @description Represents a single item in the sidebar.
 * Contains all properties needed for rendering sidebar navigation items
 * including text, links, children, and internal processing metadata.
 */
export interface SidebarItem {
    /** Display text for the sidebar item */
    text: string
    /** Optional link URL for the item */
    link?: string
    /** Array of child sidebar items for hierarchical structure */
    items?: SidebarItem[]
    /** Whether the item should be collapsed by default */
    collapsed?: boolean
    /** @internal Priority value for ordering (lower numbers appear first) */
    _priority?: number
    /** @internal Original file path for files */
    _filePath?: string
    /** @internal Whether this item represents a directory */
    _isDirectory?: boolean
    /** @internal Whether this item represents a root defined by root:true */
    _isRoot?: boolean
    /** @internal Whether this item should be hidden from sidebar */
    _hidden?: boolean
    /** @internal Key used for itemOrder lookups and JSON sync. For files/dirs: relative path from current sidebar root (e.g., 'concepts/file.md'). For groups (ordered by title): the group's title. */
    _relativePathKey?: string
}

/**
 * @type SidebarMulti
 * @description Overall sidebar configuration structure used by VitePress for multiple sidebars.
 * Keys are base paths (e.g., '/guide/'), values are the array of sidebar items for that path.
 */
export type SidebarMulti = Record<string, SidebarItem[]>;

/**
 * @type VitePressSidebar
 * @description The type VitePress ultimately accepts for its themeConfig.sidebar option.
 * It can be a single sidebar array, a multi-sidebar object, or false to disable.
 */
export type VitePressSidebar = SidebarItem[] | SidebarMulti | false;

/**
 * @interface ExternalLinkConfig
 * @description Configuration for an external link in the sidebar.
 * Used for adding external resources or cross-references that point outside the documentation.
 */
export interface ExternalLinkConfig {
    /** Display text for the external link */
    text: string
    /** URL for the external link (must start with http:// or https://) */
    link: string
    /** Priority for ordering among sidebar items (lower numbers appear first) */
    priority?: number
    /** Whether this link should be hidden */
    hidden?: boolean
}

/**
 * @interface DirectoryConfig
 * @description Configuration options for a directory, typically from index.md frontmatter.
 * Defines how a directory should be processed and displayed in the sidebar structure.
 */
export interface DirectoryConfig {
    /** Whether this directory defines a new sidebar root */
    root?: boolean
    /** Custom title for the directory (overrides directory name) */
    title?: string
    /** Whether this directory should be hidden from sidebar */
    hidden?: boolean
    /** Priority for ordering among sibling directories/roots */
    priority?: number
    /** Maximum nesting depth for content within this directory */
    maxDepth?: number
    /** Default collapsed state for this item if it's a directory */
    collapsed?: boolean
    /** Order of items within this directory */
    itemOrder?: string[] | Record<string, number>
    /** Group configurations for splitting content into separate sections */
    groups?: GroupConfig[]
    /** External links to be added to this directory's sidebar */
    externalLinks?: ExternalLinkConfig[]
    /** Allow other frontmatter fields */
    [key: string]: any
}

/**
 * @interface GroupConfig
 * @description Configuration for a group within an index.md's `groups` array.
 * Groups allow splitting content from a directory into separate sidebar sections.
 * The grouped content will be removed from the original parent and displayed as a separate top-level item.
 */
export interface GroupConfig {
    /** Display title for the group item in the sidebar */
    title: string
    /** Relative path to the content directory to be grouped */
    path: string
    /** Priority for ordering the group in the sidebar (higher = earlier) */
    priority?: number
    /** Maximum nesting depth for items within this group */
    maxDepth?: number
}

/**
 * @interface GlobalSidebarConfig
 * @description Configuration options from the global .sidebarrc.yml file.
 * Provides system-wide defaults and fallback values for sidebar generation.
 */
export interface GlobalSidebarConfig {
    /** Default configuration values */
    defaults?: {
        /** Default maximum nesting depth */
        maxDepth?: number
        /** Default collapsed state for root items */
        collapsed?: boolean
        /** Global item order fallbacks */
        itemOrder?: Record<string, number> | string[]
        /** Default hidden state for items if not specified */
        hidden?: boolean
    }
    /** Allow other configuration fields */
    [key: string]: any
}

/**
 * @interface EffectiveDirConfig
 * @description The effective, merged configuration for a directory, after considering global, root, and local settings.
 * This is what the StructuralGeneratorService will primarily work with for a given directory.
 * All optional values have been resolved to concrete defaults.
 */
export interface EffectiveDirConfig {
    /** Resolved: true if it's a root, false otherwise */
    root: boolean
    /** Resolved title (e.g., from frontmatter or derived from dirname) */
    title: string
    /** Resolved hidden state */
    hidden: boolean
    /** Resolved priority (e.g., from frontmatter or default) */
    priority: number
    /** Resolved maxDepth (1-based for user config) */
    maxDepth: number
    /** Resolved collapsed state for this directory's item */
    collapsed: boolean
    /** RESOLVED to Record<string, number>, default {} */
    itemOrder: Record<string, number>
    /** Resolved groups, if any */
    groups: GroupConfig[]
    /** Resolved external links, if any */
    externalLinks: ExternalLinkConfig[]
    /** Absolute path to the directory this config is for */
    path: string
    /** Language of this config */
    lang: string
    /** Whether running in dev mode (affects draft status) */
    isDevMode: boolean
    /** @internal Base for relative keys of children */
    _baseRelativePathForChildren?: string
    /** Allow other merged fields */
    [key: string]: any
}

/**
 * @interface FileConfig
 * @description Configuration for an individual markdown file, from its frontmatter.
 * Controls how individual files are processed and displayed in the sidebar.
 */
export interface FileConfig {
    /** Custom title for the file (overrides filename) */
    title?: string
    /** Whether this file should be hidden from sidebar */
    hidden?: boolean
    /** Priority for ordering this file among siblings */
    priority?: number
    /** Allow other frontmatter fields */
    [key: string]: any
}

/**
 * @interface MetadataEntry
 * @description Represents a single entry in a metadata file, corresponding to a key in a JSON override file.
 * Used for tracking changes, user modifications, and structural relationships.
 */
export interface MetadataEntry {
    /** Hash of the value in the corresponding JSON file (e.g., MD5 of the translated string) */
    valueHash: string
    /** True if the user created/significantly edited this entry, false if system-generated stub */
    isUserSet: boolean
    /** True if this key currently maps to an item in the live declarative structure */
    isActiveInStructure: boolean
    /** @deprecated No longer actively maintained to prevent heavy git commits */
    lastSeen?: number
}

/**
 * @type JsonFileMetadata
 * @description Represents the content of a metadata file, which is a map of item keys to their metadata entries.
 * Used for tracking configuration changes and determining user vs system modifications.
 */
export type JsonFileMetadata = Record<string, MetadataEntry>;

/**
 * @interface DiscoveredFile
 * @description Represents a file or directory discovered during file system traversal.
 * Used by the structural generator for building the initial sidebar hierarchy.
 */
export interface DiscoveredFile {
    /** Filename or directory name */
    name: string
    /** Absolute path to the file or directory */
    path: string
    /** Type of the discovered entry */
    type: 'file' | 'directory'
    /** Directory configuration if applicable (might not be fully resolved yet or might not be applicable if it's a file) */
    config?: Partial<EffectiveDirConfig> 
}

/**
 * @interface SidebarContext
 * @description Contextual information passed during sidebar generation.
 * Provides necessary context for processing decisions and recursive operations.
 */
export interface SidebarContext {
    /** Base path for the current sidebar section */
    basePath: string
    /** Current path being processed */
    currentPath: string
    /** Fully resolved config for the current directory being processed */
    config: EffectiveDirConfig 
    /** Current nesting depth (0-indexed) */
    depth: number
    /** Language code being processed */
    lang: string
    /** Whether running in development mode */
    isDevMode: boolean
}

