<template>
    <div
        v-if="showComment"
        class="giscus-wrapper"
        ref="giscusContainer"
        :data-loading-text="isLoading ? t.loading : undefined"
    ></div>
</template>

<script lang="ts" setup>
// @i18n
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { useData, useRoute } from "vitepress";
import { useSafeI18n } from "../../../utils/i18n/locale";
import { getLanguageByCode, getDefaultLanguage } from "../../../config/project-config";

const { isDark, lang, frontmatter } = useData();
const route = useRoute();

const { t } = useSafeI18n("comment-component", {
    loading: "Loading comments...",
});

const showComment = computed(() => frontmatter.value.showComment !== false);

const currentLanguage = computed(() => {
    return getLanguageByCode(lang.value) || getDefaultLanguage();
});

const extractTerm = (path: string) => {
        const cleanedPath = path.replace(/^\/[a-z]{2}\//, "");
        return cleanedPath.length > 0 ? cleanedPath : "none";
    };

    const giscusContainer = ref<HTMLElement | null>(null);
    const isLoading = ref(false);

    const loadGiscus = async () => {
        if (
            typeof window === "undefined" ||
            !giscusContainer.value ||
            isLoading.value
        ) {
            return;
        }

        isLoading.value = true;

        try {
            giscusContainer.value.innerHTML = "";
            await nextTick();

            const script = document.createElement("script");
            script.src = "https://giscus.app/client.js";
            script.async = true;
            script.crossOrigin = "anonymous";

            script.dataset.repo = "PickAID/CrychicDoc";
            script.dataset.repoId = "R_kgDOMnN0IQ";
            script.dataset.category = "Announcements";
            script.dataset.categoryId = "DIC_kwDOMnN0Ic4Ch3qm";
            script.dataset.mapping = "specific";
            script.dataset.term = extractTerm(route.path);
            script.dataset.strict = "1";
            script.dataset.reactionsEnabled = "1";
            script.dataset.emitMetadata = "0";
            script.dataset.inputPosition = "top";
            script.dataset.lang = currentLanguage.value.giscusLang;
            script.dataset.theme = isDark.value
                ? "noborder_dark"
                : "noborder_light";

            script.onerror = () => {
                console.error("Failed to load Giscus script");
                isLoading.value = false;
            };

            script.onload = () => {
                // Script loaded, but we need to wait for the iframe to be ready
                // Check for iframe periodically
                const checkIframe = () => {
                    const iframe = giscusContainer.value?.querySelector('iframe.giscus-frame');
                    if (iframe) {
                        isLoading.value = false;
                    } else {
                        setTimeout(checkIframe, 100);
                    }
                };
                setTimeout(checkIframe, 100);
            };

            giscusContainer.value.appendChild(script);
        } catch (error) {
            console.error("Error loading Giscus:", error);
            isLoading.value = false;
        }
    };

    const updateGiscusConfig = (config: Record<string, any>) => {
        if (typeof window === "undefined" || !showComment.value) return;

        const iframe = document.querySelector(
            "iframe.giscus-frame"
        ) as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
                {
                    giscus: {
                        setConfig: config,
                    },
                },
                "https://giscus.app"
            );
        }
    };

    onMounted(() => {
        if (showComment.value) {
            loadGiscus();
        }
    });

    let routeTimer: NodeJS.Timeout;
    watch(
        () => route.path,
        () => {
            if (showComment.value) {
                clearTimeout(routeTimer);
                routeTimer = setTimeout(() => {
                    loadGiscus();
                }, 150);
            }
        }
    );

    watch(isDark, (newValue) => {
        if (showComment.value) {
            updateGiscusConfig({
                theme: newValue ? "noborder_dark" : "noborder_light",
            });
        }
    });

    watch(() => currentLanguage.value.giscusLang, (newLang) => {
        if (showComment.value) {
            updateGiscusConfig({
                lang: newLang,
            });
        }
    });

    watch(showComment, (newValue) => {
        if (newValue) {
            nextTick(() => loadGiscus());
        }
    });
</script>

<style>
    .giscus-wrapper {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--vp-c-divider);
    }

    main .giscus,
    main .giscus-frame {
        width: 100%;
    }

    main .giscus-frame {
        border: none;
    }

    .giscus-wrapper[data-loading-text]:not([data-loading-text=""])::after {
        content: attr(data-loading-text);
        display: block;
        text-align: center;
        color: var(--vp-c-text-2);
        padding: 2rem;
    }
</style>
