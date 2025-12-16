/**
 * VitePress Utils Plugin System
 * Organized utility functions for easy access via @utils
 */
import { contentUtils } from "./content";
import { vitepressUtils } from "./vitepress";
import { chartsUtils } from "./charts";
import { countWord } from "./content/functions";

export const utils = {
    content: contentUtils,
    vitepress: vitepressUtils,
    charts: chartsUtils,
    countWord,
    text: contentUtils.text,
};

export default utils;

export { contentUtils as content } from "./content";
export { vitepressUtils as vitepress } from "./vitepress";
export { chartsUtils as charts } from "./charts";

export * from "./content/functions";
