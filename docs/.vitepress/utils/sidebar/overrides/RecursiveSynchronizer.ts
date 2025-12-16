/**
 * @fileoverview Handles recursive synchronization of sidebar items with JSON overrides, ensuring proper hierarchy management and configuration preservation.
 * @module RecursiveSynchronizer
 * @version 1.0.0
 * @author M1hono
 * @since 2024
 */
import path from 'node:path';
import { SidebarItem, JsonFileMetadata } from '../types';
import { normalizePathSeparators, isDeepEqual } from '../shared/objectUtils';
import { JsonFileHandler, JsonOverrideFileType } from './JsonFileHandler';
import { MetadataManager } from './MetadataManager';
import { SyncEngine } from './SyncEngine';
import { JsonItemSorter } from './JsonItemSorter';
import { PathKeyProcessor } from './PathKeyProcessor';

/**
 * @class RecursiveSynchronizer
 * @description Handles recursive synchronization of sidebar items with JSON overrides.
 * Manages configuration hierarchy, ensures data preservation, and maintains consistency
 * between physical file structure and configuration data.
 */
export class RecursiveSynchronizer {
    private jsonFileHandler: JsonFileHandler;
    private metadataManager: MetadataManager;
    private syncEngine: SyncEngine;
    private jsonItemSorter: JsonItemSorter;
    private pathProcessor: PathKeyProcessor;
    private absDocsPath: string;

    /**
     * @constructor
     * @param {JsonFileHandler} jsonFileHandler - Handler for JSON file operations
     * @param {MetadataManager} metadataManager - Manager for metadata operations
     * @param {SyncEngine} syncEngine - Engine for synchronizing configurations
     * @param {JsonItemSorter} jsonItemSorter - Sorter for JSON items
     * @param {string} absDocsPath - Absolute path to the docs directory
     */
    constructor(
        jsonFileHandler: JsonFileHandler,
        metadataManager: MetadataManager,
        syncEngine: SyncEngine,
        jsonItemSorter: JsonItemSorter,
        absDocsPath: string
    ) {
        this.jsonFileHandler = jsonFileHandler;
        this.metadataManager = metadataManager;
        this.syncEngine = syncEngine;
        this.jsonItemSorter = jsonItemSorter;
        this.pathProcessor = new PathKeyProcessor();
        this.absDocsPath = absDocsPath;
    }

    /**
     * @method synchronizeItemsRecursively
     * @description Recursively synchronizes an array of sidebar items and their children.
     * @param {SidebarItem[]} items - The current array of SidebarItems to process
     * @param {string} currentConfigDirSignature - Path signature for the parent's JSON config directory (e.g., '_root', 'guide/concepts')
     * @param {string} lang - The language code
     * @param {boolean} isDevMode - Development mode flag
     * @param {string[]} langGitbookPaths - Absolute paths to GitBook directories to exclude
     * @param {boolean} [isTopLevelCall=false] - To know if items are direct children of the root view
     * @returns {Promise<void>}
     * @throws {Error} When synchronization fails
     */
    public async synchronizeItemsRecursively(
        items: SidebarItem[],
        currentConfigDirSignature: string, 
        lang: string,
        isDevMode: boolean,
        langGitbookPaths: string[],
        isTopLevelCall: boolean = false
    ): Promise<void> {
        if (!isTopLevelCall && this.pathProcessor.isGitBookRoot(currentConfigDirSignature, lang, langGitbookPaths, this.absDocsPath)) {
            return;
        }

        const isFlattenedRootStructure = isTopLevelCall && items.length === 1 && items[0]._isRoot && items[0].items && items[0].items.length > 0;

        if (isFlattenedRootStructure) {
            const rootItem = items[0];
            await this.processSelfProperties(rootItem, currentConfigDirSignature, lang, isDevMode);
            await this.processDirectChildren(rootItem.items!, currentConfigDirSignature, lang, isDevMode);
            await this.processSubdirectoriesRecursively(rootItem.items!, currentConfigDirSignature, lang, isDevMode, langGitbookPaths);

            const orderData = await this.jsonFileHandler.readJsonFile('order', lang, currentConfigDirSignature);
            rootItem.items = this.jsonItemSorter.sortItems(rootItem.items!, orderData);
        } else {
            await this.processDirectChildren(items, currentConfigDirSignature, lang, isDevMode);
            await this.processSubdirectoriesRecursively(items, currentConfigDirSignature, lang, isDevMode, langGitbookPaths);

            const orderData = await this.jsonFileHandler.readJsonFile('order', lang, currentConfigDirSignature);
            const sortedItems = this.jsonItemSorter.sortItems(items, orderData);
            items.length = 0;
            items.push(...sortedItems);
        }

        await this.cleanupOrphanedConfigurations(currentConfigDirSignature, lang, items);
    }

