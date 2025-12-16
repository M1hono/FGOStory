<script setup lang="ts">
    // @ts-nocheck
    import { withBase, useData } from "vitepress";
    import { computed, onMounted, ref, watch } from "vue";
    import {
        getProjectInfo,
        getLanguages,
        getDefaultLanguage,
    } from "../../../config/project-config";
    import type { FooterConfig } from "../../../utils/content/footer";
    import { Icon } from "@iconify/vue";
    import utils from "../../../utils";
    import { useSafeI18n } from "../../../utils/i18n/locale";

    const { frontmatter, lang, isDark } = useData();
    const projectInfo = getProjectInfo();
    
    const { t } = useSafeI18n("footer", {
        visits: "次访问",
        siteVisitors: "位访客",
    });

    const footerData = ref<FooterConfig | null>(null);
    const currentYear = ref("");

    const isHome = computed(() => {
        return !!(
            frontmatter.value.isHome ?? frontmatter.value.layout === "home"
        );
    });

    const loadFooterData = async (currentLang: string) => {
        const languages = getLanguages();
        const defaultLang = getDefaultLanguage();

        const targetLang =
            languages.find(
                (lang) =>
                    lang.name === currentLang ||
                    lang.code === currentLang ||
                    lang.code.split("-")[0] === currentLang
            ) || defaultLang;

        try {
            const module = await import(
                `../../../config/locale/${targetLang.code}/footer.ts`
            );
            footerData.value = module.footerConfig || module.default;
        } catch (e) {
            try {
                const fallbackModule = await import(
                    `../../../config/locale/${defaultLang.code}/footer.ts`
                );
                footerData.value =
                    fallbackModule.footerConfig || fallbackModule.default;
            } catch (fallbackError) {
                console.error(
                    "Failed to load footer configuration:",
                    fallbackError
                );
                footerData.value = null;
            }
        }
    };

    const updateScreenWidth = () => {
        screenWidth.value = window.innerWidth;
    };

    watch(() => lang.value, loadFooterData, { immediate: true });

    onMounted(() => {
        currentYear.value = new Date().getFullYear().toString();
        updateScreenWidth();
        window.addEventListener('resize', updateScreenWidth);
        
        return () => {
            window.removeEventListener('resize', updateScreenWidth);
        };
    });

    const filteredGroups = computed(() => {
        if (!footerData.value?.group) return [];

        if (isHome.value) {
            return footerData.value.group;
        } else {
            return [];
        }
    });

    const screenWidth = ref(0);

    const getScreenSize = () => {
        const width = screenWidth.value;
        if (width <= 360) return 'xs';
        if (width <= 768) return 'sm';
        if (width <= 1024) return 'md';
        return 'lg';
    };

    const calculateOptimalColumns = (groupCount: number, screenSize: string) => {
        if (groupCount === 0) return 0;
        if (groupCount === 1) return 1;
        
        const maxColumns = {
            xs: 2,
            sm: 2,
            md: 3,
            lg: 4
        };

        return Math.min(groupCount, maxColumns[screenSize]);
    };

    const footerLayoutStyle = computed(() => {
        const groupCount = filteredGroups.value.length;
        if (groupCount === 0) return {};

        const screenSize = getScreenSize();
        const columns = calculateOptimalColumns(groupCount, screenSize);

        if (columns === 1) {
            return {
                gridTemplateColumns: "1fr",
                justifyItems: "center",
                maxWidth: "280px",
                gap: "24px"
            };
        } else if (columns === 2) {
            return {
                gridTemplateColumns: "repeat(2, 1fr)",
                justifyItems: "center",
                maxWidth: "100%",
                gap: screenSize === 'xs' ? "12px" : screenSize === 'sm' ? "16px" : "24px"
            };
        } else if (columns === 3) {
            return {
                gridTemplateColumns: "repeat(3, 1fr)",
                justifyItems: "center",
                maxWidth: screenSize === 'md' ? "600px" : "750px",
                gap: "40px"
            };
        } else {
            return {
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                justifyItems: "center",
                maxWidth: "1000px",
                gap: "48px"
            };
        }
    });

    const isExternalLink = (url: string) => {
        return /^https?:\/\//.test(url);
    };

    const getIconSrc = (icon: any): string => {
        if (!icon) return "";
        if (typeof icon === "string") return icon;
        if (icon.light && icon.dark) {
            return isDark.value ? icon.dark : icon.light;
        }
        return icon.icon || "";
    };

    const isSvgIcon = (src: string): boolean => {
        return src.startsWith("/") || src.endsWith(".svg");
    };

    const getIconColor = (icon: any, isDark: boolean): string | undefined => {
        if (!icon?.color) return undefined;
        return isDark ? icon.color.dark : icon.color.light;
    };
</script>

