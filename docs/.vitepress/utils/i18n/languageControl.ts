import { computed } from "vue";
import { useData } from "vitepress";
import { getLanguages, getDefaultLanguage, getProjectInfo } from "../../config/project-config";

function ensureStartingSlash(path: string): string {
    return /^\//.test(path) ? path : `/${path}`;
}

export function useLangs({ correspondingLink = false } = {}) {
    const { site, localeIndex, page, theme, hash } = useData();
    
    const languages = getLanguages();
    const defaultLang = getDefaultLanguage();
    const projectInfo = getProjectInfo();
    
    const currentLang = computed(() => ({
        label: site.value.locales[localeIndex.value]?.label,
        link:
            site.value.locales[localeIndex.value]?.link ||
            (localeIndex.value === "root" ? "/" : `/${localeIndex.value}/`),
    }));

    const localeLinks = computed(() =>
        Object.entries(site.value.locales).flatMap(([key, value]) =>
            currentLang.value.label === value.label
                ? []
                : {
                        text: value.label,
                        link:
                        normalizeLink(
                            value.link || (key === "root" ? "/" : `/${key}/`),
                            theme.value.i18nRouting !== false &&
                                correspondingLink,
                            (() => {
                                const relativePath = page.value.relativePath;                                  
                                let cleanPath = relativePath;
                                const basePath = projectInfo.base.replace(/^\/|\/$/g, '');
                                if (basePath && cleanPath.startsWith(`${basePath}/`)) {
                                    cleanPath = cleanPath.slice(`${basePath}/`.length);
                                }
                                for (const lang of languages) {
                                    const linkPath = lang.link || `/${lang.code}/`;
                                    const cleanLinkPath = linkPath.replace(/^\/|\/$/g, '');
                                    if (cleanPath.startsWith(`${cleanLinkPath}/`)) {
                                        cleanPath = cleanPath.slice(`${cleanLinkPath}/`.length);
                                        break;
                                    }
                                }
                                return cleanPath;
                            })(),
                            !site.value.cleanUrls
                        ) + hash.value,
                }
        )
    );

    return { localeLinks, currentLang };
}

function normalizeLink(
    link: string,
    addPath: boolean,
    path: string,
    addExt: boolean
) {
    return addPath
        ? link.replace(/\/$/, "") +
            ensureStartingSlash(
                path
                    .replace(/(^|\/)index\.md$/, "$1")
                    .replace(/\.md$/, addExt ? ".html" : "")
            )
        : link;
}

/// <reference types="vite/client" />

export const traditionalChineseStyles = `
    :root,
    body,
    .VPDoc,
    .vp-doc,
    .content,
    .content-container,
    main,
    article {
        font-variant-east-asian: traditional !important;
    }

    .vp-doc h1,
    .vp-doc h2,
    .vp-doc h3,
    .vp-doc h4,
    .vp-doc h5,
    .vp-doc h6,
    .vp-doc p,
    .vp-doc li,
    .vp-doc a,
    .vp-doc span,
    .vp-doc div,
    .nav-bar-title,
    .VPNavBarTitle,
    .VPNavBar,
    .VPNavBarMenu,
    .VPNavScreen,
    .VPSidebar,
    .VPFooter,
    .VPTeamPage,
    .VPHomeHero,
    .VPFeatures {
        font-variant-east-asian: traditional !important;
    }

    * {
        font-variant-east-asian: traditional !important;
    }
`;

export const checkFontLoading = async () => {
    if (import.meta.env.SSR) return;

    try {
        const fontCheckPromise = Promise.race([
            document.fonts.ready,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Font loading timeout")), 5000)
            ),
        ]);

        await fontCheckPromise;
        console.log("System fonts loaded successfully");
    } catch (error) {
        console.error("Font loading check error:", error);
    }
};

export const applyTraditionalChinese = () => {
    if (import.meta.env.SSR) return;

    const docElement = document.documentElement;
    const styleId = "traditional-chinese-style";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        styleElement.textContent = traditionalChineseStyles;
        document.head.appendChild(styleElement);

        document.body.style.setProperty(
            "font-variant-east-asian",
            "traditional",
            "important"
        );
    }
};

export const setupLanguageControl = () => {
    if (import.meta.env.SSR) return;

    const browserLang = navigator.language;
    if (browserLang === "zh-TW" || browserLang === "zh-HK") {
        applyTraditionalChinese();
        checkFontLoading();
    }
};
