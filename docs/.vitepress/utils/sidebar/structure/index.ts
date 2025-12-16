/**
 * @fileoverview Structure module exports for sidebar generation system.
 * 
 * This module provides a unified interface for all structural components
 * used in sidebar generation. It exports services, processors, and utilities
 * for creating hierarchical sidebar structures from file system content.
 * 
 * @module StructureIndex
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

/**
 * Export the main structural generator service.
 * Coordinates the overall sidebar structure generation process.
 */
export { StructuralGeneratorService } from './StructuralGeneratorService';

/**
 * Export group processing utilities.
 * Handles extraction and organization of grouped content.
 */
export { processGroup } from './groupProcessor';

/**
 * Export item processing utilities.
 * Handles individual file and directory processing.
 */
export { processItem } from './itemProcessor';

/**
 * Export link generation utilities.
 * Generates appropriate links for sidebar items.
 */
export { generateLink } from './linkGenerator';

/**
 * Export path key generation utilities.
 * Creates unique identifiers for sidebar items.
 */
export { generatePathKey } from './pathKeyGenerator';

/**
 * Export item sorting utilities.
 * Handles ordering and prioritization of sidebar items.
 */
export { sortItems } from './itemSorter';

