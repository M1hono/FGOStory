<script setup lang="ts">
    import { computed } from "vue";

    /**
     * Props for VPButton component
     */
    interface Props {
        /** Button tag, defaults to 'a' if href is provided, otherwise 'button' */
        tag?: string;
        /** Button size variant */
        size?: "small" | "medium" | "large";
        /** Button theme variant */
        theme?: "brand" | "alt" | "sponsor" | "outline" | "ghost";
        /** Button text content */
        text?: string;
        /** Button href for links */
        href?: string;
        /** Link target attribute */
        target?: string;
        /** Link rel attribute */
        rel?: string;
        /** Whether button is disabled */
        disabled?: boolean;
        /** Whether button is loading */
        loading?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        size: "medium",
        theme: "brand",
        disabled: false,
        loading: false,
    });

    /**
     * Check if the link is external
     */
    const isExternal = computed(() => {
        if (!props.href) return false;
        return /^https?:\/\//.test(props.href);
    });

    /**
     * Determine the component tag to render
     */
    const component = computed(() => {
        if (props.tag) return props.tag;
        return props.href ? "a" : "button";
    });

    /**
     * Compute the target attribute
     */
    const computedTarget = computed(() => {
        if (props.target) return props.target;
        return isExternal.value ? "_blank" : undefined;
    });

    /**
     * Compute the rel attribute
     */
    const computedRel = computed(() => {
        if (props.rel) return props.rel;
        return isExternal.value ? "noopener noreferrer" : undefined;
    });

    /**
     * Normalize link for internal routing
     */
    const normalizeLink = (link: string) => {
        if (isExternal.value) return link;
        // Remove .md extension and handle index files
        return link.replace(/\.md$/, "").replace(/\/index$/, "/");
    };
</script>

<template>
    <component
        :is="component"
        class="vp-button"
        :class="[
            `vp-button--${size}`,
            `vp-button--${theme}`,
            {
                'vp-button--disabled': disabled,
                'vp-button--loading': loading,
                'vp-button--external': isExternal,
            },
        ]"
        :href="href ? normalizeLink(href) : undefined"
        :target="computedTarget"
        :rel="computedRel"
        :disabled="disabled || loading"
        :type="!href ? 'button' : undefined"
    >
        <span class="vp-button__content">
            <span v-if="loading" class="vp-button__spinner">
                <svg viewBox="0 0 24 24" class="vp-button__spinner-icon">
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-dasharray="32"
                        stroke-dashoffset="32"
                    />
                </svg>
            </span>
            <span class="vp-button__text">
                <slot>{{ text }}</slot>
            </span>
            <span
                v-if="isExternal && !loading"
                class="vp-button__external-icon"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                    />
                    <path d="M15 3h6v6" />
                    <path d="M10 14L21 3" />
                </svg>
            </span>
        </span>
        <span class="vp-button__shine"></span>
    </component>
</template>

<style scoped>
    /* Base button styles */
    .vp-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 12px;
        font-family: inherit;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        outline: none;
        background: transparent;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    .vp-button:focus-visible {
        outline: 2px solid var(--vp-c-brand-1);
        outline-offset: 2px;
    }

    /* Button content wrapper */
    .vp-button__content {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        height: 100%;
    }

    .vp-button__text {
        flex: 1;
    }

    /* Shine effect */
.vp-button__shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.8s ease;
  pointer-events: none;
}

