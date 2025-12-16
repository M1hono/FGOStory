import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import { parse as parseSFC, compileScript } from '@vue/compiler-sfc';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { projectConfig } from '../config/project-config';

const traverse = _traverse.default;

const COMPONENTS_DIR = path.resolve(process.cwd(), '.vitepress/theme/components');
const LOCALE_DIR = path.resolve(process.cwd(), '.vitepress/config/locale');
const I18N_COMMENT = '@i18n';

function extractKeysFromNode(node) {
    if (node.type !== 'ObjectExpression') return null;

    const keys = {};
    for (const prop of node.properties) {
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && prop.value.type === 'StringLiteral') {
            keys[prop.key.name] = prop.value.value;
        }
    }
    return keys;
}

function parseVueFile(content, filename) {
    // Check if the file uses i18n functions instead of relying on @i18n comment
    if (!content.includes('useSafeI18n') && !content.includes('useI18n')) {
        return null;
    }
    
    const { descriptor, errors } = parseSFC(content, { filename });
    if (errors.length) {
        console.error(`Error parsing ${filename}:`, errors);
        return null;
    }

    if (!descriptor.scriptSetup) {
        return null;
    }

    let scriptContent;
    try {
        console.log(`🔍 Processing script for: ${filename}`);
        
        if (descriptor.scriptSetup) {
            const scriptSetupContent = descriptor.scriptSetup.content;
            scriptContent = {
                content: scriptSetupContent,
                map: null,
                bindings: {},
                imports: {},
                scriptAst: null,
                scriptSetupAst: null
            };
            console.log(`  ✅ Successfully extracted script: ${filename}`);
        } else {
            console.log(`  ⚠️  No script setup found in ${filename}, skipping`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error compiling script for ${filename}:`);
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        if (error.loc) {
            console.error(`   Location: line ${error.loc.start.line}, column ${error.loc.start.column}`);
        }
        
        // 尝试打印相关的代码行
        if (descriptor.styles && descriptor.styles.length > 0) {
            descriptor.styles.forEach((style, index) => {
                const lines = style.content.split('\n');
                console.error(`   Style block ${index} content:`);
                lines.forEach((line, lineNum) => {
                    console.error(`     ${lineNum + 1}: ${line}`);
                });
            });
        }
        
        throw error;
    }

    if (!scriptContent || !scriptContent.content) return null;

    const ast = parse(scriptContent.content, {
        sourceType: 'module',
        plugins: ['typescript'],
    });

    let keys = null;
    let componentId = null;

    traverse(ast, {
        CallExpression(path) {
            if (path.node.callee.type === 'Identifier' && 
                (path.node.callee.name === 'useI18n' || path.node.callee.name === 'useSafeI18n')) {
                
                let keysArg = null;
                
                if (path.node.arguments.length > 0) {
                    // Extract componentId from first argument (for useSafeI18n)
                    if (path.node.callee.name === 'useSafeI18n' && 
                        path.node.arguments[0] && 
                        path.node.arguments[0].type === 'StringLiteral') {
                        componentId = path.node.arguments[0].value;
                        
                        if (path.node.arguments.length >= 2 && path.node.arguments[1].type === 'ObjectExpression') {
                            keysArg = path.node.arguments[1];
                        }
                    }
                    else if (path.node.arguments[0].type === 'ObjectExpression') {
                        keysArg = path.node.arguments[0];
                    }
                }
                
                if (keysArg) {
                    keys = extractKeysFromNode(keysArg);
                    path.stop();
                }
            }
        },
    });

    return { keys, componentId };
}

const jsonFileHandler = {
    async read(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            if (error.code === 'ENOENT') return {};
            throw error;
        }
    },
    async write(filePath, data) {
        const sortedData = Object.keys(data).sort().reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(sortedData, null, 4), 'utf-8');
    }
};

const tsFileHandler = {
    async write(filePath, data, isDefaultLang = false) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const tsContent = generateFooterTsContent(data, isDefaultLang);
        await fs.writeFile(filePath, tsContent, 'utf-8');
    }
};

function generateFooterTsContent(data, isDefaultLang = false) {
    const imports = `import type { FooterConfig } from '../../../utils/content/footer';
import { createIconConfig, createLinkConfig, createGroupConfig } from '../../../utils/content/footer';`;

    if (isDefaultLang) {
        return `${imports}

export const footerConfig: FooterConfig = {
    beian: {
        showIcon: true,
        icp: {
            icon: createIconConfig(
                'fluent:globe-shield-48-filled',
                'rgba(20, 150, 255, 1)',
                'rgba(100, 200, 255, 1)'
            ),
            number: '${data.beian?.icp?.number || 'ICP Registration No. 12345678'}',
            rel: 'noopener noreferrer',
        },
        police: {
            icon: createIconConfig(
                'fluent:shield-checkmark-48-filled',
                'rgba(50, 200, 50, 1)',
                'rgba(100, 255, 100, 1)'
            ),
            number: '${data.beian?.police?.number || 'Public Security Registration No. 12345678'}',
            rel: 'noopener noreferrer',
        },
    },
    author: {
        icon: createIconConfig('mdi:copyright', '#999', '#ccc'),
        name: '${data.author?.name || 'Your Name'}',
        link: '${data.author?.link || 'https://github.com/yourusername'}',
        rel: 'noopener noreferrer',
        text: '${data.author?.text || 'All Rights Reserved.'}',
    },
    group: [
        createGroupConfig(
            'External Links',
            [
                createLinkConfig(
                    'GitHub',
                    'https://github.com/M1hono/M1honoVitepressTemplate',
                    'mdi:github',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { light: 'rgba(0, 0, 0, 1)', dark: 'rgba(255, 255, 255, 1)' },
                    }
                ),
                createLinkConfig(
                    'Documentation',
                    'https://vitepress.dev',
                    'mdi:book-open-page-variant',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { light: 'rgba(100, 150, 200, 1)', dark: 'rgba(150, 200, 255, 1)' },
                    }
                ),
            ],
            'bx:link',
            { light: 'rgba(255, 87, 51, 1)', dark: 'rgba(255, 130, 100, 1)' }
        ),
        createGroupConfig(
            'Resources',
            [
                createLinkConfig(
                    'Downloads',
                    '/downloads',
                    'mdi:download',
                    {
                        iconColors: { light: 'rgba(100, 200, 150, 1)', dark: 'rgba(150, 255, 200, 1)' },
                    }
                ),
                createLinkConfig(
                    'FAQ',
                    '/faq',
                    'mdi:help-circle',
                    {
                        iconColors: { light: 'rgba(200, 100, 150, 1)', dark: 'rgba(255, 150, 200, 1)' },
                    }
                ),
            ],
            'mdi:tools',
            { light: 'rgba(150, 200, 100, 1)', dark: 'rgba(200, 255, 150, 1)' }
        ),
    ],
};

export default footerConfig;`;
    } else {
        return `${imports}

export const footerConfig: FooterConfig = {
    beian: {
        showIcon: true,
        icp: {
            icon: createIconConfig(
                'fluent:globe-shield-48-filled',
                'rgba(20, 150, 255, 1)',
                'rgba(100, 200, 255, 1)'
            ),
            number: '',
            rel: 'noopener noreferrer',
        },
        police: {
            icon: createIconConfig(
                'fluent:shield-checkmark-48-filled',
                'rgba(50, 200, 50, 1)',
                'rgba(100, 255, 100, 1)'
            ),
            number: '',
            rel: 'noopener noreferrer',
        },
    },
    author: {
        icon: createIconConfig('mdi:copyright', '#999', '#ccc'),
        name: '',
        link: '',
        rel: 'noopener noreferrer',
        text: '',
    },
    group: [
        createGroupConfig(
            '',
            [
                createLinkConfig(
                    '',
                    '',
                    'mdi:github',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { light: 'rgba(0, 0, 0, 1)', dark: 'rgba(255, 255, 255, 1)' },
                    }
                ),
            ],
            'bx:link',
            { light: 'rgba(255, 87, 51, 1)', dark: 'rgba(255, 130, 100, 1)' }
        ),
    ],
};

export default footerConfig;`;
    }
}

async function syncTranslationFile(filePath, componentKeys, useDefaults) {
    const existingTranslations = await jsonFileHandler.read(filePath);
    const newTranslations = { ...existingTranslations };

    for (const key in componentKeys) {
        if (!newTranslations.hasOwnProperty(key)) {
            newTranslations[key] = useDefaults ? componentKeys[key] : '';
        }
    }
    for (const key in newTranslations) {
        if (!componentKeys.hasOwnProperty(key)) {
            delete newTranslations[key];
        }
    }
    await jsonFileHandler.write(filePath, newTranslations);
}

async function syncSnippetFiles(lang, additionalFiles) {
    const snippetDir = path.join(LOCALE_DIR, lang, 'snippets');
    await fs.mkdir(snippetDir, { recursive: true });

    const filesToCreate = [
        'default',
        'custom',
        ...additionalFiles
    ];

    for (const baseName of filesToCreate) {
        const filePath = path.join(snippetDir, `${baseName}.json`);
        try {
            await fs.access(filePath);
        } catch {
            console.log(`Creating empty snippet file '${baseName}.json' for ${lang}...`);
            await fs.writeFile(filePath, JSON.stringify([], null, 4), 'utf-8');
        }
    }
}

async function syncFooterFiles(languages, primaryLanguage) {
    console.log('\n🔄 Processing footer.ts files...');
    
    for (const lang of languages) {
        const footerPath = path.join(LOCALE_DIR, lang, 'footer.ts');
        const isDefaultLang = lang === primaryLanguage;
        
        try {
            await fs.access(footerPath);
            console.log(`   ✅ Found existing footer.ts for ${lang}`);
        } catch {
            console.log(`   📄 Creating footer.ts for ${lang}...`);
            const defaultFooterData = {}; // 空对象，实际内容由generateFooterTsContent生成
            await tsFileHandler.write(footerPath, defaultFooterData, isDefaultLang);
            console.log(`   ✅ Created footer.ts for ${lang}`);
        }
    }
}

async function main() {
    console.log('🚀 Starting i18n synchronization...');
    const languages = projectConfig.languages.map(lang => lang.code);
    const primaryLanguage = projectConfig.languages.find(l => l.isDefault)?.code || languages[0];

    if (!primaryLanguage) {
        console.error('No primary language found in project-config.ts. Aborting.');
        return;
    }

    const vueFiles = await fg('**/*.vue', { cwd: COMPONENTS_DIR });
    let processedCount = 0;
    let totalKeysCount = 0;
    const componentIdMapping = {}; // Store componentId -> filePath mapping
    
    for (const file of vueFiles) {
        const fullPath = path.join(COMPONENTS_DIR, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        const parseResult = parseVueFile(content, fullPath);

        // Handle null result from parseVueFile
        if (!parseResult || !parseResult.keys || Object.keys(parseResult.keys).length === 0) {
            continue;
        }

        const { keys, componentId } = parseResult;

        console.log(`\n🔄 Processing ${file} (${Object.keys(keys).length} keys)`);
        processedCount++;
        totalKeysCount += Object.keys(keys).length;
        
        const componentPathWithoutExt = file.replace(/\.vue$/, '');
        
        // Store componentId mapping if found
        if (componentId) {
            componentIdMapping[componentId] = componentPathWithoutExt;
            console.log(`   📋 Found componentId: "${componentId}" -> "${componentPathWithoutExt}"`);
        }
        
        const primaryLocalePath = path.join(LOCALE_DIR, primaryLanguage, `components/${componentPathWithoutExt}.json`);
        const existingPrimaryTranslations = await jsonFileHandler.read(primaryLocalePath);
        
        const primaryTranslations = { ...keys, ...existingPrimaryTranslations };
        
        for (const key in primaryTranslations) {
            if (!keys.hasOwnProperty(key)) {
                delete primaryTranslations[key];
            }
        }
        await jsonFileHandler.write(primaryLocalePath, primaryTranslations);

        for (const lang of languages) {
            if (lang === primaryLanguage) continue;

            const localeFilePath = path.join(LOCALE_DIR, lang, `components/${componentPathWithoutExt}.json`);
            const existingTranslations = await jsonFileHandler.read(localeFilePath);
            
            const newTranslations = { ...primaryTranslations, ...existingTranslations };
            
            for (const key in newTranslations) {
                if (!primaryTranslations.hasOwnProperty(key)) {
                    delete newTranslations[key];
                }
            }
            
            await jsonFileHandler.write(localeFilePath, newTranslations);
        }
    }
    
    // Generate component ID mapping file
    console.log('\n🔄 Generating component ID mapping...');
    const mappingFilePath = path.join(LOCALE_DIR, 'component-id-mapping.json');
    const mappingData = {
        generatedAt: new Date().toISOString(),
        description: 'Maps component IDs used in useSafeI18n() to their corresponding translation file paths',
        mappings: componentIdMapping
    };
    await jsonFileHandler.write(mappingFilePath, mappingData);
    console.log(`📋 Generated component ID mapping with ${Object.keys(componentIdMapping).length} entries`);
    
    console.log('\n🔄 Processing snippet files...');
    const customSnippets = projectConfig.customSnippetFileNames || [];
    for (const lang of languages) {
        await syncSnippetFiles(lang, customSnippets);
    }

    await syncFooterFiles(languages, primaryLanguage);

    console.log(`\n✅ i18n synchronization complete!`);
    console.log(`📊 Summary: ${processedCount} components processed, ${totalKeysCount} total translation keys`);
}

main().catch(error => {
    console.error('An error occurred during i18n synchronization:', error);
    process.exit(1);
}); 