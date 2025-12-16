/**
 * @fileoverview Node.js implementation of the FileSystem interface.
 * 
 * This module provides a concrete implementation of the FileSystem interface
 * using Node.js built-in file system modules. It handles all file operations
 * asynchronously using Promises and provides cross-platform path handling.
 * 
 * @module NodeFileSystem
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import fs from 'node:fs/promises';
import path from 'node:path'; // Import path module
import { Dirent, Stats } from 'node:fs'; // Import types directly
import { FileSystem } from './FileSystem';
import { normalizePathSeparators } from '../sidebar/shared/objectUtils';

/**
 * Node.js implementation of the FileSystem interface.
 * 
 * Provides file system operations using Node.js fs/promises module with
 * automatic path normalization and directory creation. All methods handle
 * errors gracefully and provide consistent cross-platform behavior.
 * 
 * @class NodeFileSystem
 * @implements {FileSystem}
 * @since 1.0.0
 * @example
 * ```typescript
 * const fs = new NodeFileSystem();
 * 
 * // Read a file
 * const content = await fs.readFile('./docs/index.md');
 * 
 * // Write a file with automatic directory creation
 * await fs.writeFile('./output/generated.json', JSON.stringify(data));
 * 
 * // Check if path exists
 * const exists = await fs.exists('./docs/guide/');
 * ```
 */
export class NodeFileSystem implements FileSystem {
    /**
     * Reads the entire contents of a file as UTF-8 text.
     * 
     * @param {string} filePath - Absolute or relative path to the file
     * @returns {Promise<string>} Promise resolving to the file contents
     * @throws {Error} When file cannot be read or doesn't exist
     * @since 1.0.0
     */
    public async readFile(filePath: string): Promise<string> {
        return fs.readFile(normalizePathSeparators(filePath), 'utf-8');
    }

    /**
     * Reads the contents of a directory, returning detailed file information.
     * 
     * @param {string} dirPath - Absolute or relative path to the directory
     * @returns {Promise<Dirent[]>} Promise resolving to array of directory entries
     * @throws {Error} When directory cannot be read or doesn't exist
     * @since 1.0.0
     */
    public async readDir(dirPath: string): Promise<Dirent[]> {
        return fs.readdir(normalizePathSeparators(dirPath), { withFileTypes: true });
    }

    /**
     * Checks if a file or directory exists at the specified path.
     * 
     * @param {string} filePath - Absolute or relative path to check
     * @returns {Promise<boolean>} Promise resolving to true if path exists
     * @since 1.0.0
     */
    public async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(normalizePathSeparators(filePath));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets detailed information about a file or directory.
     * 
     * @param {string} filePath - Absolute or relative path to stat
     * @returns {Promise<Stats>} Promise resolving to file/directory statistics
     * @throws {Error} When path cannot be accessed or doesn't exist
     * @since 1.0.0
     */
    public async stat(filePath: string): Promise<Stats> {
        return fs.stat(normalizePathSeparators(filePath));
    }

    /**
     * Writes content to a file, creating parent directories if needed.
     * 
     * Automatically creates the parent directory structure if it doesn't exist
     * before writing the file. This ensures the write operation succeeds even
     * when the target directory structure is missing.
     * 
     * @param {string} filePath - Absolute or relative path where to write
     * @param {string} content - Content to write to the file
     * @returns {Promise<void>} Promise resolving when write completes
     * @throws {Error} When file cannot be written
     * @since 1.0.0
     */
    public async writeFile(filePath: string, content: string): Promise<void> {
        const normalizedFilePath = normalizePathSeparators(filePath);
        await fs.mkdir(path.dirname(normalizedFilePath), { recursive: true });
        return fs.writeFile(normalizedFilePath, content, 'utf-8');
    }

    /**
     * Ensures a directory exists, creating it and parent directories if needed.
     * 
     * @param {string} dirPath - Absolute or relative path to the directory
     * @returns {Promise<void>} Promise resolving when directory exists
     * @throws {Error} When directory cannot be created
     * @since 1.0.0
     */
    public async ensureDir(dirPath: string): Promise<void> {
        await fs.mkdir(normalizePathSeparators(dirPath), { recursive: true });
    }

    /**
     * Deletes a file from the file system.
     * 
     * Silently ignores ENOENT errors (file not found) to provide idempotent
     * behavior. Other errors are re-thrown for proper error handling.
     * 
     * @param {string} filePath - Absolute or relative path to the file
     * @returns {Promise<void>} Promise resolving when file is deleted
     * @throws {Error} When file cannot be deleted (except for ENOENT)
     * @since 1.0.0
     */
    public async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(normalizePathSeparators(filePath));
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * Deletes a directory and all its contents recursively.
     * 
     * Uses the `rm` method with recursive and force options for complete
     * directory removal. Silently ignores ENOENT errors (directory not found)
     * to provide idempotent behavior.
     * 
     * @param {string} dirPath - Absolute or relative path to the directory
     * @returns {Promise<void>} Promise resolving when directory is deleted
     * @throws {Error} When directory cannot be deleted (except for ENOENT)
     * @since 1.0.0
     */
    public async deleteDir(dirPath: string): Promise<void> {
        try {
            await fs.rm(normalizePathSeparators(dirPath), { recursive: true, force: true });
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
} 