<template>
    <footer
        class="smart-footer"
        :class="{
            'on-home-page': isHome,
            'no-groups': !filteredGroups.length,
        }"
    >
        <div
            v-if="filteredGroups.length"
            class="footer-groups"
            :style="footerLayoutStyle"
        >
            <section
                v-for="(group, i) in filteredGroups"
                :key="group.title + i"
                class="footer-group"
            >
                <h3 class="group-title">
                    <img
                        v-if="group.icon && isSvgIcon(getIconSrc(group.icon))"
                        :src="withBase(getIconSrc(group.icon))"
                        class="title-icon svg-icon"
                        alt="icon"
                    />
                    <Icon
                        v-else-if="group.icon"
                        :icon="getIconSrc(group.icon)"
                        :style="{ color: getIconColor(group.icon, isDark) }"
                        class="title-icon"
                    />
                    {{ group.title }}
                </h3>
                <ul class="group-links">
                    <li
                        v-for="(link, j) in group.links"
                        :key="link.name + j"
                        class="link-item"
                    >
                        <img
                            v-if="link.icon && isSvgIcon(getIconSrc(link.icon))"
                            :src="withBase(getIconSrc(link.icon))"
                            class="link-icon svg-icon"
                            alt="icon"
                        />
                        <Icon
                            v-else-if="link.icon"
                            :icon="getIconSrc(link.icon)"
                            :style="{ color: getIconColor(link.icon, isDark) }"
                            class="link-icon"
                        />
                        <a
                            :href="link.link"
                            :rel="link.rel"
                            :target="
                                link.target ||
                                (isExternalLink(link.link)
                                    ? '_blank'
                                    : undefined)
                            "
                            class="footer-link"
                        >
                            {{ link.name }}
                            <Icon
                                v-if="isExternalLink(link.link) && !link.noIcon"
                                icon="mdi:open-in-new"
                                class="external-icon"
                            />
                        </a>
                    </li>
                </ul>
            </section>
        </div>

        <div class="footer-info">
            <div class="footer-row">
                <div
                    v-if="
                        projectInfo.footerOptions.showIcp &&
                        footerData?.beian?.icp?.number
                    "
                    class="info-item"
                >
                    <img
                        v-if="
                            footerData.beian?.showIcon &&
                            footerData.beian.icp.icon &&
                            isSvgIcon(getIconSrc(footerData.beian.icp.icon))
                        "
                        :src="withBase(getIconSrc(footerData.beian.icp.icon))"
                        class="info-icon svg-icon"
                        alt="icon"
                    />
                    <Icon
                        v-else-if="
                            footerData.beian?.showIcon &&
                            footerData.beian.icp.icon
                        "
                        :icon="getIconSrc(footerData.beian.icp.icon)"
                        :style="{
                            color: getIconColor(
                                footerData.beian.icp.icon,
                                isDark
                            ),
                        }"
                        class="info-icon"
                    />
                    <a
                        :href="
                            footerData.beian.icp.link ||
                            'https://beian.miit.gov.cn/'
                        "
                        :rel="footerData.beian.icp.rel || 'nofollow'"
                        :target="footerData.beian.icp.target"
                        class="info-link"
                    >
                        {{ footerData.beian.icp.number }}
                    </a>
                </div>

                <div
                    v-if="
                        projectInfo.footerOptions.showPolice &&
                        footerData?.beian?.police?.number
                    "
                    class="info-item"
                >
                    <img
                        v-if="
                            footerData.beian?.showIcon &&
                            footerData.beian.police.icon &&
                            isSvgIcon(getIconSrc(footerData.beian.police.icon))
                        "
                        :src="
                            withBase(getIconSrc(footerData.beian.police.icon))
                        "
                        class="info-icon svg-icon"
                        alt="icon"
                    />
                    <Icon
                        v-else-if="
                            footerData.beian?.showIcon &&
                            footerData.beian.police.icon
                        "
                        :icon="getIconSrc(footerData.beian.police.icon)"
                        :style="{
                            color: getIconColor(
                                footerData.beian.police.icon,
                                isDark
                            ),
                        }"
                        class="info-icon"
                    />
                    <a
                        :href="
                            footerData.beian.police.link ||
                            'https://beian.mps.gov.cn/'
                        "
                        :rel="footerData.beian.police.rel"
                        :target="footerData.beian.police.target"
                        class="info-link"
                    >
                        {{ footerData.beian.police.number }}
                    </a>
                </div>

                <div
                    v-if="projectInfo.footerOptions.showLicense"
                    class="info-item"
                >
                    <Icon icon="mdi:license" />
                    <a
                        :href="projectInfo.footerOptions.licenseLink"
                        rel="noopener noreferrer"
                        target="_blank"
                        class="info-link"
                    >
                        {{ projectInfo.footerOptions.licenseText }}
                    </a>
                </div>

                <div
                    v-if="projectInfo.footerOptions.showSiteStats"
                    class="info-item"
                >
                    <Icon icon="mdi:eye-outline" />
                    <span id="busuanzi_container_site_pv" class="stats-text">
                        <span id="busuanzi_value_site_pv"><i class="fa fa-spinner fa-spin"></i></span>
                        {{ t.visits }}
                    </span>
                </div>

                <div
                    v-if="projectInfo.footerOptions.showSiteStats"
                    class="info-item"
                >
                    <Icon icon="mdi:account-outline" />
                    <span id="busuanzi_container_site_uv" class="stats-text">
                        <span id="busuanzi_value_site_uv"><i class="fa fa-spinner fa-spin"></i></span>
                        {{ t.siteVisitors }}
                    </span>
                </div>
            </div>

            <div v-if="footerData?.author?.name" class="copyright-row">
                <Icon
                    :icon="
                        getIconSrc(footerData.author.icon || 'mdi:copyright')
                    "
                />
                {{
                    footerData.author.startYear
                        ? footerData.author.startYear + " - "
                        : ""
                }}{{ currentYear }}
                <a
                    :href="
                        footerData.author.link ||
                        `https://github.com/${footerData.author.name}`
                    "
                    :rel="footerData.author.rel"
                    :target="footerData.author.target"
                    class="author-link"
                >
                    {{ footerData.author.name }}
                </a>
                {{ footerData.author.text || "All Rights Reserved." }}
            </div>
        </div>
    </footer>
