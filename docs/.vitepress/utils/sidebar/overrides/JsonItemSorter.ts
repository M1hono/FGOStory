/**
 * @fileoverview JSON-based sorting utilities for sidebar items.
 * 
 * This module provides sophisticated sorting capabilities for sidebar items
 * based on order.json configuration files. It implements priority-based
 * sorting with alphanumeric fallbacks and recursive processing for nested
 * directory structures while preserving hierarchical relationships.
 * 
 * @module JsonItemSorter
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import { SidebarItem } from '../types';

/**
 * JSON-based item sorter for sidebar configurations.
 * 
 * Provides advanced sorting functionality for sidebar items using order.json
 * configuration data. Implements a priority-based sorting system where items
 * with explicit order values take precedence, while items without explicit
 * ordering fall back to alphanumeric sorting by their keys or text.
 * 
 * Key features:
 * - Priority-based sorting from order.json configurations
 * - Alphanumeric fallback for items without explicit ordering
 * - Recursive processing for nested directory structures
 * - Automatic priority inheritance for directories from child items
 * - Support for both numeric and string-numeric order values
 * 
 * @class JsonItemSorter
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const sorter = new JsonItemSorter();
 * 
 * const orderConfig = {
 *   'introduction.md': 1,
 *   'concepts/': 2,
 *   'advanced.md': 3
 * };
 * 
 * const sortedItems = sorter.sortItems(sidebarItems, orderConfig);
 * ```
 */
export class JsonItemSorter {
    /**
     * Creates an instance of JsonItemSorter.
     * 
     * Initializes the sorter with a lightweight constructor. Configuration
     * and context are provided per-operation through method parameters for
     * maximum flexibility and testability.
     * 
     * @since 1.0.0
     */
    constructor() {
    }

    /**
     * Sorts sidebar items based on order.json data with intelligent fallbacks.
     * 
     * Implements a comprehensive sorting strategy that respects explicit ordering
     * from order.json files while providing sensible fallbacks for items without
     * explicit configuration. The sorting process:
     * 
     * 1. Items with valid order.json entries are sorted by their numeric values
     * 2. Items without explicit ordering are sorted alphanumerically
     * 3. Directory items inherit priority from their children when not explicitly set
     * 4. Nested structures are processed recursively
     * 5. Priority values are assigned to items for downstream processing
     * 
     * @param {SidebarItem[]} itemsToFinalSort - Array of sidebar items to sort
     * @param {Record<string, any>} orderJsonData - Order configuration from order.json file
     * @returns {SidebarItem[]} New array of sorted sidebar items with updated priorities
     * @since 1.0.0
     * @public
     * @example
     * ```typescript
     * const sortedItems = sorter.sortItems(sidebarItems, {
     *   'intro.md': 1,
     *   'concepts/': 2,
     *   'api/': 3,
     *   'advanced.md': '4'  // String numbers are parsed
     * });
     * ```
     */
    public sortItems(        
        itemsToFinalSort: SidebarItem[], 
        orderJsonData: Record<string, any> 
    ): SidebarItem[] {
        if (!itemsToFinalSort || itemsToFinalSort.length === 0) {
            return [];
        }

        const itemsWithSortInfo = itemsToFinalSort.map(item => {
            const orderKey = item._relativePathKey || item.text;
            let order = Number.MAX_SAFE_INTEGER;
            
            if (orderKey && orderJsonData.hasOwnProperty(orderKey)) {
                const orderVal = orderJsonData[orderKey];
                if (typeof orderVal === 'number' && !isNaN(orderVal)) {
                    order = orderVal;
                    item._priority = order;
                } else if (typeof orderVal === 'string') {
                    const parsedOrder = parseFloat(orderVal);
                    if (!isNaN(parsedOrder)) {
                        order = parsedOrder;
                        item._priority = order;
                    }
                }
            }

            if (item._isDirectory && item.items && item.items.length > 0) {
                item.items = this.sortItems(item.items, orderJsonData);
                
                if (item._priority === Number.MAX_SAFE_INTEGER) {
                    const childPriorities = item.items
                        .map(child => typeof child._priority === 'number' ? child._priority : Number.MAX_SAFE_INTEGER)
                        .filter(p => p !== Number.MAX_SAFE_INTEGER);
                    if (childPriorities.length > 0) {
                        const minChildPriority = Math.min(...childPriorities);
                        item._priority = minChildPriority;
                        order = minChildPriority;
                    }
                }
            }

            return { 
                item, 
                order: typeof item._priority === 'number' ? item._priority : Number.MAX_SAFE_INTEGER,
                sortKey: item._relativePathKey || item.text || '' 
            };
        });

        itemsWithSortInfo.sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.sortKey.localeCompare(b.sortKey);
        });

        return itemsWithSortInfo.map(wrappedItem => wrappedItem.item);
    }
} 