.vp-button:hover .vp-button__shine {
  left: 100%;
}

    /* Loading spinner */
    .vp-button__spinner {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .vp-button__spinner-icon {
        width: 1em;
        height: 1em;
        animation: vp-button-spin 1s linear infinite;
    }

    @keyframes vp-button-spin {
        from {
            transform: rotate(0deg);
            stroke-dashoffset: 32;
        }
        50% {
            stroke-dashoffset: 0;
        }
        to {
            transform: rotate(360deg);
            stroke-dashoffset: -32;
        }
    }

    /* External link icon */
    .vp-button__external-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1em;
        height: 1em;
        opacity: 0.7;
    }

    /* Size variants */
    .vp-button--small {
        padding: 8px 16px;
        font-size: 14px;
        line-height: 1.4;
        border-radius: 8px;
        min-height: 32px;
    }

    .vp-button--medium {
        padding: 12px 24px;
        font-size: 16px;
        line-height: 1.5;
        border-radius: 10px;
        min-height: 40px;
    }

    .vp-button--large {
        padding: 16px 32px;
        font-size: 18px;
        line-height: 1.5;
        border-radius: 12px;
        min-height: 48px;
    }

    /* Theme variants */

    /* Brand theme */
    .vp-button--brand {
        background: linear-gradient(
            135deg,
            var(--vp-c-brand-1) 0%,
            var(--vp-c-brand-2) 100%
        );
        color: var(--vp-c-white);
        box-shadow: 0 4px 14px 0 rgba(var(--vp-c-brand-rgb), 0.39),
            0 1px 3px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(var(--vp-c-brand-rgb), 0.8);
    }

    .vp-button--brand:hover {
        background: linear-gradient(
            135deg,
            var(--vp-c-brand-2) 0%,
            var(--vp-c-brand-3) 100%
        );
        box-shadow: 0 4px 12px 0 rgba(var(--vp-c-brand-rgb), 0.3),
            0 2px 4px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }

    .vp-button--brand:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px 0 rgba(var(--vp-c-brand-rgb), 0.2),
            0 1px 2px 0 rgba(0, 0, 0, 0.1);
    }

    /* Alt theme */
    .vp-button--alt {
        background: var(--vp-button-alt-bg);
        color: var(--vp-button-alt-text);
        border: 1px solid var(--vp-button-alt-border);
        box-shadow: 
            0 2px 4px 0 rgba(0, 0, 0, 0.06),
            0 1px 2px 0 rgba(0, 0, 0, 0.04);
    }

    .vp-button--alt:hover {
        background: var(--vp-button-alt-hover-bg);
        color: var(--vp-button-alt-hover-text);
        border-color: var(--vp-button-alt-hover-border);
        box-shadow: 
            0 4px 8px 0 rgba(0, 0, 0, 0.1),
            0 2px 4px 0 rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
    }

    .vp-button--alt:active {
        transform: translateY(0);
        box-shadow: 
            0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }

    /* Outline theme */
    .vp-button--outline {
        background: transparent;
        color: var(--vp-c-brand-1);
        border: 2px solid var(--vp-c-brand-1);
        backdrop-filter: blur(8px);
    }

    .vp-button--outline:hover {
        background: rgba(var(--vp-c-brand-rgb), 0.1);
        color: var(--vp-c-brand-2);
        border-color: var(--vp-c-brand-2);
        box-shadow: 0 2px 8px 0 rgba(var(--vp-c-brand-rgb), 0.15);
        transform: translateY(-1px);
    }

    .vp-button--outline:active {
        transform: translateY(0);
        background: rgba(var(--vp-c-brand-rgb), 0.15);
    }

    /* Ghost theme */
    .vp-button--ghost {
        background: transparent;
        color: var(--vp-c-text-1);
        border: 1px solid transparent;
    }

    .vp-button--ghost:hover {
        background: rgba(var(--vp-c-bg-soft-rgb), 0.5);
        color: var(--vp-c-brand-1);
        border-color: rgba(var(--vp-c-divider-rgb), 0.3);
        transform: translateY(-1px);
    }

    .vp-button--ghost:active {
        transform: translateY(0);
        background: rgba(var(--vp-c-bg-soft-rgb), 0.7);
    }

    /* Sponsor theme */
    .vp-button--sponsor {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: var(--vp-c-white);
        border: 1px solid #ff6b6b;
        box-shadow: 0 4px 14px 0 rgba(255, 107, 107, 0.39),
            0 1px 3px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
    }

    .vp-button--sponsor:hover {
        background: linear-gradient(135deg, #ee5a24 0%, #c44569 100%);
        box-shadow: 0 4px 12px 0 rgba(255, 107, 107, 0.3),
            0 2px 4px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }

    .vp-button--sponsor:active {
        transform: translateY(0);
    }

    /* Disabled state */
    .vp-button--disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
        transform: none !important;
    }

    /* Loading state */
    .vp-button--loading {
        cursor: default;
        pointer-events: none;
    }

    .vp-button--loading .vp-button__text {
        opacity: 0.7;
    }

    /* Dark mode adjustments */
    .dark .vp-button--alt {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.12) 100%
        );
        color: rgba(255, 255, 255, 0.9);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.3),
            0 1px 3px 0 rgba(0, 0, 0, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
    }

    .dark .vp-button--alt:hover {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(var(--vp-c-brand-rgb), 0.15) 100%
        );
        border-color: rgba(var(--vp-c-brand-rgb), 0.4);
        color: var(--vp-c-brand-1);
    }

    .dark .vp-button--ghost {
        color: rgba(255, 255, 255, 0.9);
    }

    .dark .vp-button--ghost:hover {
        background: rgba(255, 255, 255, 0.08);
        color: var(--vp-c-brand-1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .dark .vp-button--outline {
        color: var(--vp-c-brand-1);
        border-color: var(--vp-c-brand-1);
    }

    .dark .vp-button--outline:hover {
        background: rgba(var(--vp-c-brand-rgb), 0.15);
    }

    /* Responsive design */
@media (max-width: 768px) {
  .vp-button {
    min-width: 100px;
    max-width: 140px;
  }
  
  .vp-button--large {
    padding: 12px 24px;
    font-size: 15px;
    min-height: 40px;
  }
  
  .vp-button--medium {
    padding: 10px 18px;
    font-size: 14px;
    min-height: 36px;
  }
  
  .vp-button--small {
    padding: 8px 14px;
    font-size: 13px;
    min-height: 32px;
  }
}

@media (max-width: 480px) {
  .vp-button {
    min-width: 90px;
    max-width: 120px;
  }
  
  .vp-button--large {
    padding: 10px 20px;
    font-size: 14px;
    min-height: 36px;
  }
  
  .vp-button--medium {
    padding: 8px 16px;
    font-size: 13px;
    min-height: 32px;
  }
  
  .vp-button--small {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 28px;
  }
}

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .vp-button,
        .vp-button__shine,
        .vp-button__spinner-icon {
            transition: none !important;
            animation: none !important;
        }

        .vp-button:hover {
            transform: none !important;
        }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .vp-button {
            border-width: 2px;
        }

        .vp-button--brand {
            border-color: currentColor;
        }

        .vp-button--alt {
            border-color: currentColor;
        }
    }

    /* Print styles */
    @media print {
        .vp-button {
            background: transparent !important;
            color: inherit !important;
            border: 1px solid currentColor !important;
            box-shadow: none !important;
        }
    }
</style>
