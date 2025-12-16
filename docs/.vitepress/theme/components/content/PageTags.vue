<template>
    <div v-if="tags && tags.length > 0" class="page-tags">
        <TagBadge
            v-for="tag in tags"
            :key="tag"
            :tag="tag"
            :clickable="true"
            @click="navigateToTag"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { useRouter, useData } from "vitepress";
    import TagBadge from "../ui/TagBadge.vue";

    interface Props {
        tags?: string[];
    }

    const props = defineProps<Props>();
    const router = useRouter();
    const { frontmatter, lang } = useData();
    
    // Language mapping from full locale to short form
    const langMapping: Record<string, string> = {
        'zh-CN': 'zh',
        'zh': 'zh',
        'en-US': 'en', 
        'en': 'en',
        'jp': 'jp',
        'ja': 'jp'
    };
    
    // Use tags from props or frontmatter
    const tags = computed(() => props.tags || frontmatter.value.tags || []);

    function navigateToTag(tag: string) {
        // Map full locale to short form for routing
        const shortLang = langMapping[lang.value] || 'zh';
        router.go(`/${shortLang}/tags?tags=${encodeURIComponent(tag)}`);
    }
</script>

<style scoped>
    .page-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .page-tags {
            gap: 0.375rem;
            margin: 0.75rem 0;
        }
    }
</style>
 