    /**
     * @method processSubdirectoriesRecursively
     * @description Recursively processes subdirectories, creating their _self_ properties and processing their children.
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @param {string[]} langGitbookPaths - GitBook paths to exclude
     * @returns {Promise<void>}
     * @private
     */
    private async processSubdirectoriesRecursively(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isDevMode: boolean,
        langGitbookPaths: string[]
    ): Promise<void> {
        for (const item of items) {
            if (item._isDirectory) {
                const itemRelativeKey = this.pathProcessor.extractRelativeKeyForCurrentDir(item, currentConfigDirSignature);
                const nextConfigDirSignature = currentConfigDirSignature === '_root' 
                    ? itemRelativeKey.replace(/\/$/, '')
                    : normalizePathSeparators(path.join(currentConfigDirSignature, itemRelativeKey.replace(/\/$/, '')));

                if (this.pathProcessor.isGitBookRoot(nextConfigDirSignature, lang, langGitbookPaths, this.absDocsPath)) {
                    continue; 
                }

                await this.processSelfProperties(item, nextConfigDirSignature, lang, isDevMode);

                if (item.items && item.items.length > 0) {
                    const orderData = await this.jsonFileHandler.readJsonFile('order', lang, nextConfigDirSignature);
                    const sortedItems = this.jsonItemSorter.sortItems(item.items, orderData);
                    item.items = sortedItems;
                    
                    await this.synchronizeItemsRecursively(item.items, nextConfigDirSignature, lang, isDevMode, langGitbookPaths, false);
                }
            }
        }
    }

