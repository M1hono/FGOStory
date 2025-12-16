import glob from "fast-glob";
import matter from "gray-matter";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { mkdirSync } from "fs";
import { getLanguages, getDefaultLanguage, getPaths } from "../../config/project-config";
import { getSrcPath } from "../config/path-resolver";

export interface TagInfo {
    name: string;
    count: number;
    pages: PageInfo[];
}

export interface PageInfo {
    title: string;
    description?: string;
    path: string;
    tags: string[];
    progress?: number;
    language?: string;
}

export interface TagData {
    [key: string]: TagInfo;
}

export function getSupportedLanguages(): string[] {
    return getLanguages().map(lang => lang.code);
}

export function getLanguageConfig(code: string) {
    return getLanguages().find(lang => lang.code === code);
}

function extractLanguageFromPath(filePath: string): string {
    const languages = getLanguages();
    const pathParts = filePath.split('/');
    
    if (pathParts.length > 0) {
        const firstPart = pathParts[0];
        const directMatch = languages.find(lang => lang.code === firstPart);
        if (directMatch) {
            return directMatch.code;
        }
        const linkMatch = languages.find(lang => {
            const linkPath = lang.link || `/${lang.code}/`;
            const cleanLinkPath = linkPath.replace(/^\/|\/$/g, '');
            return cleanLinkPath === firstPart;
        });
        if (linkMatch) {
            return linkMatch.code;
        }
    }
    
    return getDefaultLanguage().code;
}

export function isLanguageSupported(languageCode: string): boolean {
    return getLanguages().some(lang => lang.code === languageCode);
}

export function collectTags(docsDir: string = getSrcPath(), language?: string): TagData {
    const tagData: TagData = {};

    if (language && !isLanguageSupported(language)) {
        console.warn(`Unsupported language: ${language}. Supported languages: ${getSupportedLanguages().join(', ')}`);
        return tagData;
    }

    const markdownFiles = glob.sync("**/*.md", {
        cwd: docsDir,
        ignore: ["**/node_modules/**", "**/.vitepress/**"],
    });

    markdownFiles.forEach((file) => {
        try {
            const fullPath = resolve(docsDir, file);
            const content = readFileSync(fullPath, "utf-8");
            const { data: frontmatter } = matter(content);

            const fileLanguage = extractLanguageFromPath(file);
            
            if (language && fileLanguage !== language) {
                return;
            }

            if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
                const pageInfo: PageInfo = {
                    title: frontmatter.title || file.replace(".md", ""),
                    description: frontmatter.description,
                    path: "/" + file.replace(".md", ""),
                    tags: frontmatter.tags,
                    progress: frontmatter.progress,
                    language: fileLanguage,
                };

                frontmatter.tags.forEach((tag: string) => {
                    if (!tagData[tag]) {
                        tagData[tag] = {
                            name: tag,
                            count: 0,
                            pages: [],
                        };
                    }

                    tagData[tag].count++;
                    tagData[tag].pages.push(pageInfo);
                });
            }
        } catch (error) {
            console.warn(`Failed to process ${file}:`, error);
        }
    });

    return tagData;
}

export function generateTagData(docsDir: string = getSrcPath(), language?: string) {
    const tagData = collectTags(docsDir, language);

    const sortedTags = Object.values(tagData).sort((a, b) => b.count - a.count);

    return {
        tags: tagData,
        sortedTags,
        totalTags: Object.keys(tagData).length,
        totalPages: Object.values(tagData).reduce(
            (sum, tag) => sum + tag.count,
            0
        ),
        language,
        generatedAt: new Date().toISOString(),
    };
}

function compareTagData(newData: any, existingData: any): boolean {
    if (!existingData) return false;
    
    const newDataWithoutTimestamp = { ...newData };
    const existingDataWithoutTimestamp = { ...existingData };
    
    delete newDataWithoutTimestamp.generatedAt;
    delete existingDataWithoutTimestamp.generatedAt;
    
    return JSON.stringify(newDataWithoutTimestamp) === JSON.stringify(existingDataWithoutTimestamp);
}

function writeFileIfChanged(filePath: string, newData: any): boolean {
    let existingData = null;
    
    if (existsSync(filePath)) {
        try {
            const existingContent = readFileSync(filePath, 'utf-8');
            existingData = JSON.parse(existingContent);
        } catch (error) {
            console.warn(`Failed to read existing file ${filePath}:`, error);
        }
    }
    
    if (!compareTagData(newData, existingData)) {
        writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
        return true;
    }
    
    return false;
}

export function generateAllLanguageTagData(docsDir: string = getSrcPath(), outputDir: string = getPaths().public) {
    const results: Record<string, any> = {};
    const languages = getLanguages();
    let hasChanges = false;
    
    console.log(`🏷️  Generating tag data for languages: ${getSupportedLanguages().join(', ')}`);
    
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    for (const langConfig of languages) {
        try {
            console.log(`   📋 Processing ${langConfig.displayName} (${langConfig.code})...`);
            
            const data = generateTagData(docsDir, langConfig.code);
            results[langConfig.code] = data;

            const outputPath = resolve(outputDir, `tag-data-${langConfig.code}.json`);
            const fileChanged = writeFileIfChanged(outputPath, data);
            
            if (fileChanged) {
                hasChanges = true;
                console.log(`   ✅ Updated ${data.totalTags} tags for ${data.totalPages} pages`);
            } else {
                console.log(`   ⏭️  No changes for ${langConfig.displayName} (${data.totalTags} tags, ${data.totalPages} pages)`);
            }
        } catch (error) {
            console.error(`   ❌ Failed to generate tag data for ${langConfig.displayName}:`, error);
        }
    }

    const indexPath = resolve(outputDir, 'tag-data-index.json');
    const indexData = {
        languages: languages,
        generatedAt: new Date().toISOString(),
        summary: Object.fromEntries(
            Object.entries(results).map(([lang, data]) => [
                lang, 
                { 
                    totalTags: data.totalTags, 
                    totalPages: data.totalPages,
                    language: data.language 
                }
            ])
        )
    };
    
    const indexChanged = writeFileIfChanged(indexPath, indexData);
    if (indexChanged) {
        hasChanges = true;
        console.log(`   ✅ Updated index file`);
    } else {
        console.log(`   ⏭️  No changes for index file`);
    }

    if (hasChanges) {
        console.log(`🎉 Tag data updated! Files written to ${outputDir}`);
    } else {
        console.log(`😊 No changes detected, files unchanged`);
    }
    
    return results;
}

export function getPagesByTag(
    tagName: string,
    docsDir: string = getSrcPath(),
    language?: string
): PageInfo[] {
    const tagData = collectTags(docsDir, language);
    return tagData[tagName]?.pages || [];
}

export function getAllTags(docsDir: string = getSrcPath(), language?: string): string[] {
    const tagData = collectTags(docsDir, language);
    return Object.keys(tagData).sort();
}

