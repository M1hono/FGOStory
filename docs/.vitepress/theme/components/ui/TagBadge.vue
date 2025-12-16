  <template>
      <span
          :class="['tag-badge', { 'tag-badge--clickable': clickable }]"
          :data-tag="tag.toLowerCase()"
          :style="{
              '--tag-color': tagColor,
              '--tag-bg-color': tagBgColor,
          }"
          @click="handleClick"
      >
        <span class="tag-badge__text">{{ tag }}</span>
        <span v-if="count !== undefined" class="tag-badge__count">{{
            count
        }}</span>
    </span>
</template>

<script setup lang="ts">
    import { computed } from "vue";

    interface Props {
        tag: string;
        count?: number;
        clickable?: boolean;
        color?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        clickable: false,
    });

    const emit = defineEmits<{
        click: [tag: string];
    }>();

    // Generate color based on tag name for consistent styling
    const tagColor = computed(() => {
        if (props.color) return props.color;

        // Fallback colors for tags not covered by CSS
        const fallbackColors = [
            "var(--tag-color-fallback-0)",
            "var(--tag-color-fallback-1)", 
            "var(--tag-color-fallback-2)",
            "var(--tag-color-fallback-3)",
            "var(--tag-color-fallback-4)",
            "var(--tag-color-fallback-5)",
            "var(--tag-color-fallback-6)",
            "var(--tag-color-fallback-7)",
            "var(--tag-color-fallback-8)",
            "var(--tag-color-fallback-9)",
        ];

        let hash = 0;
        for (let i = 0; i < props.tag.length; i++) {
            hash = props.tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        return fallbackColors[Math.abs(hash) % fallbackColors.length];
    });

    const tagBgColor = computed(() => {
        // Generate a lighter background version
        const color = tagColor.value;
        // Convert hex to rgba with low opacity
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.1)`;
    });

    function handleClick() {
        if (props.clickable) {
            emit("click", props.tag);
        }
    }
</script>

<style scoped>
/* Tag badge styles are now in the global CSS file */
/* This allows for easier color customization via CSS variables */
</style>
 