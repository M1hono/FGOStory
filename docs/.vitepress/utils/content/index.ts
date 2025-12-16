/**
 * Content utilities for CryChicDoc
 * Word counting, text processing, and content parsing
 */

import { countWord } from "./functions";
import * as navLinkType from "./navLinkType";

/**
 * Text processing utilities
 */
export const text = {
    countWord,
    getReadingTime: (text: string, wordsPerMinute: number = 200): number => {
        const wordCount = countWord(text);
        return Math.ceil(wordCount / wordsPerMinute);
    },
};

/**
 * Main content utilities export (client-safe only)
 */
export const contentUtils = {
    text,
    countWord,
    getReadingTime: text.getReadingTime,
    navLinkType,
};

export default contentUtils;
