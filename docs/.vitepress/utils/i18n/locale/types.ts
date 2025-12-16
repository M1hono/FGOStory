/**
 * @file Type definitions for the component-scoped i18n system.
 */

/**
 * Represents the structure of a translation JSON file.
 * It's a key-value store where keys are dot-notation strings.
 */
export type TranslationFile = Record<string, string>;

/**
 * Represents the in-memory cache of all loaded translations.
 * The top-level key is the language code (e.g., 'en-US').
 * The next level is the component path (e.g., 'content/Contributors').
 * The final level is the translation data itself.
 *
 * @example
 * {
 *   'en-US': {
 *     'content/Contributors': {
 *       'title': 'Contributors',
 *       'loading': 'Loading...'
 *     }
 *   }
 * }
 */
export type TranslationsCache = Record<string, Record<string, TranslationFile>>;

/**
 * Options for initializing the LocaleManager.
 * This interface is reserved for future configuration options.
 */
export interface LocaleManagerOptions {} 