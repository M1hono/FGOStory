<script lang="ts" setup>
    import { useData } from "vitepress";
    import { computed, ref, onMounted } from "vue";
    import utils from "../../../utils";
    import ProgressLinear from "../ui/ProgressLinear.vue";
    import State from "../ui/State.vue";
    import { useSafeI18n } from "../../../utils/i18n/locale";

    const { t } = useSafeI18n("article-metadata", {
        lastUpdated: "Last updated on: {date}",
        wordCount: "Word count: {count} words",
        readingTime: "Reading time: {time} minutes",
        pageViews: "Page views: {count}",
    });

    const { page, frontmatter, lang } = useData();

    const gitTimestamp = ref<number>(0);
    const timestampCache = new Map<string, number>();

    async function getGitTimestamp(filePath: string): Promise<number> {
        if (typeof window === "undefined") return 0;

        const cached = timestampCache.get(filePath);
        if (cached) return cached;

        try {
            const response = await fetch(
                `/__git_timestamp__?file=${encodeURIComponent(filePath)}`
            );
            if (response.ok) {
                const timestamp = await response.json();
                timestampCache.set(filePath, timestamp);
                return timestamp;
            }
        } catch (error) {
            console.warn("Failed to get git timestamp:", error);
        }

        return Date.now();
    }

    const update = computed(() => {
        let timestamp = 0;

        if (frontmatter.value.lastUpdated instanceof Date) {
            timestamp = +frontmatter.value.lastUpdated;
        } else if (frontmatter.value.date) {
            timestamp = +new Date(frontmatter.value.date);
        } else if (gitTimestamp.value) {
            timestamp = gitTimestamp.value;
        } else {
            timestamp = Date.now();
        }

        return new Date(timestamp).toLocaleDateString(lang.value, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    });

    const wordCount = ref(0);
    const imageCount = ref(0);
    const pageViews = ref(0);
    const pageViewsLoading = ref(false);
    const pageViewsError = ref(false);

    const readTime = computed(() => {
        const time = utils.vitepress.readingTime.calculateTotalTime(
            wordCount.value,
            imageCount.value
        );
        return typeof time === "number" ? time : 0;
    });

    function analyze() {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
            utils.vitepress.contentAnalysis.cleanupMetadata();

            const mainContainer = window.document.querySelector(
                ".content-container .main"
            );
            if (!mainContainer) return;

            // Clone the container to avoid modifying the live DOM
            const clone = mainContainer.cloneNode(true) as HTMLElement;

            // Remove all dialog cards from the cloned container before analysis
            clone
                .querySelectorAll(".md-dialog-card")
                .forEach((el) => el.remove());

            const imgs = clone.querySelectorAll<HTMLImageElement>("img");
            imageCount.value = imgs?.length || 0;

            const words = clone.textContent || "";
            const count = utils.content.countWord(words);
            wordCount.value = typeof count === "number" ? count : 0;
        }
    }

    onMounted(async () => {
        analyze();

        if (
            page.value.filePath &&
            !frontmatter.value.lastUpdated &&
            !frontmatter.value.date
        ) {
            try {
                gitTimestamp.value = await getGitTimestamp(page.value.filePath);
            } catch (error) {
                console.warn(
                    "Failed to get git timestamp for",
                    page.value.filePath,
                    error
                );
            }
        }
    });

    const isMetadata = computed(() => {
        return frontmatter.value?.metadata ?? true;
    });

    const icon = (key: string) => {
        return utils.vitepress.getMetadataIcon(key);
    };

    const metadataContent = computed(() => ({
        update: t.lastUpdated.replace("{date}", update.value || ""),
        wordCount: t.wordCount.replace("{count}", String(wordCount.value || 0)),
        readTime: t.readingTime.replace("{time}", String(readTime.value || 0)),
    }));

    const metadataKeys = ["update", "wordCount", "readTime", "pageViews"] as const;
</script>

<template>
    <div v-if="isMetadata" class="word">
        <div>
            <v-row no-gutters>
                <v-col v-for="key in metadataKeys" :key="key">
                    <v-btn
                        class="mx-0 btn btn-icon"
                        rounded="lg"
                        variant="text"
                        density="comfortable"
                        :prepend-icon="icon(key)"
                    >
                        <span v-if="key !== 'pageViews'">
                            {{ metadataContent[key] }}
                        </span>
                        <span
                            v-if="key === 'pageViews'"
                            id="busuanzi_container_page_pv"
                        >
                            {{ t.pageViews.replace("{count}", "")
                            }}<span id="busuanzi_value_page_pv"
                                ><i class="fa fa-spinner fa-spin"></i
                            ></span>
                        </span>
                    </v-btn>
                </v-col>
            </v-row>
            <ProgressLinear />
        </div>
    </div>
    <State />
</template>

<style>
    .word,
    .btn {
        color: var(--metadata-text-color);
        font-size: var(--metadata-font-size);
    }

    .btn {
        padding-left: 12px;
        padding-right: 8px;
        font-weight: 300;
    }

    .btn-icon .v-btn__prepend {
        margin-inline: calc(var(--v-btn-height) / -9) 0px;
        color: var(--metadata-text-color);
        opacity: var(--metadata-icon-opacity);
    }
</style>
