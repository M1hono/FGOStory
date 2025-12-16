/**
 * VitePress utilities for CryChicDoc
 * Sidebar generation and VitePress-specific functionality
 */

import * as metadata from "./metadata";
import * as navigation from "./navigation";

export * from "./metadata";export * from "./navigation";

export const vitepressUtils = {
    ...metadata,
    ...navigation,
};

export default vitepressUtils;
