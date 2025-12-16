<template>
    <div ref="mindmapContainerRef" class="mindmap-container">
        <svg ref="svgRef" style="min-height: 400px"></svg>
    </div>
</template>

<script setup lang="ts">
    import {
        onMounted,
        ref,
        shallowRef,
        watch,
        onBeforeUnmount,
        computed,
    } from "vue";
    import { Transformer } from "markmap-lib";
    import { Markmap } from "markmap-view";
    import type { IMarkmapOptions } from "markmap-view";

    interface MarkMapViewProps {
        markdown: string;
    }

    const props = defineProps<MarkMapViewProps>();

    const isDark = computed(() => {
        if (typeof document === "undefined") return false;

        if (document.documentElement.classList.contains("dark")) {
            return true;
        }

        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            return true;
        }

        return false;
    });

    const mindmapContainerRef = ref<HTMLElement>();
    const svgRef = ref();
    const markmapIns = shallowRef<Markmap>();
    const resizeObserver = ref<ResizeObserver>();

    const markmapOptions = computed<Partial<IMarkmapOptions>>(() => ({
        autoFit: true,
        color: (node: any) => {
            return isDark.value
                ? getColorByDepth(node.depth, true)
                : getColorByDepth(node.depth, false);
        },
    }));

    function getColorByDepth(depth: number, isDarkMode: boolean) {
        const lightModeColors = [
            "#2ecc71",
            "#3498db",
            "#9b59b6",
            "#e67e22",
            "#e74c3c",
        ];

        const darkModeColors = [
            "#2ecc71",
            "#3498db",
            "#9b59b6",
            "#f39c12",
            "#e74c3c",
        ];

        const colors = isDarkMode ? darkModeColors : lightModeColors;
        return colors[depth % colors.length];
    }

    function renderMarkmap() {
        if (!svgRef.value || !props.markdown) return;

        const transformer = new Transformer();
        const { root } = transformer.transform(
            decodeURIComponent(props.markdown)
        );

        if (!markmapIns.value) {
            markmapIns.value = Markmap.create(
                svgRef.value,
                markmapOptions.value,
                root
            );
        } else {
            markmapIns.value.setOptions(markmapOptions.value);
            markmapIns.value.setData(root);
            markmapIns.value.fit();
        }
    }

    function handleResize() {
        if (markmapIns.value) {
            setTimeout(() => {
                markmapIns.value?.fit();
            }, 100);
        }
    }

    watch(
        () => props.markdown,
        () => {
            renderMarkmap();
        }
    );

    watch(
        () => isDark.value,
        () => {
            if (markmapIns.value) {
                markmapIns.value.setOptions(markmapOptions.value);
                markmapIns.value.renderData();
            }
        }
    );

    const darkModeObserver = ref<MutationObserver | null>(null);

    function mediaThemeChange() {
        if (markmapIns.value) {
            markmapIns.value.setOptions(markmapOptions.value);
            markmapIns.value.renderData();
        }
    }

    onMounted(() => {
        renderMarkmap();

        if (window.ResizeObserver) {
            resizeObserver.value = new ResizeObserver(handleResize);
            if (svgRef.value.parentElement) {
                resizeObserver.value.observe(svgRef.value.parentElement);
            }
        }

        window.addEventListener("resize", handleResize);

        if (typeof window !== "undefined" && window.matchMedia) {
            window
                .matchMedia("(prefers-color-scheme: dark)")
                .addEventListener("change", mediaThemeChange);
        }

        if (typeof window !== "undefined" && window.MutationObserver) {
            darkModeObserver.value = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (
                        mutation.attributeName === "class" &&
                        mutation.target === document.documentElement
                    ) {
                        if (markmapIns.value) {
                            markmapIns.value.setOptions(markmapOptions.value);
                            markmapIns.value.renderData();
                        }
                        break;
                    }
                }
            });

            darkModeObserver.value.observe(document.documentElement, {
                attributes: true,
            });
        }
    });

    onBeforeUnmount(() => {
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
        }
        window.removeEventListener("resize", handleResize);

        if (typeof window !== "undefined" && window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

            darkModeMediaQuery.removeEventListener("change", mediaThemeChange);
            darkModeMediaQuery.removeListener(() => {});
        }

        if (darkModeObserver.value) {
            darkModeObserver.value.disconnect();
        }
    });
</script>

<style lang="scss" scoped>
    .mindmap-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 12px;
        background-color: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        transition: background-color 0.5s, border-color 0.5s;

        & > svg {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }
    }

    :deep(.markmap-node) {
        color: var(--vp-c-text-1);
        font-weight: 500;
    }

    :deep(circle) {
        fill: var(--vp-c-brand-1);
    }

    :deep(.markmap-node-text) {
        transition: fill 0.5s;
        fill: var(--vp-c-text-1);
    }

    :deep(.markmap-link) {
        transition: stroke 0.5s;
        stroke: var(--vp-c-divider);
    }
</style>
