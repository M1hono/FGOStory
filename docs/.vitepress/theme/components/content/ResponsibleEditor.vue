<script setup lang="ts">
    //@ts-nocheck
    import { useData } from "vitepress";
    import { computed } from "vue";
    import { useSafeI18n } from "@utils/i18n/locale";
    import { getProjectInfo } from "../../../config/project-config";

    const { t } = useSafeI18n("responsible-editor", {
        editorLabel: "Responsible Editor:",
    });

    const { isDark, lang, frontmatter } = useData();
    const projectInfo = getProjectInfo();

    const editor = computed(() => {
        return frontmatter.value?.editor ?? projectInfo.author;
    });

    function getAvatarUrl(name: string) {
        return `https://github.com/${name}.png`;
    }

    function getGitHubLink(name: string) {
        return `https://github.com/${name}`;
    }
</script>

<template>
    <v-card v-if="editor" variant="plain">
        <v-row align="center" class="align-center gap-4 con" no-gutters>
            <v-col cols="auto">
                <p class="vp-main-color">{{ t.editorLabel }}</p>
            </v-col>
            <v-col cols="auto">
                <a
                    :href="getGitHubLink(editor)"
                    rel="noreferrer"
                    target="_blank"
                    class="flex items-center gap-2"
                >
                    <img
                        :src="getAvatarUrl(editor)"
                        class="w-8 h-8 rounded-full"
                    />
                    <p class="vp-main-color">{{ editor }}</p>
                </a>
            </v-col>
        </v-row>
    </v-card>
</template>

<style scoped>
    .flex {
        display: flex;
    }

    .flex-wrap {
        flex-wrap: wrap;
    }

    .gap-2 {
        grid-gap: 0.5rem;
        gap: 0.5rem;
    }

    .gap-4 {
        grid-gap: 1rem;
        gap: 1rem;
    }

    .items-center {
        align-items: center;
    }

    .w-8 {
        width: 2rem;
    }

    .h-8 {
        width: 2rem;
    }

    .rounded-full {
        border-radius: 9999px;
    }

    img {
        display: block;
        border: 0.1px solid var(--vp-c-brand);
    }

    p {
        line-height: 24px;
        font-weight: 500;
        color: var(--vp-c-brand);
    }

    .con {
        margin-bottom: 15px;
    }
</style>
