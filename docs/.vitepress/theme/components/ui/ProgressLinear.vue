<script lang="ts" setup>
    // @i18n
    import { useData } from "vitepress";
    import { computed, ref, onMounted } from "vue";
    import { useSafeI18n } from "@utils/i18n/locale";

    const { t } = useSafeI18n("progress-linear", {
        progressStatus: "Status"
    });

    const { page, frontmatter, lang, isDark } = useData();

    onMounted(() => {
        updateProgress();
    });

    const isProgress = computed(() => {
        return frontmatter.value?.progress ?? false;
    });

    const bufferValue = computed(() => frontmatter.value?.progress ?? 0);
    const progressValue = ref(0);

    function updateProgress() {
        if (progressValue.value < bufferValue.value) {
            progressValue.value += 1;
            setTimeout(updateProgress, 20);
        }
    }

    const color = computed(() => "var(--progress-color)");
</script>

<template>
    <v-row v-if="isProgress" align="center">
        <v-col cols="2">
            <v-btn
                class="btn progress"
                rounded="lg"
                prepend-icon="mdi-progress-clock"
                variant="text"
                density="comfortable"
            >
                {{ t.progressStatus }}
            </v-btn>
        </v-col>
        <v-col>
            <v-progress-linear
                :height="7"
                class="theme"
                rounded
                :model-value="progressValue"
                :buffer-value="bufferValue"
            />
        </v-col>
    </v-row>
</template>

<style>
    .theme {
        color: v-bind(color);
    }

    .progress .v-btn__prepend {
        margin-inline: calc(var(--v-btn-height) / -9) 0px !important;
        color: var(--progress-text-color);
        opacity: var(--metadata-icon-opacity);
    }
</style>
