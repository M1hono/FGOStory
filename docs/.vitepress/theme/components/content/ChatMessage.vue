<template>
    <div
        ref="root"
        class="chat-message"
        :class="{
            shown,
            [`location-${location}`]: location,
            'is-grouped': isGrouped,
        }"
        :data-nickname="nickname"
    >
        <div
            class="avatar"
            :style="{ backgroundColor: finalAvatarBackgroundColor }"
        >
            <a
                v-if="effectiveAvatarLink"
                :href="effectiveAvatarLink"
                target="_blank"
                rel="noopener noreferrer"
                class="avatar-link"
            >
                <div v-if="isLoadingGithubAvatar" class="loading-spinner"></div>
                <img
                    v-else-if="finalAvatarSrc && !avatarLoadError"
                    :src="finalAvatarSrc"
                    alt="avatar"
                    @error="handleAvatarError"
                    class="avatar-img"
                />
                <span
                    v-else-if="props.avatarType === 'icon'"
                    class="avatar-icon"
                    >{{ finalAvatarText }}</span
                >
                <span v-else class="avatar-text">{{ finalAvatarText }}</span>
            </a>
            <template v-else>
                <div v-if="isLoadingGithubAvatar" class="loading-spinner"></div>
                <img
                    v-else-if="finalAvatarSrc && !avatarLoadError"
                    :src="finalAvatarSrc"
                    alt="avatar"
                    @error="handleAvatarError"
                    class="avatar-img"
                />
                <span
                    v-else-if="props.avatarType === 'icon'"
                    class="avatar-icon"
                    >{{ finalAvatarText }}</span
                >
                <span v-else class="avatar-text">{{ finalAvatarText }}</span>
            </template>
        </div>
        <div class="message-content">
            <div class="nickname" v-if="nickname">{{ nickname }}</div>
            <div class="message-box" :style="messageBubbleStyle">
                <div class="message-inner">
                    <slot>&nbsp;</slot>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
    import {
        computed,
        ref,
        watch,
        onMounted,
        onBeforeUnmount,
        getCurrentInstance,
    } from "vue";
    import { useData } from "vitepress";

    const colorMap: Record<string, string> = {
        Alice: "#cc0066",
        Bob: "#00994d",
        Carol: "#1e90ff",
        Dave: "#f4a460",
        Charlie: "#ff6b6b",
        Diana: "#4ecdc4",
        Eve: "#45b7d1",
        Frank: "#96ceb4",
        Grace: "#ffeaa7",
        Henry: "#dda0dd",
    };

    const iconMap: Record<string, string> = {
        user: "👤",
        bot: "🤖",
        system: "⚙️",
        admin: "👑",
        guest: "👻",
        ai: "🧠",
        helper: "💬",
        support: "🆘",
    };

    const props = defineProps<{
        nickname?: string;
        color?: string;
        avatar?: string;
        avatarType?: "avatarmap" | "github" | "icon" | "custom" | "text";
        avatarLink?: string;
        location?: "left" | "right";
        bubbleColor?: string;
        textColor?: string;
    }>();

    const { theme } = useData();
    const githubAvatarCache = new Map<string, string>();

    const root = ref<HTMLElement>();
    const githubAvatarUrl = ref<string>("");
    const isLoadingGithubAvatar = ref(false);
    const avatarLoadError = ref(false);
    const shown = ref(false);
    const active = ref(false);
    const moving = ref(false);
    const isGrouped = ref(false);

    async function fetchGithubAvatar(username: string): Promise<string> {
        if (githubAvatarCache.has(username))
            return githubAvatarCache.get(username)!;
        isLoadingGithubAvatar.value = true;
        avatarLoadError.value = false;
        try {
            const response = await fetch(
                `https://api.github.com/users/${username}`
            );
            if (response.ok) {
                const data = await response.json();
                githubAvatarCache.set(username, data.avatar_url);
                return data.avatar_url;
            }
        } catch (error) {
            console.warn(
                `Failed to fetch GitHub avatar for ${username}:`,
                error
            );
        } finally {
            isLoadingGithubAvatar.value = false;
        }
        const fallbackUrl = `https://github.com/${username}.png`;
        githubAvatarCache.set(username, fallbackUrl);
        return fallbackUrl;
    }

    const finalAvatarBackgroundColor = computed(() => {
        if (props.color) return props.color;
        if (props.nickname && colorMap[props.nickname])
            return colorMap[props.nickname];
        const colors = Object.values(colorMap);
        const hash = (props.nickname || "")
            .split("")
            .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        return colors[Math.abs(hash) % colors.length];
    });

    const finalAvatarSrc = computed(() => {
        if (props.avatar) return props.avatar;
        if (props.avatarType === "avatarmap" && props.nickname) {
            const avatarMap = theme.value.avatarMap || {};
            return avatarMap[props.nickname];
        }
        if (props.avatarType === "github") return githubAvatarUrl.value;
        return null;
    });

    const finalAvatarText = computed(() => {
        if (props.avatarType === "icon" && props.nickname) {
            return iconMap[props.nickname] || iconMap.user;
        }
        return props.nickname?.[0]?.toUpperCase() || "?";
    });

    const effectiveAvatarLink = computed(() => {
        if (props.avatarLink) return props.avatarLink;
        if (props.avatarType === "github" && props.nickname)
            return `https://github.com/${props.nickname}`;
        return null;
    });

    const messageBubbleStyle = computed(() => {
        const style: Record<string, string> = {};
        if (props.bubbleColor) style.backgroundColor = props.bubbleColor;
        if (props.textColor) style.color = props.textColor;
        if (props.location === "right" && props.bubbleColor)
            style.borderColor = props.bubbleColor;
        return style;
    });

    watch(
        () => props.nickname,
        (newNickname) => {
            if (props.avatarType === "github" && newNickname && !props.avatar) {
                fetchGithubAvatar(newNickname).then(
                    (url) => (githubAvatarUrl.value = url)
                );
            }
        },
        { immediate: true }
    );

    function handleAvatarError() {
        avatarLoadError.value = true;
    }

    function getPrevious(): Element | undefined {
        if (!root.value) return undefined;
        let prev = root.value.previousElementSibling;
        while (prev && prev.nodeType !== 1) {
            prev = prev.previousElementSibling;
        }
        return prev && prev.classList.contains("chat-message")
            ? prev
            : undefined;
    }

    watch(active, (value) => {
        if (!value) {
            shown.value = false;
            return;
        }
        const prev = getPrevious();
        if (!prev) {
            appear();
            return;
        }
        const rect = prev.getBoundingClientRect();
        if (rect.bottom < 0) {
            appear();
            return;
        }
        const prevVue = (prev as any).__vue__;
        if (prevVue?.exposed) {
            const prevExposed = prevVue.exposed;
            if (prevExposed.moving?.value || !prevExposed.shown?.value) {
                prevExposed.onappear?.(appear);
            } else {
                appear();
            }
        } else {
            appear();
        }
    });

    let appearCallback = () => {};
    function appear() {
        shown.value = true;
        moving.value = true;
        setTimeout(() => {
            moving.value = false;
            appearCallback();
            appearCallback = () => {};
        }, 100);
    }

    function handleScroll() {
        if (!root.value || active.value) return;
        const rect = root.value.getBoundingClientRect();
        if (rect.top < window.innerHeight) active.value = true;
    }

    const instance = getCurrentInstance();
    defineExpose({
        moving,
        shown,
        onappear: (cb: () => void) => {
            appearCallback = cb || (() => {});
        },
    });

    onMounted(() => {
        if (root.value && instance) {
            (root.value as any).__vue__ = instance;
            handleScroll();
            window.addEventListener("scroll", handleScroll);
            window.addEventListener("resize", handleScroll);

            const prev = getPrevious();
            if (prev) {
                const prevNickname = prev.getAttribute("data-nickname");
                const prevLocation = prev.classList.contains("location-right")
                    ? "right"
                    : "left";
                if (
                    prevNickname === props.nickname &&
                    prevLocation === (props.location || "left")
                ) {
                    isGrouped.value = true;
                }
            }
        }
    });

    onBeforeUnmount(() => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
    });
