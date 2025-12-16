/// <reference types="vite/client" />

import { ref, reactive } from 'vue';
import { useData } from 'vitepress';
import { getLanguages, getDefaultLanguage } from '../../../config/project-config';
import componentIdMappingData from '../../../config/locale/component-id-mapping.json';

interface ComponentIdMapping {
    generatedAt: string;
    description: string;
    mappings: Record<string, string>;
}

class TranslationCache {
    private cache = reactive<Record<string, Record<string, string>>>({});
    private currentLang = ref('en-US');
    private componentIdMapping: Record<string, string> = {};
    private mappingLoaded = false;

    constructor() {
        const defaultLang = getDefaultLanguage();
        this.currentLang.value = defaultLang.code;
        this.loadComponentIdMapping();
    }

    private loadComponentIdMapping(): void {
        if (this.mappingLoaded) return;
        
        try {
            const mappingData = componentIdMappingData as ComponentIdMapping;
            this.componentIdMapping = mappingData.mappings || {};
            this.mappingLoaded = true;
        } catch (error) {
            this.mappingLoaded = true;
        }
    }

    private getComponentFilePath(componentId: string): string {
        return this.componentIdMapping[componentId] || componentId;
    }

    private detectLanguageFromURL(): string | null {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const languages = getLanguages();
            for (const lang of languages) {
                const linkPath = lang.link || `/${lang.code}/`;
                if (path.startsWith(linkPath)) {
                    return lang.code;
                }
            }
        }
        return null;
    }

    private detectLanguageFromVitePress(): string | null {
        try {
            const { lang } = useData();
            if (lang?.value) {
                return lang.value;
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    private isValidLanguage(lang: string): boolean {
        const languages = getLanguages();
        return languages.some(l => l.code === lang);
    }

    private getCurrentLanguage(): string {
        const urlLang = this.detectLanguageFromURL();
        if (urlLang && this.isValidLanguage(urlLang)) {
            this.currentLang.value = urlLang;
            return urlLang;
        }

        const vitePressed = this.detectLanguageFromVitePress();
        if (vitePressed && this.isValidLanguage(vitePressed)) {
            this.currentLang.value = vitePressed;
            return vitePressed;
        }

        const defaultLang = getDefaultLanguage();
        this.currentLang.value = defaultLang.code;
        return defaultLang.code;
    }

    public getTranslations<T extends Record<string, string>>(
        componentId: string,
        defaultTranslations: T
    ): T {
        const lang = this.getCurrentLanguage();
        const cacheKey = `${componentId}@${lang}`;
        
        if (!this.cache[cacheKey]) {
            this.cache[cacheKey] = { ...defaultTranslations };
            this.loadTranslationsAsync(componentId, lang, defaultTranslations);
        }
        
        return this.cache[cacheKey] as T;
    }

    private async loadTranslationsAsync<T extends Record<string, string>>(
        componentId: string,
        lang: string,
        defaultTranslations: T
    ): Promise<void> {
        try {
            this.loadComponentIdMapping();
            const componentFilePath = this.getComponentFilePath(componentId);
            let translations: Record<string, string> = {};
            
            const languages = getLanguages();
            const currentLang = languages.find(l => l.code === lang);
            
            if (currentLang) {
                try {
                    const translationModules = import.meta.glob('../../../config/locale/*/components/**/*.json');
                    const modulePath = `../../../config/locale/${lang}/components/${componentFilePath}.json`;
                    
                    if (translationModules[modulePath]) {
                        const module = await translationModules[modulePath]();
                        translations = (module as any).default || module;
                    }
                } catch (error) {
                    // Silent fail
                }
            }
            
            const cacheKey = `${componentId}@${lang}`;
            
            if (this.cache[cacheKey]) {
                for (const [key, value] of Object.entries(translations)) {
                    this.cache[cacheKey][key] = value;
                }
            } else {
                this.cache[cacheKey] = { ...defaultTranslations, ...translations };
            }
        } catch (error) {
            // Silent fail
        }
    }
}

const translationCache = new TranslationCache();

export function useSafeI18n<T extends Record<string, string>>(
    componentId: string,
    defaultTranslations: T
): { t: T } {
    const translations = translationCache.getTranslations(componentId, defaultTranslations);
    return { t: translations };
}

export function createI18nHook<T extends Record<string, string>>(
    componentId: string,
    defaultTranslations: T
) {
    return () => useSafeI18n(componentId, defaultTranslations);
} 