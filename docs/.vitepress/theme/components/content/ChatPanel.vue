<script setup lang="ts">
    import { ref, computed, onMounted, onUpdated, nextTick } from "vue";

    const props = defineProps({
        title: String,
        maxHeight: [Number, String],
        autoScroll: {
            type: Boolean,
            default: true,
        },
        transparent: {
            type: Boolean,
            default: false,
        },
        panelColor: String,
    });

    const contentRef = ref<HTMLElement | null>(null);

    const panelStyle = computed(() => {
        const style: Record<string, any> = {};
        if (props.panelColor) {
            style.backgroundColor = props.panelColor;
        }
        return style;
    });

    const contentStyle = computed(() => {
        const style: Record<string, any> = {};
        if (props.maxHeight) {
            style.maxHeight =
                typeof props.maxHeight === "number"
                    ? `${props.maxHeight}px`
                    : props.maxHeight;
            style.overflowY = "auto" as const;
        }
        return style;
    });

    const scrollToBottom = () => {
        if (contentRef.value) {
            contentRef.value.scrollTop = contentRef.value.scrollHeight;
        }
    };

    onMounted(() => {
        if (props.autoScroll) {
            scrollToBottom();
        }
    });

    onUpdated(() => {
        if (props.autoScroll) {
            nextTick(() => {
                scrollToBottom();
            });
        }
    });
</script>

<template>
    <div
        class="chat-panel"
        :class="{ 'is-transparent': transparent }"
        :style="panelStyle"
    >
        <div class="title" v-if="title">{{ title }}</div>
        <div class="content" :style="contentStyle" ref="contentRef">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss">
    $msgbox-left: 3.6rem;

    .chat-panel {
        margin: 1.5rem 0;
        border-radius: 8px;
        border: 1px solid var(--vp-c-border);
        background-color: var(--vp-c-bg-alt);
        overflow: hidden;
        transition: all 0.3s ease;

        &.is-transparent {
            background-color: transparent;
            border-color: transparent;

            .title {
                background-color: transparent;
            }

            .content {
                background-color: transparent;
            }
        }

        .title {
            text-align: center;
            font-size: 15px;
            font-weight: 600;
            color: var(--vp-c-text-1);
            padding: 0.75rem 1rem;
            background-color: var(--vp-c-bg-alt);
        }

        .content {
            padding: 0.75rem;
            background-color: var(--vp-c-bg-alt);

            :deep(.chat-message) {
                margin: 0 !important;
            }

            > p {
                font-size: 0.8rem;
                color: var(--vp-c-text-3);
                margin: 0.25rem 0;
                text-align: center;
            }

            :deep(.chat-message:last-child) {
                margin-bottom: 0;
            }

            &::-webkit-scrollbar {
                width: 6px;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
            }

            &::-webkit-scrollbar-thumb {
                background: var(--vp-c-text-3);
                border-radius: 3px;
                opacity: 0.3;

                &:hover {
                    opacity: 0.6;
                }
            }
        }

        @media (max-width: 768px) {
            margin: 1rem 0;

            .title {
                font-size: 14px;
                padding: 0.6rem 0.75rem;
            }

            .content {
                padding: 0.6rem;
            }
        }
    }
</style>
