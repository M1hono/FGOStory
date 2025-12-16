/**
 * @fileoverview Footer configuration types and utility functions for VitePress theme
 * @description This module provides comprehensive TypeScript type definitions and helper functions
 * for configuring footer components with internationalization support, icon management,
 * and link configuration capabilities.
 * @author VitePress Template Team
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * @interface IconConfig
 * @description Configuration interface for theme-aware icons with light/dark mode support
 * and optional color customization. Supports various icon libraries including MDI, Iconify, etc.
 * @example
 * ```typescript
 * const githubIcon: IconConfig = {
 *   light: 'mdi:github',
 *   dark: 'mdi:github',
 *   color: {
 *     light: '#000000',
 *     dark: '#ffffff'
 *   }
 * };
 * ```
 */
export interface IconConfig {
    /** 
     * @description Icon identifier for light theme mode
     * @example 'mdi:github', 'heroicons:home', 'fluent:globe-shield-48-filled'
     */
    light: string;
    
    /** 
     * @description Icon identifier for dark theme mode
     * @example 'mdi:github', 'heroicons:home', 'fluent:globe-shield-48-filled'
     */
    dark: string;
    
    /** 
     * @description Optional color configuration for theme-specific icon styling
     * @optional
     */
    color?: {
        /** @description Icon color in light theme mode (CSS color value) */
        light: string;
        /** @description Icon color in dark theme mode (CSS color value) */
        dark: string;
    };
}

/**
 * @interface LinkConfig
 * @description Configuration interface for footer links with comprehensive options
 * including icon support, accessibility attributes, and external link handling.
 * @example
 * ```typescript
 * const documentationLink: LinkConfig = {
 *   icon: createIconConfig('mdi:book-open-page-variant'),
 *   name: 'Documentation',
 *   link: 'https://vitepress.dev',
 *   rel: 'noopener noreferrer',
 *   target: '_blank'
 * };
 * ```
 */
export interface LinkConfig {
    /** 
     * @description Optional icon configuration for the link
     * @optional
     */
    icon?: IconConfig;
    
    /** 
     * @description Display text for the link
     * @example 'GitHub', 'Documentation', 'Contact Us'
     */
    name: string;
    
    /** 
     * @description URL or path for the link destination
     * @example 'https://github.com', '/docs', '/contact'
     */
    link: string;
    
    /** 
     * @description HTML rel attribute for the link (security and SEO)
     * @optional
     * @example 'noopener noreferrer', 'nofollow'
     */
    rel?: string;
    
    /** 
     * @description HTML target attribute for link behavior
     * @optional
     * @example '_blank', '_self', '_parent'
     */
    target?: string;
    
    /** 
     * @description Whether to hide the external link icon for external URLs
     * @optional
     * @default false
     */
    noIcon?: boolean;
}

/**
 * @interface GroupConfig
 * @description Configuration interface for footer link groups with categorization support.
 * Allows organizing related links under themed sections with optional group icons.
 * @example
 * ```typescript
 * const socialGroup: GroupConfig = {
 *   icon: createIconConfig('mdi:share-variant'),
 *   title: 'Social Media',
 *   links: [
 *     createLinkConfig('Twitter', 'https://twitter.com', 'mdi:twitter'),
 *     createLinkConfig('GitHub', 'https://github.com', 'mdi:github')
 *   ]
 * };
 * ```
 */
export interface GroupConfig {
    /** 
     * @description Optional icon configuration for the group header
     * @optional
     */
    icon?: IconConfig;
    
    /** 
     * @description Display title for the link group
     * @example 'External Links', 'Resources', 'Social Media'
     */
    title: string;
    
    /** 
     * @description Array of link configurations within this group
     * @minItems 1
     */
    links: LinkConfig[];
}

/**
 * @interface BeianConfig
 * @description Configuration interface for Chinese ICP and police registration information.
 * Required for websites hosted in mainland China to comply with local regulations.
 * @example
 * ```typescript
 * const beianInfo: BeianConfig = {
 *   showIcon: true,
 *   icp: {
 *     icon: createIconConfig('fluent:globe-shield-48-filled'),
 *     number: 'ICP备案号 12345678',
 *     link: 'https://beian.miit.gov.cn/'
 *   },
 *   police: {
 *     icon: createIconConfig('fluent:shield-checkmark-48-filled'),
 *     number: '公安备案号 12345678'
 *   }
 * };
 * ```
 */
