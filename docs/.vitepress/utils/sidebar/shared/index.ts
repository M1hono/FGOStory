/**
 * @fileoverview Shared utilities and abstractions for the sidebar generation system.
 * 
 * This module exports common utilities, interfaces, and implementations used
 * throughout the sidebar generation process. It provides:
 * - Object manipulation and utility functions
 * - File system abstraction layer with type-safe interfaces
 * - Cross-platform file system operations
 * - Path normalization and manipulation utilities
 * 
 * @module SharedUtils
 * @version 1.0.0
 * @author VitePress Sidebar Generator
 * @since 1.0.0
 */

/**
 * Export all object manipulation utilities.
 * Includes functions for deep merging, path normalization, and data transformation.
 */
export * from './objectUtils';

/**
 * Import FileSystem interface as a type reference.
 * Used for type checking and dependency injection patterns.
 */
import type { FileSystem } from './FileSystem';

/**
 * Re-export FileSystem interface for external use.
 * Provides abstraction for file system operations across different environments.
 */
export type { FileSystem };

/**
 * Export the concrete Node.js file system implementation.
 * Default implementation for server-side file system operations.
 */
export { NodeFileSystem } from './NodeFileSystem';

