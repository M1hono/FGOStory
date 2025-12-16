#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import glob from 'fast-glob';
import { getLanguageCodes } from "../config/project-config.js";
import { getSrcPath } from "../utils/config/path-resolver.js";

/**
 * Index.md Generator - Create index.md files for directories that don't have them
 * Uses the project configuration manager for consistent path handling
 * 
 * @author Assistant
 */
class IndexGenerator {
    constructor() {
        this.processedDirs = 0;
        this.skippedDirs = 0;
        this.errorDirs = 0;
        
        // 使用配置管理器获取路径和语言
        this.srcPath = getSrcPath();
        this.languages = getLanguageCodes();
    }

    /**
     * Parse command line arguments
     */
    parseArgs(args) {
        const config = {
            path: null,
            template: 'default',
            dryRun: false,
            verbose: false,
            force: false,
            exclude: ['node_modules', '.git', '.vitepress', 'public']
        };

        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case '--path':
                case '-p':
                    config.path = args[++i];
                    break;
                case '--template':
                case '-t':
                    config.template = args[++i];
                    break;
                case '--dry-run':
                case '-d':
                    config.dryRun = true;
                    break;
                case '--verbose':
                case '-v':
                    config.verbose = true;
                    break;
                case '--force':
                case '-f':
                    config.force = true;
                    break;
                case '--exclude':
                    config.exclude.push(args[++i]);
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                    break;
            }
        }

        return config;
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log(`
📁 Index.md Generator - Create index.md files for directories

USAGE:
  npm run index -- [options]

REQUIRED:
  -p, --path <path>          Target directory path (relative to src/)

OPTIONS:
  -t, --template <type>      Template type (default/advanced) [default: default]
  -d, --dry-run              Preview changes without creating files
  -v, --verbose              Show detailed information
  -f, --force                Overwrite existing index.md files
      --exclude <pattern>    Exclude directories matching pattern
  -h, --help                 Show this help

TEMPLATES:
  default      Basic index.md with title and root configuration
  advanced     Advanced index.md with progress, state, and sections

SUPPORTED LANGUAGES:
  ${this.languages.join(', ')}

EXAMPLES:
  # Create index.md files in Chinese docs directory
  npm run index -- -p zh
  
  # Use advanced template with preview
  npm run index -- -p en --template advanced --dry-run
  
  # Force overwrite existing files with verbose output
  npm run index -- -p zh/guides --force --verbose
  
  # Exclude specific directories
  npm run index -- -p zh --exclude "temp" --exclude "draft"

SOURCE DIRECTORY: ${this.srcPath}
        `);
    }

    /**
     * Validate configuration
     */
    validateConfig(config) {
        if (!config.path) {
            console.error('❌ Error: --path is required');
            console.log(`Available languages: ${this.languages.join(', ')}`);
            return false;
        }

        const fullPath = resolve(this.srcPath, config.path);
        if (!existsSync(fullPath)) {
            console.error(`❌ Error: Path "${config.path}" does not exist in ${this.srcPath}`);
            console.log(`Available languages: ${this.languages.join(', ')}`);
            return false;
        }

        if (!['default', 'advanced'].includes(config.template)) {
            console.error('❌ Error: Template must be "default" or "advanced"');
            return false;
        }

        return true;
    }

    /**
     * Get template content for index.md
     */
    getTemplate(dirName, templateType) {
        const title = this.formatTitle(dirName);
        
        if (templateType === 'advanced') {
            return `---
title: ${title}
description: ${title}相关文档
progress: 0
state: draft
root: true
outline: [2, 3]
showComment: true
gitChangelog: true
---

# \$\{ $frontmatter.title \}

## 简述 {#intro}

这是 \`${title}\` 的索引页面。

## 内容概览 {#overview}

请在此添加该部分的介绍内容和导航信息。

## 相关链接 {#links}

- [相关文档](./related.md)
- [更多资源](./resources.md)
`;
        } else {
            return `---
title: ${title}
root: true
---

# \$\{ $frontmatter.title \}

这是 \`${title}\` 的索引页面。

请在此添加该部分的介绍内容。
`;
        }
    }

    /**
     * Format directory name to readable title
     */
    formatTitle(dirName) {
        // Convert kebab-case and snake_case to readable format
        return dirName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }

    /**
     * Find all directories that need index.md files
     */
    async findDirectoriesNeedingIndex(config) {
        try {
            const basePath = resolve(this.srcPath, config.path);
            
            // Find all directories
            const patterns = [`${basePath}/**/`];
            const excludePatterns = config.exclude.map(pattern => 
                pattern.startsWith('**/') ? pattern : `**/${pattern}/**`
            );

            const allDirs = await glob(patterns, {
                ignore: excludePatterns,
                onlyDirectories: true,
                absolute: true
            });

            // Filter directories that need index.md files
            const dirsNeedingIndex = [];

            for (const dir of allDirs) {
                const indexPath = join(dir, 'index.md');
                
                // Check if directory has markdown files (excluding index.md)
                const markdownFiles = await glob('*.md', {
                    cwd: dir,
                    ignore: ['index.md']
                });

                // Check if directory has subdirectories with content
                const subdirs = await glob('*/', {
                    cwd: dir
                });

                if (markdownFiles.length > 0 || subdirs.length > 0) {
                    if (!existsSync(indexPath) || config.force) {
                        dirsNeedingIndex.push({
                            path: dir,
                            indexPath,
                            dirName: basename(dir),
                            hasExistingIndex: existsSync(indexPath),
                            relativePath: relative(basePath, dir)
                        });
                    }
                }
            }

            return dirsNeedingIndex;
        } catch (error) {
            console.error('❌ Error finding directories:', error.message);
            return [];
        }
    }

    /**
     * Create index.md file for a directory
     */
    createIndexFile(dirInfo, template, dryRun = false) {
        const content = this.getTemplate(dirInfo.dirName, template);
        
        if (dryRun) {
            console.log(`📝 Would create: ${dirInfo.relativePath}/index.md`);
            if (dirInfo.hasExistingIndex) {
                console.log('   ⚠️  Would overwrite existing index.md');
            }
            console.log(`   📋 Title: ${this.formatTitle(dirInfo.dirName)}`);
            return true;
        }

        try {
            writeFileSync(dirInfo.indexPath, content, 'utf8');
            return true;
        } catch (error) {
            console.error(`❌ Error creating ${dirInfo.relativePath}/index.md:`, error.message);
            return false;
        }
    }

    /**
     * Process all directories
     */
    async processDirectories(config) {
        console.log('🔍 Finding directories that need index.md files...');
        console.log(`📂 Source directory: ${this.srcPath}`);
        console.log(`🎯 Target path: ${config.path}`);
        
        const directories = await this.findDirectoriesNeedingIndex(config);

        if (directories.length === 0) {
            console.log('✅ No directories need index.md files (all directories already have them)');
            return;
        }

        console.log(`\n📋 Found ${directories.length} directories that need index.md files:`);
        
        for (const dirInfo of directories) {
            const success = this.createIndexFile(dirInfo, config.template, config.dryRun);
            
            if (success) {
                if (config.dryRun) {
                    this.skippedDirs++;
                } else {
                    this.processedDirs++;
                    console.log(`✅ Created: ${dirInfo.relativePath}/index.md`);
                    if (dirInfo.hasExistingIndex) {
                        console.log('   📝 Overwrote existing file');
                    }
                }
            } else {
                this.errorDirs++;
            }
        }

        // Show summary
        console.log('\n📊 Summary:');
        if (config.dryRun) {
            console.log(`   📋 Would create: ${this.skippedDirs} files`);
        } else {
            console.log(`   ✅ Created: ${this.processedDirs} files`);
            console.log(`   ❌ Errors: ${this.errorDirs} files`);
        }
    }

    /**
     * Main execution function
     */
    async run() {
        const args = process.argv.slice(2);
        const config = this.parseArgs(args);

        if (!this.validateConfig(config)) {
            process.exit(1);
        }

        try {
            await this.processDirectories(config);
        } catch (error) {
            console.error('❌ Unexpected error:', error.message);
            process.exit(1);
        }
    }
}

// Run the generator if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const generator = new IndexGenerator();
    generator.run();
}

export default IndexGenerator; 