</script>

<style lang="scss">
    $avatar-size: 2.8rem;
    $msgbox-left: $avatar-size + 0.8rem;
    $arrow-size: 6px;

    .chat-message {
        position: relative;
        display: flex;
        gap: 0.8rem;
        align-items: flex-start;
        margin: 0.5rem 0 !important;
        max-width: 100%;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
        opacity: 0;
        transform: translateX(-20%);
        transition: transform 0.3s ease-out, opacity 0.3s ease;

        &.shown {
            opacity: 1;
            transform: translateX(0);
        }

        &.is-grouped {
            margin-top: 0.25rem;
            .avatar {
                opacity: 0;
            }
            .nickname {
                display: none;
            }
            .message-box {
                border-top-left-radius: 0.5rem;
            }
        }

        &.location-right {
            flex-direction: row-reverse;

            &.is-grouped .message-box {
                border-top-left-radius: 0.5rem;
                border-top-right-radius: 0.5rem;
            }

            .message-content {
                align-items: flex-end;
                padding-right: 0;
                padding-left: 0.5rem;
            }

            .message-box {
                border-radius: 0.5rem 0.2rem 0.5rem 0.5rem;

                &::before {
                    right: auto;
                    left: 100%;
                    top: 8px;
                    border-right: 0;
                    border-left: $arrow-size solid var(--vp-c-border);
                }

                &::after {
                    right: auto;
                    left: 100%;
                    top: 9px;
                    border-right: 0;
                    border-left: ($arrow-size - 1px) solid var(--vp-c-bg);
                }
            }
        }

        .avatar {
            width: $avatar-size;
            height: $avatar-size;
            flex-shrink: 0;
            border-radius: 50%;
            overflow: hidden;
            background-color: var(--vp-c-bg-soft);
            display: flex;
            justify-content: center;
            align-items: center;
            transition: transform 0.2s ease;
            &:hover {
                transform: scale(1.1);
            }
            .avatar-link {
                display: block;
                width: 100%;
                height: 100%;
            }
            .avatar-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .avatar-text,
            .avatar-icon {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.3rem;
                font-weight: bold;
                color: white;
                user-select: none;
                font-family: "Comic Sans MS", cursive, sans-serif;
            }
            .loading-spinner {
                width: 1.2rem;
                height: 1.2rem;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
        }

        .message-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
            max-width: calc(100% - #{$avatar-size} - 0.8rem);
            min-width: 0;
            flex: 1;
            overflow: hidden;
            padding-right: 0.5rem;
            box-sizing: border-box;
        }

        .nickname {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--vp-c-text-2);
            margin-left: 0.5rem;
        }

        .message-box {
            position: relative;
            width: fit-content;
            max-width: 100%;
            min-width: 0;
            border-radius: 0.2rem 0.5rem 0.5rem 0.5rem;
            background-color: var(--vp-c-bg);
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            border: 1px solid var(--vp-c-border);
            padding: 0.5rem 0.8rem;
            font-size: 14px;
            line-height: 1.6;
            z-index: 1;

            :deep(p),
            :deep(summary) {
                margin: 0 !important;
            }

            &::before {
                content: "";
                position: absolute;
                right: 100%;
                top: 8px;
                width: 0;
                height: 0;
                border: $arrow-size solid transparent;
                border-right-color: var(--vp-c-border);
                border-left: 0;
            }
            &::after {
                content: "";
                position: absolute;
                right: 100%;
                top: 9px;
                width: 0;
                height: 0;
                border: ($arrow-size - 1px) solid transparent;
                border-right-color: var(--vp-c-bg);
                border-left: 0;
            }

            .vp-doc p {
                margin: 0 !important;
            }

            .vp-doc *:first-child {
                margin-top: 0 !important;
            }

            .message-inner {
                overflow-wrap: break-word;
                word-break: break-word;
                width: 100%;
                min-width: 0;
                max-width: 100%;
                overflow: hidden;
                box-sizing: border-box;
            }

            :deep(.vp-doc div[class*="language-"]),
            :deep(div[class*="language-"]),
            :deep(.language),
            :deep(.vp-block) {
                margin: 1em 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                overflow-x: auto;
                position: relative;
                z-index: 0;
            }

            :deep(.vp-doc div[class*="language-"] pre),
            :deep(div[class*="language-"] pre) {
                margin: 0 !important;
                overflow-x: auto;
            }
        }
    }

    .message-box {
        *:first-child {
            margin-top: 0 !important;
        }
        *:last-child {
            margin-bottom: 0 !important;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 768px) {
        $mobile-avatar-size: 2.4rem;
        $mobile-msgbox-left: $mobile-avatar-size + 0.6rem;

        .chat-message {
            gap: 0.6rem;
            margin: 0.4rem 0 !important;
            max-width: 100vw;
            overflow-x: hidden;

            .avatar {
                width: $mobile-avatar-size;
                height: $mobile-avatar-size;
            }

            .message-content {
                max-width: calc(100% - #{$mobile-avatar-size} - 0.6rem);
                min-width: 0;
                flex: 1;
                padding-right: 0.4rem;
            }

            .message-box {
                max-width: 100%;
                font-size: 13px;
                padding: 0.4rem 0.6rem;

                overflow-wrap: anywhere;
                word-break: break-word;
                hyphens: auto;
            }

            .nickname {
                font-size: 0.8rem;
                margin-left: 0.4rem;
            }

            &.is-grouped {
                margin-top: 0.2rem;
            }

            &.location-right .message-content {
                padding-right: 0;
                padding-left: 0.4rem;
            }
        }
    }

    @media (max-width: 480px) {
        $small-avatar-size: 2rem;
        $small-msgbox-left: $small-avatar-size + 0.5rem;

        .chat-message {
            gap: 0.5rem;
            max-width: 100vw;
            overflow-x: hidden;

            .avatar {
                width: $small-avatar-size;
                height: $small-avatar-size;

                .avatar-text,
                .avatar-icon {
                    font-size: 1.1rem;
                }
            }

            .message-content {
                max-width: calc(100% - #{$small-avatar-size} - 0.5rem);
                flex: 1;
                padding-right: 0.3rem;
            }

            .message-box {
                max-width: 100%;
                font-size: 12px;
                padding: 0.35rem 0.5rem;
                line-height: 1.5;
            }

            .nickname {
                font-size: 0.75rem;
                margin-left: 0.3rem;
            }

            &.location-right .message-content {
                padding-right: 0;
                padding-left: 0.3rem;
            }
        }
    }
</style>
