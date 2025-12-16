<template>
    <span class="md-trigger" @click="open">{{ text || t.defaultText }}</span>

    <v-dialog v-model="isOpen" v-bind="dialogProps">
        <v-card
            class="md-dialog-card"
            :class="{ 'md-dialog-card--fullscreen': fullscreen }"
        >
            <!-- Fullscreen toolbar -->
            <v-toolbar v-if="fullscreen" class="md-toolbar">
                <v-toolbar-title>{{ title }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="close" class="md-close-btn">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <!-- Regular title -->
            <v-card-title v-else-if="title" class="md-card-title">{{
                title
            }}</v-card-title>

            <v-card-text class="md-card-content" :class="contentWrapperClasses">
                <div class="vp-doc">
                    <slot></slot>
                </div>
            </v-card-text>

            <v-card-actions v-if="!fullscreen" class="md-card-actions">
                <v-spacer></v-spacer>
                <v-btn @click="close" color="primary" variant="text">{{
                    t.closeButton
                }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
// @i18n
import { ref, computed } from "vue";
import { useSafeI18n } from "@utils/i18n/locale";

const { t } = useSafeI18n("md-dialog", {
    defaultText: "Click to open",
    closeButton: "Close",
});

const props = defineProps({
    title: String,
    text: {
        type: String,
    },
    // Vuetify VDialog props
    fullscreen: {
        type: Boolean,
        default: false,
    },
    maxWidth: {
        type: [String, Number],
        default: "90vw",
    },
    maxHeight: {
        type: [String, Number],
        default: undefined,
    },
    width: {
        type: [String, Number],
        default: undefined,
    },
    height: {
        type: [String, Number],
        default: undefined,
    },
    persistent: {
        type: Boolean,
        default: false,
    },
    scrollable: {
        type: Boolean,
        default: true,
    },
    transition: {
        type: String,
        default: "dialog-transition",
    },
    activator: {
        type: String,
        default: undefined,
    },
    closeOnBack: {
        type: Boolean,
        default: true,
    },
    contained: {
        type: Boolean,
        default: false,
    },
    noClickAnimation: {
        type: Boolean,
        default: false,
    },
    scrim: {
        type: [Boolean, String],
        default: true,
    },
    zIndex: {
        type: [Number, String],
        default: 2400,
    },
});

const isOpen = ref(false);

// Build props to pass to v-dialog
const dialogProps = computed(() => {
    return {
        maxWidth: props.maxWidth,
        maxHeight: props.maxHeight,
        width: props.width,
        height: props.height,
        persistent: props.persistent,
        scrollable: props.scrollable,
        transition: props.transition,
        activator: props.activator,
        closeOnBack: props.closeOnBack,
        contained: props.contained,
        noClickAnimation: props.noClickAnimation,
        scrim: props.scrim,
        zIndex: props.zIndex,
        fullscreen: props.fullscreen,
    };
});

// Content wrapper classes
const contentWrapperClasses = computed(() => ({
    "md-content--fullscreen": props.fullscreen,
    "md-content--scrollable": props.scrollable,
}));

const open = () => {
    isOpen.value = true;
};

const close = () => {
    isOpen.value = false;
};
</script>

<style scoped>
    .md-trigger {
        color: var(--vp-c-brand-1);
        cursor: pointer;
        text-decoration: underline;
        text-decoration-color: var(--vp-c-brand-1);
        text-underline-offset: 2px;
        transition: all 0.25s;
    }

    .md-trigger:hover {
        color: var(--vp-c-brand-2);
        text-decoration-color: var(--vp-c-brand-2);
    }

    .md-dialog-card {
        border-radius: 12px !important;
        background-color: var(--vp-c-bg) !important;
        border: 1px solid var(--vp-c-divider) !important;
    }

    .md-dialog-card--fullscreen {
        border-radius: 0 !important;
        height: 100vh !important;
        max-height: 100vh !important;
        border: none !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .md-toolbar {
        background: var(--vp-c-brand-1) !important;
        color: white !important;
    }

    .md-close-btn {
        color: white !important;
    }

    .md-card-title {
        background: var(--vp-c-bg-alt) !important;
        color: var(--vp-c-text-1) !important;
        border-bottom: 1px solid var(--vp-c-divider) !important;
        font-size: 1.25rem !important;
        font-weight: 600 !important;
        padding: 20px 24px !important;
    }

    .md-card-content {
        background: var(--vp-c-bg) !important;
        color: var(--vp-c-text-1) !important;
        padding: 24px !important;
        min-height: 200px;
        max-height: 70vh;
        overflow-y: auto;
        box-sizing: border-box;
        width: 100%;
    }

    .md-content--fullscreen {
        min-height: calc(100vh - 64px) !important;
        max-height: calc(100vh - 64px) !important;
        padding: 32px !important;
        flex: 1 !important;
        overflow-y: auto !important;
    }

    .md-content--scrollable {
        max-height: 60vh !important;
    }

    .md-card-actions {
        background: var(--vp-c-bg-alt) !important;
        border-top: 1px solid var(--vp-c-divider) !important;
        padding: 16px 24px !important;
    }

    /* VitePress doc styles */
    .vp-doc {
        font-family: var(--vp-font-family-base);
        font-size: 16px;
        line-height: 1.7;
        color: var(--vp-c-text-1);
        word-wrap: break-word;
    }
    .vp-doc :deep(h1),
    .vp-doc :deep(h2),
    .vp-doc :deep(h3),
    .vp-doc :deep(h4),
    .vp-doc :deep(h5),
    .vp-doc :deep(h6) {
        position: relative;
        font-weight: 600;
        outline: none;
        color: var(--vp-c-text-1);
        margin-top: 32px;
    }
    .vp-doc :deep(h1) {
        font-size: 28px;
    }
    .vp-doc :deep(h2) {
        font-size: 24px;
        border-top: 1px solid var(--vp-c-divider);
        padding-top: 24px;
    }
    .vp-doc :deep(h3) {
        font-size: 20px;
    }
    .vp-doc :deep(h4) {
        font-size: 18px;
    }
    .vp-doc :deep(p) {
        margin: 16px 0;
    }
    .vp-doc :deep(a) {
        color: var(--vp-c-brand-1);
        text-decoration: underline;
    }
    .vp-doc :deep(code) {
        font-size: 0.875em;
        color: var(--vp-c-text-code);
        background-color: var(--vp-c-mute);
        border-radius: 4px;
        padding: 3px 6px;
    }
    .vp-doc :deep(pre) {
        background-color: var(--vp-code-block-bg);
        border-radius: 6px;
    }
    .vp-doc :deep(pre code) {
        padding: 20px 24px;
    }
    .vp-doc :deep(ul),
    .vp-doc :deep(ol) {
        padding-left: 1.25rem;
        margin: 16px 0;
    }
    .vp-doc :deep(li) {
        margin: 8px 0;
    }
    .vp-doc :deep(blockquote) {
        margin: 16px 0;
        border-left: 2px solid var(--vp-c-divider);
        padding-left: 16px;
        color: var(--vp-c-text-2);
    }
    .vp-doc :deep(hr) {
        margin: 16px 0;
        border-top: 1px solid var(--vp-c-divider);
    }
    .vp-doc :deep(table) {
        border-collapse: collapse;
        margin: 20px 0;
        display: block;
        overflow-x: auto;
    }
    .vp-doc :deep(th),
    .vp-doc :deep(td) {
        border: 1px solid var(--vp-c-divider);
        padding: 8px 16px;
    }

    /* Mobile responsive styles */
    @media (max-width: 768px) {
        .md-dialog-card {
            margin: 1rem !important;
            max-width: calc(100vw - 2rem) !important;
            max-height: calc(100vh - 2rem) !important;
            border-radius: 8px !important;
        }

        .md-card-title {
            padding: 16px 20px !important;
            font-size: 1.1rem !important;
        }

        .md-card-content {
            padding: 16px 20px !important;
            max-height: calc(100vh - 200px) !important;
        }

        .md-card-actions {
            padding: 12px 20px !important;
        }

        .md-content--scrollable {
            max-height: calc(100vh - 200px) !important;
        }

        .vp-doc {
            font-size: 15px;
        }

        .vp-doc :deep(h1) {
            font-size: 24px;
        }

        .vp-doc :deep(h2) {
            font-size: 20px;
        }

        .vp-doc :deep(h3) {
            font-size: 18px;
        }

        .vp-doc :deep(h4) {
            font-size: 16px;
        }
    }

    @media (max-width: 480px) {
        .md-dialog-card {
            margin: 0.5rem !important;
            max-width: calc(100vw - 1rem) !important;
            max-height: calc(100vh - 1rem) !important;
            border-radius: 6px !important;
        }

        .md-card-title {
            padding: 12px 16px !important;
            font-size: 1rem !important;
        }

        .md-card-content {
            padding: 12px 16px !important;
            max-height: calc(100vh - 150px) !important;
            min-height: 150px;
        }

        .md-card-actions {
            padding: 10px 16px !important;
        }

        .md-content--scrollable {
            max-height: calc(100vh - 150px) !important;
        }

        .vp-doc {
            font-size: 14px;
        }

        .vp-doc :deep(h1) {
            font-size: 22px;
        }

        .vp-doc :deep(h2) {
            font-size: 18px;
        }

        .vp-doc :deep(h3) {
            font-size: 16px;
        }

        .vp-doc :deep(h4) {
            font-size: 15px;
        }

        .vp-doc :deep(pre code) {
            padding: 16px 20px;
        }

        .vp-doc :deep(th),
        .vp-doc :deep(td) {
            padding: 6px 12px;
        }
    }

    /* Very small screens - auto fullscreen */
    @media (max-width: 360px) {
        .md-dialog-card:not(.md-dialog-card--fullscreen) {
            margin: 0 !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            height: 100vh !important;
        }

        .md-card-content {
            max-height: calc(100vh - 120px) !important;
            padding: 10px 12px !important;
        }

        .md-card-title {
            padding: 10px 12px !important;
            font-size: 0.9rem !important;
        }

        .md-card-actions {
            padding: 8px 12px !important;
        }
    }
</style>
 