    /**
     * @method processDirectChildren
     * @description Processes direct children of a directory for JSON config synchronization.
     * This method only handles immediate children, not nested content.
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processDirectChildren(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        await this.processChildrenLocales(items, currentConfigDirSignature, lang, isDevMode);
        await this.processChildrenCollapsed(items, currentConfigDirSignature, lang, isDevMode);
        await this.processChildrenHidden(items, currentConfigDirSignature, lang, isDevMode);
        await this.processCurrentItemsOrder(items, currentConfigDirSignature, lang, isDevMode);
    }

    /**
     * @method reapplyMigratedValues
     * @description Re-applies migrated values to ensure migrated values are reflected in the final sidebar.
     * This is also used as a final pass to ensure all JSON overrides are properly applied.
     * Priority: JSON configs > sub config > root config > global config
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} rootConfigDirSignature - Root configuration directory signature
     * @param {string} lang - Language code
     * @param {string[]} langGitbookPaths - GitBook paths to exclude
     * @returns {Promise<void>}
     * @public
     */
    public async reapplyMigratedValues(
        items: SidebarItem[],
        rootConfigDirSignature: string,
        lang: string,
        langGitbookPaths: string[]
    ): Promise<void> {
        const localesData = await this.jsonFileHandler.readJsonFile('locales', lang, rootConfigDirSignature);
        const collapsedData = await this.jsonFileHandler.readJsonFile('collapsed', lang, rootConfigDirSignature);
        const hiddenData = await this.jsonFileHandler.readJsonFile('hidden', lang, rootConfigDirSignature);
        const orderData = await this.jsonFileHandler.readJsonFile('order', lang, rootConfigDirSignature);
        
        for (const item of items) {
            const itemKey = this.pathProcessor.extractRelativeKeyForCurrentDir(item, rootConfigDirSignature);
            
            if (item._isRoot && items.length === 1) {
                if (localesData.hasOwnProperty('_self_')) {
                    item.text = localesData['_self_'];
                }
                if (collapsedData.hasOwnProperty('_self_')) {
                    item.collapsed = collapsedData['_self_'];
                }
                
                if (item.items && item.items.length > 0) {
                    await this.reapplyMigratedValues(item.items, rootConfigDirSignature, lang, langGitbookPaths);
                }
            } else {
                let parentOverrideApplied = {
                    text: false,
                    collapsed: false,
                    hidden: false
                };
                
                if (localesData.hasOwnProperty(itemKey)) {
                    item.text = localesData[itemKey];
                    parentOverrideApplied.text = true;
                }
                
                if (collapsedData.hasOwnProperty(itemKey) && item._isDirectory) {
                    item.collapsed = collapsedData[itemKey];
                    parentOverrideApplied.collapsed = true;
                }
                
                if (hiddenData.hasOwnProperty(itemKey)) {
                    const hiddenValue = hiddenData[itemKey];
                    (item as any)._hidden = hiddenValue === true ? true : false;
                    parentOverrideApplied.hidden = true;
                } else {
                    (item as any)._hidden = false;
                }
                
                if (item._isDirectory && item.items && item.items.length > 0) {
                    const nextConfigDirSignature = rootConfigDirSignature === '_root' 
                        ? itemKey.replace(/\/$/, '') 
                        : normalizePathSeparators(path.join(rootConfigDirSignature, itemKey.replace(/\/$/, '')));
                    
                    if (!this.pathProcessor.isGitBookRoot(nextConfigDirSignature, lang, langGitbookPaths, this.absDocsPath)) {
                        
                        if (!parentOverrideApplied.text) {
                        const itemLocalesData = await this.jsonFileHandler.readJsonFile('locales', lang, nextConfigDirSignature);
                        if (itemLocalesData.hasOwnProperty('_self_')) {
                            item.text = itemLocalesData['_self_'];
                            }
                        }
                        
                        if (!parentOverrideApplied.collapsed) {
                        const itemCollapsedData = await this.jsonFileHandler.readJsonFile('collapsed', lang, nextConfigDirSignature);
                        if (itemCollapsedData.hasOwnProperty('_self_')) {
                            item.collapsed = itemCollapsedData['_self_'];
                            }
                        }
                        
                            await this.reapplyMigratedValues(item.items, nextConfigDirSignature, lang, langGitbookPaths);
                            
                            const childOrderData = await this.jsonFileHandler.readJsonFile('order', lang, nextConfigDirSignature);
                            item.items = this.jsonItemSorter.sortItems(item.items, childOrderData);
                    }
                }
            }
        }
        
        if (items.length > 0 && !(items.length === 1 && items[0]._isRoot)) {
            const sortedItems = this.jsonItemSorter.sortItems(items, orderData);
            items.length = 0;
            items.push(...sortedItems);
        }

        const isFlattened = items.length === 1 && items[0]._isRoot;
        if (isFlattened && items[0].items) {
            await this.filterHiddenItems(items[0].items, rootConfigDirSignature, lang, true);
        } else {
            await this.filterHiddenItems(items, rootConfigDirSignature, lang, false);
        }
    }