</template>

<style scoped>
    :root {
        --footer-bg-light: rgba(248, 248, 248, 0.75);
        --footer-bg-dark: rgba(16, 16, 20, 0.75);
        --footer-border-light: rgba(224, 224, 224, 0.5);
        --footer-border-dark: rgba(82, 82, 89, 0.5);
        --footer-highlight-light: rgba(255, 255, 255, 0.2);
        --footer-highlight-dark: rgba(255, 255, 255, 0.12);
        --footer-shadow-light: rgba(0, 0, 0, 0.03);
        --footer-shadow-dark: rgba(0, 0, 0, 0.15);
        --footer-text-primary-light: rgb(88, 88, 95);
        --footer-text-primary-dark: rgb(245, 245, 250);
        --footer-text-secondary-light: rgb(160, 160, 167);
        --footer-text-secondary-dark: rgb(200, 200, 210);
    }

    .dark {
        --footer-bg: var(--footer-bg-dark);
        --footer-border: var(--footer-border-dark);
        --footer-highlight: var(--footer-highlight-dark);
        --footer-shadow: var(--footer-shadow-dark);
        --footer-text-primary: var(--footer-text-primary-dark);
        --footer-text-secondary: var(--footer-text-secondary-dark);
    }

    :root:not(.dark) {
        --footer-bg: var(--footer-bg-light);
        --footer-border: var(--footer-border-light);
        --footer-highlight: var(--footer-highlight-light);
        --footer-shadow: var(--footer-shadow-light);
        --footer-text-primary: var(--footer-text-primary-light);
        --footer-text-secondary: var(--footer-text-secondary-light);
    }

    .smart-footer {
        position: relative;
        box-sizing: border-box;
        border-top: 1px solid var(--vp-c-gutter);
        padding: 32px 24px;
        background-color: var(--vp-c-bg);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .smart-footer.on-home-page {
        background-color: transparent;
        border-top: none;
    }

    .smart-footer.no-groups {
        padding-top: 24px;
    }

    :root:not(.dark) .smart-footer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fineNoise'%3E%3CfeTurbulence type='turbulence' baseFrequency='2.0' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fineNoise)' opacity='0.02'/%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperTexture'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='white' surfaceScale='0.8'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperTexture)' opacity='0.015'/%3E%3C/svg%3E"),
            radial-gradient(
                circle at 25% 25%,
                rgba(var(--vp-c-brand-rgb, 24, 160, 251), 0.03) 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 75% 25%,
                rgba(var(--vp-c-brand-rgb, 24, 160, 251), 0.02) 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 50% 75%,
                rgba(var(--vp-c-brand-rgb, 24, 160, 251), 0.025) 0%,
                transparent 50%
            ),
            linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.02) 0%,
                rgba(0, 0, 0, 0.015) 100%
            ),
            linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.008) 0%,
                transparent 100%
            );
        pointer-events: none;
        opacity: 0.8;
    }

    .dark .smart-footer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilterDark'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.15 0 0 0 0 0.15 0 0 0 0 0.15 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilterDark)' opacity='0.08'/%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fineNoiseDark'%3E%3CfeTurbulence type='turbulence' baseFrequency='2.0' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.08 0 0 0 0 0.08 0 0 0 0 0.08 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fineNoiseDark)' opacity='0.04'/%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperTextureDark'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23444' surfaceScale='0.8'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperTextureDark)' opacity='0.02'/%3E%3C/svg%3E"),
            radial-gradient(
                circle at 25% 25%,
                rgba(var(--vp-c-brand-rgb, 24, 160, 251), 0.05) 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 75% 25%,
                rgba(var(--vp-c-brand-rgb, 24, 160, 251), 0.04) 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 50% 75%,
                rgba(var(--vp-c-brand-rgb, 24, 160, 251), 0.045) 0%,
                transparent 50%
            ),
            linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.015) 0%,
                rgba(0, 0, 0, 0.025) 100%
            ),
            linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.008) 0%,
                transparent 100%
            );
        pointer-events: none;
        opacity: 0.85;
    }

    :root:not(.dark) .smart-footer::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 20%,
            rgba(255, 255, 255, 0.3) 80%,
            transparent 100%
        );
        pointer-events: none;
    }

    .dark .smart-footer::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 20%,
            rgba(255, 255, 255, 0.1) 80%,
            transparent 100%
        );
        pointer-events: none;
    }

    .footer-groups {
        display: grid;
        margin: 0 auto 24px;
        transition: all 0.3s ease;
        width: auto;
        justify-content: center;
    }

    .footer-groups[style*="justify-items: center"] .footer-group {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: fit-content;
        margin: 0 auto;
    }

    .footer-groups[style*="justify-items: center"] .group-links {
        align-items: flex-start;
        text-align: left;
        margin: 0;
    }

    .footer-groups[style*="justify-items: center"] .link-item {
        justify-content: start;
        text-align: left;
    }

    .footer-groups[style*="justify-items: center"] .group-title {
        justify-content: start;
        text-align: left;
        margin-bottom: 16px;
    }

    .footer-group {
        text-align: left;
        min-width: 0;
        max-width: 100%;
    }

    .group-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--footer-text-primary);
        margin-bottom: 16px;
        display: grid;
        grid-template-columns: 16px 1fr;
        gap: 10px;
        align-items: center;
        line-height: 1.2;
    }

    .group-links {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .link-item {
        display: grid;
        grid-template-columns: 16px 1fr;
        gap: 10px;
        align-items: center;
        line-height: 1.2;
    }

    .footer-link {
        color: var(--footer-text-secondary);
        text-decoration: none;
        font-size: 12px;
        font-weight: 400;
        transition: color 0.25s ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        line-height: 1.4;
    }

    .footer-link:hover {
        color: var(--vp-c-brand-1);
    }

    .info-item,
    .copyright-row {
        gap: 8px;
    }

    .title-icon,
    .link-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        display: block;
    }

    .info-icon,
    .copyright-row .iconify,
    .copyright-row .svg-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .external-icon {
        width: 14px;
        height: 14px;
        margin-left: 4px;
        opacity: 0.7;
        vertical-align: middle;
    }

    .footer-info {
        text-align: center;
        padding-top: 24px;
        border-top: 1px solid var(--vp-c-divider);
    }

    .smart-footer.no-groups .footer-info {
        padding-top: 0;
        border-top: none;
    }

    .footer-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
        margin-bottom: 12px;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 400;
        color: var(--footer-text-secondary);
    }

    .info-link {
        color: inherit;
        text-decoration: none;
        transition: color 0.25s ease;
    }

    .info-link:hover {
        color: var(--vp-c-brand-1);
    }

    .copyright-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 400;
        color: var(--footer-text-primary);
        margin-top: 8px;
    }

    .author-link {
        color: var(--vp-c-brand-1);
        text-decoration: none;
        font-weight: 500;
        transition: opacity 0.25s ease;
    }

    .author-link:hover {
        opacity: 0.8;
    }

    .stats-text {
        font-size: 12px;
        font-weight: 400;
        color: inherit;
    }

    @media (max-width: 768px) {
        .smart-footer {
            padding: 24px 16px 20px;
        }

        .footer-groups {
            margin-bottom: 20px;
        }

        .footer-info {
            padding-top: 16px;
        }

        .footer-row {
            flex-direction: column;
            gap: 10px;
            margin-bottom: 12px;
        }

        .copyright-row {
            flex-wrap: wrap;
            text-align: center;
            line-height: 1.5;
            justify-content: center;
        }
    }

    @media (max-width: 480px) {
        .group-title {
            font-size: 13px;
        }

        .footer-link {
            font-size: 11px;
        }
    }

    .smart-footer:not(.on-home-page) {
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border-top: none;
        box-shadow: none;
        padding-top: 0;
    }

    .smart-footer:not(.on-home-page)::before,
    .smart-footer:not(.on-home-page)::after {
        display: none;
    }
</style>
