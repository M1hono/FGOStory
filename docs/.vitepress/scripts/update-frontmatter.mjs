#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, relative, resolve } from "path";
import glob from "fast-glob";
import matter from "gray-matter";
import { getLanguageCodes } from "../config/project-config.js";
import { getSrcPath } from "../utils/config/path-resolver.js";

class FrontmatterUpdater {
    constructor() {
        this.processedFiles = 0;
        this.skippedFiles = 0;
        this.errorFiles = 0;
        this.dryRun = false;
        this.verbose = false;
        this.backup = false;
        this.srcPath = getSrcPath();
        this.languages = getLanguageCodes();
    }

    parseArgs(args) {
        const config = {
            path: null,
            title: null,
            editor: null,
            authors: null,
            addAuthor: null,
            removeAuthor: null,
            replaceAuthor: null,
            description: null,
            progress: null,
            state: null,
            outline: null,
            showComment: null,
            gitChangelog: null,
            noguide: null,
            backPath: null,
            layout: null,
            tags: null,
            dryRun: false,
            verbose: false,
            backup: false,
            force: false,
            exclude: [],
            include: ["**/*.md"],
        };

        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--path":
                case "-p":
                    config.path = args[++i];
                    break;
                case "--title":
                case "-t":
                    config.title = args[++i];
                    break;
                case "--editor":
                case "-e":
                    config.editor = args[++i];
                    break;
                case "--authors":
                case "-a":
                    config.authors = args[++i]?.split(",").map((a) => a.trim());
                    break;
                case "--add-author":
                    config.addAuthor = args[++i];
                    break;
                case "--remove-author":
                    config.removeAuthor = args[++i];
                    break;
                case "--replace-author":
                    const replacement = args[++i];
                    if (replacement && replacement.includes(",")) {
                        const [oldAuthor, newAuthor] = replacement
                            .split(",")
                            .map((a) => a.trim());
                        config.replaceAuthor = {
                            old: oldAuthor,
                            new: newAuthor,
                        };
                    } else {
                        console.error(
                            '❌ Error: --replace-author requires format "oldAuthor,newAuthor"'
                        );
                        process.exit(1);
                    }
                    break;
                case "--description":
                case "-d":
                    config.description = args[++i];
                    break;
                case "--progress":
                    config.progress = parseInt(args[++i]);
                    break;
                case "--state":
                    config.state = args[++i];
                    break;
                case "--outline":
                    const outlineStr = args[++i];
                    if (outlineStr === "false") {
                        config.outline = false;
                    } else {
                        config.outline = outlineStr
                            .split(",")
                            .map((n) => parseInt(n.trim()));
                    }
                    break;
                case "--no-comment":
                    config.showComment = false;
                    break;
                case "--no-changelog":
                    config.gitChangelog = false;
                    break;
                case "--no-guide":
                    config.noguide = true;
                    break;
                case "--back-path":
                    config.backPath = args[++i];
                    break;
                case "--layout":
                    config.layout = args[++i];
                    break;
                case "--tags":
                    config.tags = args[++i]?.split(",").map((t) => t.trim());
                    break;
                case "--dry-run":
                    config.dryRun = true;
                    break;
                case "--verbose":
                case "-v":
                    config.verbose = true;
                    break;
                case "--backup":
                case "-b":
                    config.backup = true;
                    break;
                case "--force":
                case "-f":
                    config.force = true;
                    break;
                case "--exclude":
                    config.exclude.push(args[++i]);
                    break;
                case "--include":
                    config.include = [args[++i]];
                    break;
                case "--help":
                case "-h":
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
📝 Frontmatter Editor - Batch update markdown file frontmatter

USAGE:
  npm run frontmatter -- [options]

REQUIRED:
  -p, --path <path>          Target folder path (relative to src/)

CONTENT FIELDS:
  -t, --title <title>        Set article title
  -e, --editor <name>        Set editor name
  -a, --authors <names>      Set authors (comma-separated, replaces all)
      --add-author <name>    Add a new author to existing list
      --remove-author <name> Remove an author from the list
      --replace-author <old,new> Replace an author (format: "oldName,newName")
  -d, --description <desc>   Set article description
      --progress <number>    Set completion progress (0-100)
      --state <state>        Set article state (published/draft/outdated/renovating)
      --outline <levels>     Set outline levels (e.g., "2,3" or "false")
      --layout <layout>      Set page layout (doc/home)
      --tags <tags>          Set article tags (comma-separated)
      --back-path <path>     Set back button path

DISPLAY OPTIONS:
      --no-comment           Disable comments section
      --no-changelog         Disable git changelog
      --no-guide             Hide from sidebar

CONTROL OPTIONS:
      --dry-run              Preview changes without applying
  -v, --verbose              Show detailed information
  -b, --backup               Create backup files (.bak)
  -f, --force                Force overwrite existing values
      --exclude <pattern>    Exclude files matching pattern
      --include <pattern>    Only include files matching pattern
  -h, --help                 Show this help

SUPPORTED LANGUAGES:
  ${this.languages.join(", ")}

EXAMPLES:
  # Set title and description for Chinese docs
  npm run frontmatter -- -p zh/guides -t "新指南" -d "这是一个新的指南"
  
  # Add an author to all files in a directory
  npm run frontmatter -- -p en/tutorials --add-author "John Doe"
  
  # Update progress and state
  npm run frontmatter -- -p zh/api --progress 80 --state published
  
  # Preview changes without applying
  npm run frontmatter -- -p zh/guides --dry-run -v

SOURCE DIRECTORY: ${this.srcPath}
        `);
    }

    validateConfig(config) {
        if (!config.path) {
            console.error("❌ Error: --path is required");
            return false;
        }

        const fullPath = resolve(this.srcPath, config.path);
        if (!existsSync(fullPath)) {
            console.error(
                `❌ Error: Path "${config.path}" does not exist in ${this.srcPath}`
            );
            console.log(`Available languages: ${this.languages.join(", ")}`);
            return false;
        }

        if (
            config.progress !== null &&
            (config.progress < 0 || config.progress > 100)
        ) {
            console.error("❌ Error: Progress must be between 0 and 100");
            return false;
        }

        if (
            config.state &&
            !["published", "draft", "outdated", "renovating"].includes(
                config.state
            )
        ) {
            console.error(
                "❌ Error: State must be one of: published, draft, outdated, renovating"
            );
            return false;
        }

        return true;
    }

    updateAuthors(parsed, config, changes) {
        let currentAuthors = parsed.data.authors || [];
        let hasChanges = false;
        const operations = [];

        if (!Array.isArray(currentAuthors)) {
            currentAuthors = [];
        }

        if (config.authors) {
            if (!parsed.data.authors || config.force) {
                const oldValue = parsed.data.authors || [];
                parsed.data.authors = config.authors;
                hasChanges = true;
                operations.push(
                    `authors: ${JSON.stringify(oldValue)} → ${JSON.stringify(
                        config.authors
                    )}`
                );
            } else if (config.verbose) {
                operations.push(
                    `authors: ${JSON.stringify(
                        parsed.data.authors
                    )} (kept existing)`
                );
            }
            return;
        }

        // Add author
        if (config.addAuthor) {
            if (!currentAuthors.includes(config.addAuthor)) {
                currentAuthors.push(config.addAuthor);
                hasChanges = true;
                operations.push(`authors: added "${config.addAuthor}"`);
            } else if (config.verbose) {
                operations.push(
                    `authors: "${config.addAuthor}" already exists`
                );
            }
        }

        // Remove author
        if (config.removeAuthor) {
            const index = currentAuthors.indexOf(config.removeAuthor);
            if (index !== -1) {
                currentAuthors.splice(index, 1);
                hasChanges = true;
                operations.push(`authors: removed "${config.removeAuthor}"`);
            } else if (config.verbose) {
                operations.push(`authors: "${config.removeAuthor}" not found`);
            }
        }

        // Replace author
        if (config.replaceAuthor) {
            const { old: oldAuthor, new: newAuthor } = config.replaceAuthor;
            const index = currentAuthors.indexOf(oldAuthor);
            if (index !== -1) {
                currentAuthors[index] = newAuthor;
                hasChanges = true;
                operations.push(
                    `authors: replaced "${oldAuthor}" → "${newAuthor}"`
                );
            } else if (config.verbose) {
                operations.push(
                    `authors: "${oldAuthor}" not found for replacement`
                );
            }
        }

        // Update parsed data if changes were made
        if (hasChanges) {
            parsed.data.authors =
                currentAuthors.length > 0 ? currentAuthors : undefined;
        }

        // Add operations to changes array
        operations.forEach((op) => changes.push(op));

        return hasChanges;
    }

    /**
     * Get markdown files in the specified path
     */
    async getMarkdownFiles(config) {
        const fullPath = resolve(this.srcPath, config.path);

        try {
            const files = await glob(config.include, {
                cwd: fullPath,
                ignore: [
                    "node_modules/**",
                    ".git/**",
                    ".vitepress/**",
                    ...config.exclude,
                ],
                absolute: true,
            });

            return files.filter((file) => file.endsWith(".md"));
        } catch (error) {
            console.error("❌ Error finding files:", error.message);
            return [];
        }
    }

    /**
     * Update frontmatter in a single file
     */
    updateFile(filePath, config) {
        try {
            const content = readFileSync(filePath, "utf8");
            const parsed = matter(content);

            // Check if frontmatter exists
            if (!parsed.data) {
                parsed.data = {};
            }

            let hasChanges = false;
            const changes = [];

            // Helper function to update field
            const updateField = (fieldName, newValue, isArray = false) => {
                if (newValue !== null && newValue !== undefined) {
                    if (!parsed.data[fieldName] || config.force) {
                        const oldValue = parsed.data[fieldName] || "(none)";
                        parsed.data[fieldName] = newValue;
                        hasChanges = true;
                        const displayOld = isArray
                            ? JSON.stringify(oldValue)
                            : oldValue;
                        const displayNew = isArray
                            ? JSON.stringify(newValue)
                            : newValue;
                        changes.push(
                            `${fieldName}: ${displayOld} → ${displayNew}`
                        );
                    } else if (config.verbose) {
                        const display = isArray
                            ? JSON.stringify(parsed.data[fieldName])
                            : parsed.data[fieldName];
                        changes.push(
                            `${fieldName}: ${display} (kept existing)`
                        );
                    }
                }
            };

            // Update all fields
            updateField("title", config.title);
            updateField("editor", config.editor);

            // Handle authors with special operations
            const authorsChanged = this.updateAuthors(parsed, config, changes);
            if (authorsChanged) {
                hasChanges = true;
            }

            updateField("description", config.description);
            updateField("progress", config.progress);
            updateField("state", config.state);
            updateField("outline", config.outline, true);
            updateField("showComment", config.showComment);
            updateField("gitChangelog", config.gitChangelog);
            updateField("noguide", config.noguide);
            updateField("backPath", config.backPath);
            updateField("layout", config.layout);
            updateField("tags", config.tags, true);

            if (hasChanges || config.verbose) {
                const relativePath = relative(process.cwd(), filePath);
                console.log(`📄 ${relativePath}`);
                changes.forEach((change) => console.log(`   ${change}`));
            }

            if (hasChanges && !config.dryRun) {
                // Create backup if requested
                if (config.backup) {
                    writeFileSync(`${filePath}.bak`, content);
                }

                // Write updated content
                const newContent = matter.stringify(
                    parsed.content,
                    parsed.data
                );
                writeFileSync(filePath, newContent);
                this.processedFiles++;
            } else if (!hasChanges) {
                this.skippedFiles++;
            }

            return true;
        } catch (error) {
            console.error(
                `❌ Error processing ${relative(process.cwd(), filePath)}: ${
                    error.message
                }`
            );
            this.errorFiles++;
            return false;
        }
    }

    /**
     * Process all files
     */
    async processFiles(config) {
        console.log("🔍 Finding markdown files...");
        const files = await this.getMarkdownFiles(config);

        if (files.length === 0) {
            console.log("📭 No markdown files found matching criteria");
            return;
        }

        console.log(`📚 Found ${files.length} markdown file(s)`);

        if (config.dryRun) {
            console.log("🧪 DRY RUN MODE - No files will be modified\n");
        } else {
            console.log("✏️  Processing files...\n");
        }

        // Process each file
        for (const file of files) {
            this.updateFile(file, config);
        }

        // Show summary
        this.showSummary(config);
    }

    /**
     * Show processing summary
     */
    showSummary(config) {
        console.log("\n📊 Summary:");
        console.log(`   Processed: ${this.processedFiles} files`);
        console.log(`   Skipped: ${this.skippedFiles} files`);

        if (this.errorFiles > 0) {
            console.log(`   Errors: ${this.errorFiles} files`);
        }

        if (config.dryRun && this.processedFiles > 0) {
            console.log("\n💡 Run without --dry-run to apply changes");
        }

        if (config.backup && this.processedFiles > 0 && !config.dryRun) {
            console.log("\n💾 Backup files created with .bak extension");
        }
    }

    /**
     * Main execution function
     */
    async run(args = process.argv.slice(2)) {
        console.log("🚀 Frontmatter Updater\n");

        const config = this.parseArgs(args);

        if (!this.validateConfig(config)) {
            process.exit(1);
        }

        this.dryRun = config.dryRun;
        this.verbose = config.verbose;
        this.backup = config.backup;

        // Show configuration
        console.log("⚙️  Configuration:");
        console.log(`   Path: ${config.path}`);

        // Content fields
        const contentFields = [];
        if (config.title) contentFields.push(`title: "${config.title}"`);
        if (config.editor) contentFields.push(`editor: "${config.editor}"`);
        if (config.authors)
            contentFields.push(`authors: [${config.authors.join(", ")}]`);
        if (config.addAuthor)
            contentFields.push(`add-author: "${config.addAuthor}"`);
        if (config.removeAuthor)
            contentFields.push(`remove-author: "${config.removeAuthor}"`);
        if (config.replaceAuthor)
            contentFields.push(
                `replace-author: "${config.replaceAuthor.old}" → "${config.replaceAuthor.new}"`
            );
        if (config.description)
            contentFields.push(`description: "${config.description}"`);
        if (config.progress !== null)
            contentFields.push(`progress: ${config.progress}`);
        if (config.state) contentFields.push(`state: "${config.state}"`);
        if (config.outline !== null)
            contentFields.push(
                `outline: ${
                    Array.isArray(config.outline)
                        ? `[${config.outline.join(",")}]`
                        : config.outline
                }`
            );
        if (config.showComment !== null)
            contentFields.push(`showComment: ${config.showComment}`);
        if (config.gitChangelog !== null)
            contentFields.push(`gitChangelog: ${config.gitChangelog}`);
        if (config.noguide !== null)
            contentFields.push(`noguide: ${config.noguide}`);
        if (config.backPath)
            contentFields.push(`backPath: "${config.backPath}"`);
        if (config.layout) contentFields.push(`layout: "${config.layout}"`);
        if (config.tags)
            contentFields.push(`tags: [${config.tags.join(", ")}]`);

        if (contentFields.length > 0) {
            console.log(`   Fields: ${contentFields.join(", ")}`);
        }

        console.log(`   Dry run: ${config.dryRun ? "Yes" : "No"}`);
        console.log(`   Backup: ${config.backup ? "Yes" : "No"}`);
        console.log(`   Force: ${config.force ? "Yes" : "No"}`);
        if (config.exclude.length > 0) {
            console.log(`   Exclude: ${config.exclude.join(", ")}`);
        }
        console.log("");

        await this.processFiles(config);
    }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const updater = new FrontmatterUpdater();
    updater.run().catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
}

export default FrontmatterUpdater;
