import { resolve, join } from 'path';
import { projectConfig } from '../../config/project-config';

/**
 * Path resolver utilities for Node.js environments only
 * These functions should not be used in browser/client code
 */

export function getAbsolutePath(relativePath: string): string {
    return resolve(process.cwd(), relativePath);
}

export function getDocsPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.docs, subPath);
}

export function getSrcPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.src, subPath);
}

export function getPublicPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.public, subPath);
}

export function getVitepressPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.vitepress, subPath);
}

export function getConfigPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.config, subPath);
}

export function getThemePath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.theme, subPath);
}

export function getScriptsPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.scripts, subPath);
}

export function getUtilsPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.utils, subPath);
}

export function getCachePath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.cache, subPath);
}

export function getBuildPath(subPath: string = ""): string {
    return resolve(process.cwd(), projectConfig.paths.build, subPath);
} 