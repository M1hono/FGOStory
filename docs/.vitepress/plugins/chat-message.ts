import { container } from "@mdit/plugin-container";
import type { PluginSimple } from "markdown-it";

const parseAttrs = (info: string): Record<string, string> => {
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9\-_]+)(?:="([^"]*)")?/g;
    let match;
    while ((match = attrRegex.exec(info)) !== null) {
        const [, key, value] = match;
        attrs[key] = value === undefined ? "true" : value;
    }
    return attrs;
};

const attrsToPropsStr = (attrs: Record<string, string>): string => {
    return Object.entries(attrs)
        .map(([key, value]) => {
            if (value === "true") {
                return key;
            }
            if (value === "false") {
                return `:${key}="false"`;
            }
            return `${key}="${value}"`;
        })
        .join(" ");
};

/**
 * Chat Plugin for VitePress
 * Provides both chat panel and chat message containers
 * 
 * Usage:
 * :::: chat title="AI对话演示" max-height="400px"
 * ::: message nickname="用户" avatar-type="icon"
 * 你好，能帮我解释一下什么是Vue组合式API吗？
 * :::
 * 
 * ::: message nickname="AI助手" avatar-type="ai" location="right" avatar-link="https://example.com"
 * 当然可以！Vue组合式API是Vue 3中引入的新功能：
 * 
 * - **响应式数据**：使用`ref()`和`reactive()`
 * - **生命周期钩子**：使用`onMounted()`等
 * 
 * ```javascript
 * import { ref, onMounted } from 'vue'
 * 
 * export default {
 *   setup() {
 *     const count = ref(0)
 *     
 *     onMounted(() => {
 *       console.log('组件已挂载')
 *     })
 *     
 *     return { count }
 *   }
 * }
 * ```
 * :::
 * 
 * ::: message nickname="octocat" avatar-type="github"
 * GitHub头像会自动添加链接跳转到GitHub主页
 * :::
 * ::::
 */
export const chatPlugin: PluginSimple = (md) => {
    md.use(container, {
        name: "chat",
        openRender: (tokens, index) => {
            const info = tokens[index].info.trim().slice("chat".length).trim();
            const attrs = parseAttrs(info);
            const propsStr = attrsToPropsStr(attrs);
            return `<ChatPanel ${propsStr}>`;
        },
        closeRender: () => `</ChatPanel>`,
    });

    md.use(container, {
        name: "message",
        openRender: (tokens, index) => {
            const info = tokens[index].info
                .trim()
                .slice("message".length)
                .trim();
            const attrs = parseAttrs(info);
            const propsStr = attrsToPropsStr(attrs);
            return `<ChatMessage ${propsStr}>`;
        },
        closeRender: () => `</ChatMessage>`,
    });
}; 