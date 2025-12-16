<script lang="ts" setup>
    // @i18n
    import { useData } from "vitepress";
    import { computed } from "vue";
    import { useSafeI18n } from "@utils/i18n/locale";

    const { t } = useSafeI18n("state-component", {
        preliminaryTitle: '🌱 Preliminary Completion',
        preliminaryText: 'The content in this article has been preliminarily completed and can serve as a reference. However, there may be possible errors or areas in need of improvement.',
        unfinishedTitle: '🚧 Unfinished',
        unfinishedText: 'The content in this article is still being written and may contain errors or missing information. It will be completed in the future.',
        outdatedTitle: '🚨 Outdated',
        outdatedText: 'The content in this article may be outdated and not applicable to the latest version. Please discern carefully.',
        renovatingTitle: '🕓 Under Renovation',
        renovatingText: 'The outdated content in this article is currently being renovated. The outdated sections may not apply to the latest version. Please discern carefully.'
    });

    const { frontmatter } = useData();

    type StateType = "preliminary" | "unfinished" | "outdated" | "renovating";

    const state = computed(
        () => switchState(frontmatter.value?.state) ?? false
    );

    function switchState(state: string): StateType | void {
        switch (state) {
            case "preliminary":
            case "unfinished":
            case "outdated":
            case "renovating":
                return state;
            default:
                break;
        }
    }

    const i18nText = computed(() => {
        if (!state.value) return { title: '', text: '' };
        const translations = t as any;
        return {
            title: translations[`${state.value}Title`],
            text: translations[`${state.value}Text`],
        }
    });

    const colorControl = computed(() =>
        state.value === "preliminary" || state.value === "renovating"
            ? "var(--vp-custom-block-warning-bg)"
            : "var(--vp-custom-block-danger-bg)"
    );
</script>
<template>
    <div v-if="state" class="state custom-block">
        <p class="custom-block-title">
            {{ i18nText.title }}
        </p>
        <p>{{ i18nText.text }}</p>
    </div>
</template>
<style scoped>
    .custom-block.state {
        background-color: v-bind(colorControl);
    }
</style>