    /**
     * @method filterHiddenItems
     * @description Applies hidden states to items in the sidebar structure.
     * Since hidden values are now correctly applied by applyHierarchyAwareOverrides with proper hierarchy awareness,
     * this method simply checks the _hidden property that was already set.
     * @param {SidebarItem[]} items - Array of sidebar items to filter
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} [isFlattened=false] - Whether the structure is flattened
     * @returns {Promise<void>}
     * @private
     */
    private async filterHiddenItems(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isFlattened: boolean = false
    ): Promise<void> {
        if (!isFlattened) {
        const hiddenData = await this.jsonFileHandler.readJsonFile('hidden', lang, currentConfigDirSignature);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
                const itemKey = this.pathProcessor.extractRelativeKeyForCurrentDir(item, currentConfigDirSignature);

            if (hiddenData[itemKey] === true) {
                (item as any)._hidden = true;
            } else {
                (item as any)._hidden = false;
            }
            
            if (item.items && item.items.length > 0) {
                if (item._isDirectory) {
                    const nextConfigDirSignature = currentConfigDirSignature === '_root' 
                        ? itemKey 
                        : normalizePathSeparators(path.join(currentConfigDirSignature, itemKey));
                    await this.filterHiddenItems(item.items, nextConfigDirSignature, lang, false);
                } else {
                        await this.filterHiddenItems(item.items, currentConfigDirSignature, lang, false);
    }
                }
            }
        }
    }

    /**
     * @method processChildrenLocales
     * @description Processes children's locales (text overrides).
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processChildrenLocales(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        const parentLocalesData = await this.jsonFileHandler.readJsonFile('locales', lang, currentConfigDirSignature);
        const parentLocalesMetadata = await this.metadataManager.readMetadata('locales', lang, currentConfigDirSignature);

        const localeSyncResultForChildren = await this.syncEngine.syncOverrideType(
            items, 
            parentLocalesData, 
            parentLocalesMetadata, 
            'locales', lang, isDevMode,
            (childItem: SidebarItem) => this.pathProcessor.extractRelativeKeyForCurrentDir(childItem, currentConfigDirSignature),
            this.metadataManager
        );
        
        const hasJsonChanges = !isDeepEqual(parentLocalesData, localeSyncResultForChildren.updatedJsonData);
        const hasMetadataChanges = !isDeepEqual(parentLocalesMetadata, localeSyncResultForChildren.updatedMetadata);

        if (hasJsonChanges) {
        await this.jsonFileHandler.writeJsonFile('locales', lang, currentConfigDirSignature, localeSyncResultForChildren.updatedJsonData);
        }

        if (hasMetadataChanges) {
        await this.metadataManager.writeMetadata('locales', lang, currentConfigDirSignature, localeSyncResultForChildren.updatedMetadata);
        }
    }

    /**
     * @method processChildrenCollapsed
     * @description Processes children's collapsed states.
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processChildrenCollapsed(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        const parentCollapsedData = await this.jsonFileHandler.readJsonFile('collapsed', lang, currentConfigDirSignature);
        const parentCollapsedMetadata = await this.metadataManager.readMetadata('collapsed', lang, currentConfigDirSignature);

        const collapsedSyncResultForChildren = await this.syncEngine.syncOverrideType(
            items, 
            parentCollapsedData, 
            parentCollapsedMetadata, 
            'collapsed', lang, isDevMode,
            (childItem: SidebarItem) => this.pathProcessor.extractRelativeKeyForCurrentDir(childItem, currentConfigDirSignature),
            this.metadataManager
        );
        
        const hasJsonChanges = !isDeepEqual(parentCollapsedData, collapsedSyncResultForChildren.updatedJsonData);
        const hasMetadataChanges = !isDeepEqual(parentCollapsedMetadata, collapsedSyncResultForChildren.updatedMetadata);

        if (hasJsonChanges) {
        await this.jsonFileHandler.writeJsonFile('collapsed', lang, currentConfigDirSignature, collapsedSyncResultForChildren.updatedJsonData);
        }
        if (hasMetadataChanges) {
        await this.metadataManager.writeMetadata('collapsed', lang, currentConfigDirSignature, collapsedSyncResultForChildren.updatedMetadata);
        }
    }

    /**
     * @method processChildrenHidden
     * @description Processes children's hidden states.
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processChildrenHidden(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        const parentHiddenData = await this.jsonFileHandler.readJsonFile('hidden', lang, currentConfigDirSignature);
        const parentHiddenMetadata = await this.metadataManager.readMetadata('hidden', lang, currentConfigDirSignature);

        const hiddenSyncResultForChildren = await this.syncEngine.syncOverrideType(
            items, 
            parentHiddenData, 
            parentHiddenMetadata, 
            'hidden', lang, isDevMode,
            (childItem: SidebarItem) => this.pathProcessor.extractRelativeKeyForCurrentDir(childItem, currentConfigDirSignature),
            this.metadataManager
        );
        
        const hasJsonChanges = !isDeepEqual(parentHiddenData, hiddenSyncResultForChildren.updatedJsonData);
        const hasMetadataChanges = !isDeepEqual(parentHiddenMetadata, hiddenSyncResultForChildren.updatedMetadata);

        if (hasJsonChanges) {
        await this.jsonFileHandler.writeJsonFile('hidden', lang, currentConfigDirSignature, hiddenSyncResultForChildren.updatedJsonData);
        }
        if (hasMetadataChanges) {
        await this.metadataManager.writeMetadata('hidden', lang, currentConfigDirSignature, hiddenSyncResultForChildren.updatedMetadata);
        }
    }

    /**
     * @method processSelfProperties
     * @description Processes _self_ properties for a directory item.
     * This method is CONSERVATIVE - it only creates _self_ entries if they don't exist,
     * and never modifies existing user configurations.
     * @param {SidebarItem} currentItem - The sidebar item to process
     * @param {string} nextConfigDirSignature - Next configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processSelfProperties(
        currentItem: SidebarItem,
        nextConfigDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        const selfOverrideTypes: JsonOverrideFileType[] = ['locales', 'collapsed', 'hidden'];
        
        for (const type of selfOverrideTypes) {
            const itemOwnJsonData = await this.jsonFileHandler.readJsonFile(type, lang, nextConfigDirSignature);
            const itemOwnMetadata = await this.metadataManager.readMetadata(type, lang, nextConfigDirSignature);
            
            if (itemOwnJsonData.hasOwnProperty('_self_')) {
                continue;
            }

            let defaultSelfValue: any;
            if (type === 'locales') {
                defaultSelfValue = currentItem.text;
            } else if (type === 'collapsed') {
                defaultSelfValue = currentItem.collapsed ?? true;
            } else if (type === 'hidden') {
                defaultSelfValue = false;
            }

            if (defaultSelfValue !== undefined) {
                const updatedJsonData = { ...itemOwnJsonData, '_self_': defaultSelfValue };
                const updatedMetadata = { 
                    ...itemOwnMetadata, 
                    '_self_': this.metadataManager.createNewMetadataEntry(defaultSelfValue, false, true) 
                };

                await this.jsonFileHandler.writeJsonFile(type, lang, nextConfigDirSignature, updatedJsonData);
                await this.metadataManager.writeMetadata(type, lang, nextConfigDirSignature, updatedMetadata);
            }
        }
    }

    /**
     * @method processChildrenOrder
     * @description Processes order for children of a directory item.
     * @param {SidebarItem[]} children - Array of child sidebar items
     * @param {string} configDirSignature - Configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processChildrenOrder(
        children: SidebarItem[],
        configDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        const itemOwnOrderJson = await this.jsonFileHandler.readJsonFile('order', lang, configDirSignature);
        const itemOwnOrderMetadata = await this.metadataManager.readMetadata('order', lang, configDirSignature);
        
        const orderSyncResult = await this.syncEngine.syncOverrideType(
            children, itemOwnOrderJson, itemOwnOrderMetadata, 'order', lang, isDevMode,
            (childItem: SidebarItem) => this.pathProcessor.extractRelativeKeyForCurrentDir(childItem, configDirSignature),
            this.metadataManager
        );
        
        const hasJsonChanges = !isDeepEqual(itemOwnOrderJson, orderSyncResult.updatedJsonData);
        const hasMetadataChanges = !isDeepEqual(itemOwnOrderMetadata, orderSyncResult.updatedMetadata);

        if (hasJsonChanges) {
        await this.jsonFileHandler.writeJsonFile('order', lang, configDirSignature, orderSyncResult.updatedJsonData);
        }
        if (hasMetadataChanges) {
        await this.metadataManager.writeMetadata('order', lang, configDirSignature, orderSyncResult.updatedMetadata);
        }
    }

    /**
     * @method processCurrentItemsOrder
     * @description Processes order for the current list of items.
     * @param {SidebarItem[]} items - Array of sidebar items to process
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {boolean} isDevMode - Development mode flag
     * @returns {Promise<void>}
     * @private
     */
    private async processCurrentItemsOrder(
        items: SidebarItem[],
        currentConfigDirSignature: string,
        lang: string,
        isDevMode: boolean
    ): Promise<void> {
        const parentOrderJsonData = await this.jsonFileHandler.readJsonFile('order', lang, currentConfigDirSignature);
        const parentOrderMetadata = await this.metadataManager.readMetadata('order', lang, currentConfigDirSignature);

        const orderSyncResultForCurrentItems = await this.syncEngine.syncOverrideType(
            items, 
            parentOrderJsonData, 
            parentOrderMetadata, 
            'order', lang, isDevMode, 
            (item: SidebarItem) => this.pathProcessor.extractRelativeKeyForCurrentDir(item, currentConfigDirSignature), 
            this.metadataManager
        );
        
        const hasJsonChanges = !isDeepEqual(parentOrderJsonData, orderSyncResultForCurrentItems.updatedJsonData);
        const hasMetadataChanges = !isDeepEqual(parentOrderMetadata, orderSyncResultForCurrentItems.updatedMetadata);

        if (hasJsonChanges) {
        await this.jsonFileHandler.writeJsonFile('order', lang, currentConfigDirSignature, orderSyncResultForCurrentItems.updatedJsonData);
        }
        if (hasMetadataChanges) {
        await this.metadataManager.writeMetadata('order', lang, currentConfigDirSignature, orderSyncResultForCurrentItems.updatedMetadata);
        }
        
        const sortedItems = this.jsonItemSorter.sortItems(items, orderSyncResultForCurrentItems.updatedJsonData);
        items.length = 0;
        items.push(...sortedItems);
    }

    /**
     * @method cleanupOrphanedConfigurations
     * @description Cleans up orphaned configuration directories and JSON entries that don't correspond to physical directories.
     * This ensures the config structure stays in sync with the actual file structure.
     * SECURITY: Enhanced with metadata checking to prevent user configuration loss.
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {SidebarItem[]} items - Array of sidebar items for context
     * @returns {Promise<void>}
     * @private
     */
    private async cleanupOrphanedConfigurations(
        currentConfigDirSignature: string,
        lang: string,
        items: SidebarItem[]
    ): Promise<void> {
        try {
            const configDirPath = currentConfigDirSignature === '_root'
                ? normalizePathSeparators(path.join(this.absDocsPath, '..', '.vitepress', 'config', 'sidebar', lang))
                : normalizePathSeparators(path.join(this.absDocsPath, '..', '.vitepress', 'config', 'sidebar', lang, currentConfigDirSignature));

            const metadataDirPath = currentConfigDirSignature === '_root'
                ? normalizePathSeparators(path.join(this.absDocsPath, '..', '.vitepress', 'config', 'sidebar', '.metadata', lang))
                : normalizePathSeparators(path.join(this.absDocsPath, '..', '.vitepress', 'config', 'sidebar', '.metadata', lang, currentConfigDirSignature));

            const physicalDirPath = currentConfigDirSignature === '_root'
                ? normalizePathSeparators(path.join(this.absDocsPath, lang))
                : normalizePathSeparators(path.join(this.absDocsPath, lang, currentConfigDirSignature));

            const physicalDirectories = new Set<string>();
            if (await this.jsonFileHandler.getFileSystem().exists(physicalDirPath)) {
                const physicalItems = await this.jsonFileHandler.getFileSystem().readDir(physicalDirPath);
                for (const item of physicalItems) {
                    const itemName = typeof item === 'string' ? item : item.name;
                    const itemPath = normalizePathSeparators(path.join(physicalDirPath, itemName));
                    const stat = await this.jsonFileHandler.getFileSystem().stat(itemPath);
                    
                    if (stat.isDirectory()) {
                        physicalDirectories.add(itemName);
                    }
                }
            }

            const orphanedDirectories = new Set<string>();

            if (await this.jsonFileHandler.getFileSystem().exists(configDirPath)) {
                const configItems = await this.jsonFileHandler.getFileSystem().readDir(configDirPath);
                for (const item of configItems) {
                    const itemName = typeof item === 'string' ? item : item.name;

                    if (itemName.endsWith('.json') || itemName.startsWith('.')) {
                        continue;
                    }

                    const itemPath = normalizePathSeparators(path.join(configDirPath, itemName));
                    const stat = await this.jsonFileHandler.getFileSystem().stat(itemPath);
                    
                    if (stat.isDirectory() && !physicalDirectories.has(itemName)) {
                        orphanedDirectories.add(itemName);
                    }
                }
            }

            if (await this.jsonFileHandler.getFileSystem().exists(metadataDirPath)) {
                const metadataItems = await this.jsonFileHandler.getFileSystem().readDir(metadataDirPath);
                for (const item of metadataItems) {
                    const itemName = typeof item === 'string' ? item : item.name;
                    
                    if (itemName.endsWith('.json') || itemName.startsWith('.')) {
                        continue;
                    }

                    const itemPath = normalizePathSeparators(path.join(metadataDirPath, itemName));
                    const stat = await this.jsonFileHandler.getFileSystem().stat(itemPath);
                    
                    if (stat.isDirectory() && !physicalDirectories.has(itemName)) {
                        orphanedDirectories.add(itemName);
                    }
                }
            }

            for (const orphanedDirName of orphanedDirectories) {
                await this.archiveOrphanedConfigAndMetadata(configDirPath, metadataDirPath, currentConfigDirSignature, lang, orphanedDirName);
            }

            await this.cleanupOrphanedJsonEntries(currentConfigDirSignature, lang, physicalDirectories);

        } catch (error) {
            console.warn(`Error during cleanup for ${currentConfigDirSignature}:`, error);
        }
    }

    /**
     * @method archiveOrphanedConfigAndMetadata
     * @description Archives both the config and metadata directories for an orphaned directory.
     * @param {string} configDirPath - Path to configuration directory
     * @param {string} metadataDirPath - Path to metadata directory
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {string} dirName - Directory name to archive
     * @returns {Promise<void>}
     * @private
     */
    private async archiveOrphanedConfigAndMetadata(
        configDirPath: string,
        metadataDirPath: string,
        currentConfigDirSignature: string,
        lang: string,
        dirName: string
    ): Promise<void> {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            
            const archiveBasePath = normalizePathSeparators(path.join(
                this.absDocsPath, '..', '.vitepress', 'config', 'sidebar', '.archive',
                'removed_directories',
                `${dirName}_removed_${timestamp}`
            ));

            await this.jsonFileHandler.getFileSystem().ensureDir(archiveBasePath);
            
            const configArchivePath = normalizePathSeparators(path.join(archiveBasePath, 'config'));
            const metadataArchivePath = normalizePathSeparators(path.join(archiveBasePath, 'metadata'));
            
            await this.jsonFileHandler.getFileSystem().ensureDir(configArchivePath);
            await this.jsonFileHandler.getFileSystem().ensureDir(metadataArchivePath);

            const fs = await import('node:fs/promises');
            
            const sourceConfigPath = normalizePathSeparators(path.join(configDirPath, dirName));
            if (await this.jsonFileHandler.getFileSystem().exists(sourceConfigPath)) {
                const targetConfigPath = normalizePathSeparators(path.join(configArchivePath, dirName));
                
                try {
                    await fs.rename(sourceConfigPath, targetConfigPath);
                } catch (renameError) {
                    await fs.cp(sourceConfigPath, targetConfigPath, { recursive: true });
                    await this.jsonFileHandler.getFileSystem().deleteDir(sourceConfigPath);
                }
            }

            const sourceMetadataPath = normalizePathSeparators(path.join(metadataDirPath, dirName));
            if (await this.jsonFileHandler.getFileSystem().exists(sourceMetadataPath)) {
                const targetMetadataPath = normalizePathSeparators(path.join(metadataArchivePath, dirName));
                
                try {
                    await fs.rename(sourceMetadataPath, targetMetadataPath);
                } catch (renameError) {
                    await fs.cp(sourceMetadataPath, targetMetadataPath, { recursive: true });
                    await this.jsonFileHandler.getFileSystem().deleteDir(sourceMetadataPath);
                }
            }

            const readmePath = normalizePathSeparators(path.join(archiveBasePath, 'README.md'));
            const readmeContent = `# Archived Directory: ${dirName}

**Archive Date**: ${new Date().toISOString()}
**Original Location**: ${currentConfigDirSignature}/${dirName}
**Reason**: Physical directory no longer exists in docs structure

## Contents
This archive contains both the configuration files and metadata for a directory that was removed from the physical docs structure.

- \`config/\` - Contains the JSON configuration files (locales.json, order.json, etc.)
- \`metadata/\` - Contains the metadata files tracking configuration history

## Restoration
To restore this directory:

1. **Recreate the physical directory**: 
   \`mkdir -p docs/${lang}/${currentConfigDirSignature}/${dirName}/\`

2. **Restore configuration files**:
   \`cp -r config/${dirName}/ .vitepress/config/sidebar/${lang}/${currentConfigDirSignature}/${dirName}/\`

3. **Restore metadata files**:
   \`cp -r metadata/${dirName}/ .vitepress/config/sidebar/.metadata/${lang}/${currentConfigDirSignature}/${dirName}/\`

4. **Restart the development server**

## Archive Structure
\`\`\`
${dirName}_removed_${timestamp}/
├── README.md (this file)
├── config/${dirName}/     # Original config files
└── metadata/${dirName}/   # Original metadata files
\`\`\`
`;

            await this.jsonFileHandler.getFileSystem().writeFile(readmePath, readmeContent);

        } catch (error) {
            console.error(`Failed to archive config and metadata for directory ${dirName}:`, error);
        }
    }

    /**
     * @method cleanupOrphanedJsonEntries
     * @description Cleans up orphaned entries in JSON files that don't correspond to physical directories.
     * SECURITY ENHANCEMENT: Now checks metadata to determine if entries are user-modified before deletion.
     * This prevents accidental loss of user configurations during temporary directory states.
     * @param {string} currentConfigDirSignature - Current configuration directory signature
     * @param {string} lang - Language code
     * @param {Set<string>} physicalDirectories - Set of existing physical directories
     * @returns {Promise<void>}
     * @private
     */
    private async cleanupOrphanedJsonEntries(
        currentConfigDirSignature: string,
        lang: string,
        physicalDirectories: Set<string>
    ): Promise<void> {
        const overrideTypes: JsonOverrideFileType[] = ['locales', 'collapsed', 'hidden', 'order'];

        for (const type of overrideTypes) {
            try {
                const currentData = await this.jsonFileHandler.readJsonFile(type, lang, currentConfigDirSignature);
                const metadata = await this.metadataManager.readMetadata(type, lang, currentConfigDirSignature);
                const updatedData = { ...currentData };
                let hasChanges = false;

                for (const [key, value] of Object.entries(currentData)) {
                    if (key === '_self_') {
                        continue;
                    }

                    const dirName = key.endsWith('/') ? key.slice(0, -1) : key.replace(/\.(md|html)$/, '');
                    
                    if (key.endsWith('/') && !physicalDirectories.has(dirName)) {
                        const entryMetadata = metadata[key];
                        const isUserModified = entryMetadata && entryMetadata.isUserSet === true;
                        
                        if (!isUserModified) {
                            delete updatedData[key];
                            hasChanges = true;
                        } else {
                            console.warn(`Preserving user-modified entry '${key}' even though directory '${dirName}' doesn't exist`);
                        }
                    }
                }

                if (hasChanges) {
                    await this.jsonFileHandler.writeJsonFile(type, lang, currentConfigDirSignature, updatedData);
                }

            } catch (error) {
                console.warn(`Error cleaning ${type}.json for ${currentConfigDirSignature}:`, error);
            }
        }
    }
} 

