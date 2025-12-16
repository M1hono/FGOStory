/**
 * @fileoverview Item sorting utilities for sidebar generation.
 * 
 * This module provides functionality for sorting sidebar items based on
 * priority values, item order configurations, and fallback alphabetical
 * ordering. It handles both explicit priority assignments and order
 * configurations from JSON files.
 * 
 * @module ItemSorter
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import { SidebarItem } from '../types';

/**
 * Applies item order configuration to priority values for sidebar items.
 * 
 * Converts itemOrder configuration (typically from order.json files) into
 * priority values that can be used for sorting. This ensures that explicit
 * ordering configurations properly influence the final sidebar structure.
 * Recursively processes nested items to maintain hierarchical ordering.
 * 
 * @param {SidebarItem[]} items - Array of SidebarItems to process
 * @param {Record<string, number>} [itemOrderConfig={}] - The itemOrder configuration from order.json
 * @since 1.0.0
 * @private
 */
function applyItemOrderToPriority(
    items: SidebarItem[],
    itemOrderConfig: Record<string, number> = {}
): void {
    let minExplicitPriority = Number.MAX_SAFE_INTEGER;
    let maxExplicitPriority = Number.MIN_SAFE_INTEGER;
    
    for (const item of items) {
        if (item._priority !== undefined) {
            minExplicitPriority = Math.min(minExplicitPriority, item._priority);
            maxExplicitPriority = Math.max(maxExplicitPriority, item._priority);
        }
    }
    
    for (const item of items) {
        const orderKey = item._relativePathKey || item.text;
        if (orderKey && itemOrderConfig.hasOwnProperty(orderKey)) {
            item._priority = itemOrderConfig[orderKey];
        } else if (item._priority === undefined) {
            item._priority = 0;
        }
        
        if (item.items && Array.isArray(item.items)) {
            applyItemOrderToPriority(item.items, itemOrderConfig);
        }
    }
}

/**
 * Sorts an array of SidebarItems based on their priority values and configurations.
 * 
 * Performs comprehensive sorting of sidebar items by first applying item order
 * configurations to set priorities, then sorting based on priority values with
 * alphabetical fallback. Recursively sorts nested items to maintain proper
 * hierarchical ordering throughout the sidebar structure.
 * 
 * @param {SidebarItem[]} itemsToSort - The array of SidebarItems to sort
 * @param {Record<string, number>} [itemOrderConfig={}] - The itemOrder configuration from order.json
 * @returns {SidebarItem[]} A new array of sorted SidebarItems
 * @since 1.0.0
 * @public
 * @example
 * ```typescript
 * const sortedItems = sortItems(sidebarItems, {
 *   'introduction.md': 1,
 *   'advanced/': 2,
 *   'api/': 3
 * });
 * ```
 */
export function sortItems(
    itemsToSort: SidebarItem[], 
    itemOrderConfig: Record<string, number> = {}
): SidebarItem[] {
    applyItemOrderToPriority(itemsToSort, itemOrderConfig);
    
    const itemsWithSortInfo = itemsToSort.map(item => ({
        item,
        priority: item._priority ?? 0,
        originalText: item.text || item._relativePathKey || ''
    }));

    itemsWithSortInfo.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        
        return a.originalText.localeCompare(b.originalText);
    });

    const sortedItems = itemsWithSortInfo.map(wrappedItem => {
        const item = wrappedItem.item;
        
        if (item.items && Array.isArray(item.items)) {
            item.items = sortItems(item.items, itemOrderConfig);
        }
        
        return item;
    });

    return sortedItems;
} 