export interface BeianConfig {
    /** 
     * @description Whether to display icons for beian information
     * @default true
     */
    showIcon: boolean;
    
    /** 
     * @description ICP (Internet Content Provider) registration configuration
     */
    icp: {
        /** 
         * @description Optional icon for ICP registration link
         * @optional
         */
        icon?: IconConfig;
        
        /** 
         * @description ICP registration number text
         * @example 'ICP备案号 12345678', 'ICP Registration No. 12345678'
         */
        number: string;
        
        /** 
         * @description Optional link to ICP registration verification page
         * @optional
         * @default 'https://beian.miit.gov.cn/'
         */
        link?: string;
        
        /** 
         * @description HTML rel attribute for ICP link
         * @optional
         */
        rel?: string;
        
        /** 
         * @description HTML target attribute for ICP link
         * @optional
         */
        target?: string;
    };
    
    /** 
     * @description Police registration configuration for enhanced security compliance
     */
    police: {
        /** 
         * @description Optional icon for police registration link
         * @optional
         */
        icon?: IconConfig;
        
        /** 
         * @description Police registration number text
         * @example '公安备案号 12345678', 'Public Security Registration No. 12345678'
         */
        number: string;
        
        /** 
         * @description Optional link to police registration verification page
         * @optional
         * @default 'https://beian.mps.gov.cn/'
         */
        link?: string;
        
        /** 
         * @description HTML rel attribute for police registration link
         * @optional
         */
        rel?: string;
        
        /** 
         * @description HTML target attribute for police registration link
         * @optional
         */
        target?: string;
    };
}

/**
 * @interface AuthorConfig
 * @description Configuration interface for author/copyright information display.
 * Supports comprehensive author attribution with flexible year range handling.
 * @example
 * ```typescript
 * const authorInfo: AuthorConfig = {
 *   icon: createIconConfig('mdi:copyright', '#666', '#ccc'),
 *   name: 'John Doe',
 *   link: 'https://github.com/johndoe',
 *   startYear: 2020,
 *   text: 'All Rights Reserved.'
 * };
 * ```
 */
export interface AuthorConfig {
    /** 
     * @description Optional icon for author/copyright information
     * @optional
     */
    icon?: IconConfig;
    
    /** 
     * @description Author or organization name
     * @example 'John Doe', 'Acme Corporation', 'VitePress Team'
     */
    name: string;
    
    /** 
     * @description Optional link to author's profile or website
     * @optional
     * @example 'https://github.com/username', 'https://example.com'
     */
    link?: string;
    
    /** 
     * @description HTML rel attribute for author link
     * @optional
     */
    rel?: string;
    
    /** 
     * @description HTML target attribute for author link
     * @optional
     */
    target?: string;
    
    /** 
     * @description Additional copyright or attribution text
     * @optional
     * @example 'All Rights Reserved.', 'Licensed under MIT', 'Maintained with ❤️'
     */
    text?: string;
    
    /** 
     * @description Starting year for copyright notice (creates year range)
     * @optional
     * @example 2020 (results in "2020 - 2024" format)
     */
    startYear?: number;
}

/**
 * @interface FooterConfig
 * @description Main configuration interface for the complete footer component.
 * Combines all footer elements into a cohesive configuration structure.
 * @example
 * ```typescript
 * const footerConfig: FooterConfig = {
 *   beian: { ... },
 *   author: { ... },
 *   group: [
 *     { title: 'Links', links: [...] },
 *     { title: 'Resources', links: [...] }
 *   ]
 * };
 * ```
 */
export interface FooterConfig {
    /** @description Chinese beian registration information configuration */
    beian: BeianConfig;
    
    /** @description Author and copyright information configuration */
    author: AuthorConfig;
    
    /** @description Array of link groups for footer navigation */
    group: GroupConfig[];
}

/**
 * @function createIconConfig
 * @description Factory function to create standardized icon configurations with theme support.
 * Simplifies icon setup by providing sensible defaults and consistent structure.
 * @param {string} icon - Base icon identifier (applied to both light and dark themes)
 * @param {string} [lightColor] - Optional color for light theme mode
 * @param {string} [darkColor] - Optional color for dark theme mode
 * @returns {IconConfig} Configured icon object with theme support
 * @example
 * ```typescript
 * // Basic icon without colors
 * const homeIcon = createIconConfig('mdi:home');
 * 
 * // Icon with theme-specific colors
 * const githubIcon = createIconConfig(
 *   'mdi:github',
 *   'rgba(0, 0, 0, 1)',
 *   'rgba(255, 255, 255, 1)'
 * );
 * ```
 * @since 1.0.0
 */
