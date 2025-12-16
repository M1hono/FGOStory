/**
 * @fileoverview File system abstraction interface for cross-platform operations.
 * 
 * This module defines a unified interface for file system operations that can be
 * implemented by different backends (Node.js fs, in-memory, mock, etc.). This
 * abstraction enables:
 * - Easy testing with mock implementations
 * - Consistent API across different environments
 * - Future extensibility for alternative file systems
 * - Type-safe file system operations
 * 
 * @module FileSystem
 * @version 1.0.0
 * @author VitePress Sidebar Generator
 * @since 1.0.0
 */

import fs from 'node:fs'; // For Dirent type, can also import Dirent directly if preferred

/**
 * Abstract interface for file system operations.
 * 
 * Provides a unified API for common file system operations with Promise-based
 * methods for asynchronous execution. All implementations should handle errors
 * gracefully and provide consistent behavior across platforms.
 * 
 * @interface FileSystem
 * @since 1.0.0
 * @example
 * ```typescript
 * const fs: FileSystem = new NodeFileSystem();
 * 
 * // Read a file
 * const content = await fs.readFile('/path/to/file.txt');
 * 
 * // Check if file exists
 * const exists = await fs.exists('/path/to/file.txt');
 * 
 * // Write a file
 * await fs.writeFile('/path/to/output.txt', 'content');
 * ```
 */
export interface FileSystem {
    /**
     * Reads the entire contents of a file as UTF-8 text.
     * 
     * @param {string} path - Absolute or relative path to the file
     * @returns {Promise<string>} Promise resolving to the file contents
     * @throws {Error} When file cannot be read or doesn't exist
     * @since 1.0.0
     */
    readFile(path: string): Promise<string>;

    /**
     * Reads the contents of a directory, returning detailed file information.
     * 
     * @param {string} path - Absolute or relative path to the directory
     * @returns {Promise<fs.Dirent[]>} Promise resolving to array of directory entries
     * @throws {Error} When directory cannot be read or doesn't exist
     * @since 1.0.0
     */
    readDir(path: string): Promise<fs.Dirent[]>; // Using fs.Dirent to get file/directory info

    /**
     * Checks if a file or directory exists at the specified path.
     * 
     * @param {string} path - Absolute or relative path to check
     * @returns {Promise<boolean>} Promise resolving to true if path exists
     * @since 1.0.0
     */
    exists(path: string): Promise<boolean>;

    /**
     * Gets detailed information about a file or directory.
     * 
     * @param {string} path - Absolute or relative path to stat
     * @returns {Promise<fs.Stats>} Promise resolving to file/directory statistics
     * @throws {Error} When path cannot be accessed or doesn't exist
     * @since 1.0.0
     */
    stat(path: string): Promise<fs.Stats>;

    /**
     * Writes content to a file, creating the file if it doesn't exist.
     * 
     * @param {string} path - Absolute or relative path where to write
     * @param {string} content - Content to write to the file
     * @returns {Promise<void>} Promise resolving when write completes
     * @throws {Error} When file cannot be written
     * @since 1.0.0
     */
    writeFile(path: string, content: string): Promise<void>;

    /**
     * Ensures a directory exists, creating it and parent directories if needed.
     * 
     * @param {string} path - Absolute or relative path to the directory
     * @returns {Promise<void>} Promise resolving when directory exists
     * @throws {Error} When directory cannot be created
     * @since 1.0.0
     */
    ensureDir(path: string): Promise<void>;

    /**
     * Deletes a file from the file system.
     * 
     * @param {string} path - Absolute or relative path to the file
     * @returns {Promise<void>} Promise resolving when file is deleted
     * @throws {Error} When file cannot be deleted
     * @since 1.0.0
     */
    deleteFile(path: string): Promise<void>;

    /**
     * Deletes a directory and all its contents recursively.
     * 
     * @param {string} path - Absolute or relative path to the directory
     * @returns {Promise<void>} Promise resolving when directory is deleted
     * @throws {Error} When directory cannot be deleted
     * @since 1.0.0
     */
    deleteDir(path: string): Promise<void>;
} 

