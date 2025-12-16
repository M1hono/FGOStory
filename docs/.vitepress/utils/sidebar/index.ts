/**
 * @fileoverview Main entry point for the sidebar generation system.
 * Exports all public types, functions, and services for generating VitePress sidebars.
 * 
 * @module SidebarIndex
 * @version 1.0.0
 * @author M1hono
 */

/**
 * Export all type definitions for the sidebar system.
 * Includes interfaces for sidebar items, configurations, and file metadata.
 */
export * from './types'

/**
 * Export the main sidebar generation function.
 * This is the primary entry point for generating sidebars from directory structures.
 */
export { generateSidebars } from './main'

/**
 * Export utility functions and helper methods for sidebar operations.
 * Includes caching, configuration management, and synchronization utilities.
 */
export * from './lib'

/**
 * Export the Vite plugin for automatic sidebar generation.
 * This plugin integrates the sidebar generator into the Vite build process.
 */
export { sidebarPlugin } from './plugin'