export function createIconConfig(
    icon: string,
    lightColor?: string,
    darkColor?: string
): IconConfig {
    const config: IconConfig = {
        light: icon,
        dark: icon,
    };
    
    if (lightColor && darkColor) {
        config.color = {
            light: lightColor,
            dark: darkColor,
        };
    }
    
    return config;
}

/**
 * @function createLinkConfig
 * @description Factory function to create comprehensive link configurations with optional features.
 * Streamlines link creation with intelligent defaults for common use cases.
 * @param {string} name - Display text for the link
 * @param {string} link - URL or path destination
 * @param {string} [icon] - Optional icon identifier
 * @param {Object} [options] - Additional configuration options
 * @param {string} [options.rel] - HTML rel attribute value
 * @param {string} [options.target] - HTML target attribute value
 * @param {boolean} [options.noIcon] - Whether to hide external link indicators
 * @param {Object} [options.iconColors] - Theme-specific icon colors
 * @param {string} [options.iconColors.light] - Icon color for light theme
 * @param {string} [options.iconColors.dark] - Icon color for dark theme
 * @returns {LinkConfig} Configured link object ready for use
 * @example
 * ```typescript
 * // Simple internal link
 * const docsLink = createLinkConfig('Documentation', '/docs');
 * 
 * // External link with icon and security attributes
 * const githubLink = createLinkConfig(
 *   'GitHub Repository',
 *   'https://github.com/user/repo',
 *   'mdi:github',
 *   {
 *     rel: 'noopener noreferrer',
 *     target: '_blank',
 *     iconColors: { light: '#000', dark: '#fff' }
 *   }
 * );
 * ```
 * @since 1.0.0
 */
export function createLinkConfig(
    name: string,
    link: string,
    icon?: string,
    options?: {
        rel?: string;
        target?: string;
        noIcon?: boolean;
        iconColors?: { light: string; dark: string };
    }
): LinkConfig {
    const linkConfig: LinkConfig = {
        name,
        link,
    };
    
    if (icon) {
        linkConfig.icon = createIconConfig(
            icon,
            options?.iconColors?.light,
            options?.iconColors?.dark
        );
    }
    
    if (options?.rel) linkConfig.rel = options.rel;
    if (options?.target) linkConfig.target = options.target;
    if (options?.noIcon) linkConfig.noIcon = options.noIcon;
    
    return linkConfig;
}

/**
 * @function createGroupConfig
 * @description Factory function to create organized link groups with consistent styling.
 * Facilitates footer organization by grouping related links under themed sections.
 * @param {string} title - Display title for the link group
 * @param {LinkConfig[]} links - Array of pre-configured link objects
 * @param {string} [icon] - Optional icon identifier for the group header
 * @param {Object} [iconColors] - Optional theme-specific colors for group icon
 * @param {string} [iconColors.light] - Icon color for light theme
 * @param {string} [iconColors.dark] - Icon color for dark theme
 * @returns {GroupConfig} Configured group object with organized links
 * @example
 * ```typescript
 * // Group with multiple related links
 * const socialGroup = createGroupConfig(
 *   'Social Media',
 *   [
 *     createLinkConfig('Twitter', 'https://twitter.com/user', 'mdi:twitter'),
 *     createLinkConfig('LinkedIn', 'https://linkedin.com/in/user', 'mdi:linkedin'),
 *     createLinkConfig('GitHub', 'https://github.com/user', 'mdi:github')
 *   ],
 *   'mdi:share-variant',
 *   { light: '#1976d2', dark: '#42a5f5' }
 * );
 * 
 * // Simple group without icon
 * const quickLinks = createGroupConfig(
 *   'Quick Links',
 *   [
 *     createLinkConfig('About', '/about'),
 *     createLinkConfig('Contact', '/contact')
 *   ]
 * );
 * ```
 * @since 1.0.0
 */
export function createGroupConfig(
    title: string,
    links: LinkConfig[],
    icon?: string,
    iconColors?: { light: string; dark: string }
): GroupConfig {
    const groupConfig: GroupConfig = {
        title,
        links,
    };
    
    if (icon) {
        groupConfig.icon = createIconConfig(icon, iconColors?.light, iconColors?.dark);
    }
    
    return groupConfig;
} 