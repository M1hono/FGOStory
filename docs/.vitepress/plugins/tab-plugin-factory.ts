import type {
    MarkdownItTabOptions,
    MarkdownItTabInfo,
    MarkdownItTabData,
} from "@mdit/plugin-tab";
import type MarkdownIt from "markdown-it";

interface TabPluginConfig {
    name: string;
    containerComponent: string;
    tabComponent: string;
    configMapping?: Record<string, (value: any) => string>;
    containerRenderer?: (
        info: MarkdownItTabInfo,
        config: any,
        parsedConfig: string
    ) => string;
    containerCloseRenderer?: () => string;
    tabRenderer?: (data: MarkdownItTabData, info: MarkdownItTabInfo) => string;
    defaultConfig?: Record<string, any>;
    requiredConfig?: string[];
    useSlots?: boolean;
    slotPattern?: (data: MarkdownItTabData) => string;
}

export function createTabPlugin(config: TabPluginConfig): MarkdownItTabOptions {
    const {
        name,
        containerComponent,
        tabComponent,
        configMapping = {},
        containerRenderer,
        containerCloseRenderer,
        tabRenderer,
        defaultConfig = {},
        requiredConfig = [],
        useSlots = false,
        slotPattern,
    } = config;

    return {
        name,

        openRender(
            info: MarkdownItTabInfo,
            tokens: any[],
            index: number,
            opt: any,
            env: any
        ): string {
            let parsedConfigString = "";
            let parsedConfig = { ...defaultConfig };

            const token = tokens[index];
            if (token?.meta?.id && typeof token.meta.id === "string") {
                try {
                    const configObj = JSON.parse(token.meta.id);
                    parsedConfig = { ...defaultConfig, ...configObj };

                    for (const required of requiredConfig) {
                        if (!(required in parsedConfig)) {
                            throw new Error(
                                `${required} is required for ${name}`
                            );
                        }
                    }

                    for (const [key, mapper] of Object.entries(configMapping)) {
                        if (parsedConfig[key] !== undefined) {
                            parsedConfigString += ` ${mapper(
                                parsedConfig[key]
                            )}`;
                        }
                    }
                } catch (error) {
                    console.error(`Error parsing ${name} config:`, error);
                    return "";
                }
            }

            if (containerRenderer) {
                return containerRenderer(
                    info,
                    parsedConfig,
                    parsedConfigString
                );
            }

            return `<${containerComponent}${parsedConfigString}>`;
        },

        closeRender(): string {
            if (containerCloseRenderer) {
                return containerCloseRenderer();
            }
            return `</${containerComponent}>`;
        },

        tabOpenRender(data: MarkdownItTabData): string {
            if (tabRenderer) {
                const info = {
                    active: data.index,
                    data: [data],
                } as MarkdownItTabInfo;
                return tabRenderer(data, info);
            }

            if (useSlots && slotPattern) {
                return slotPattern(data);
            }

            if (useSlots) {
                return `<template v-slot:item.${data.index + 1}>`;
            }

            return `<${tabComponent}>`;
        },

        tabCloseRender(): string {
            if (useSlots) {
                return `</template>`;
            }

            return `</${tabComponent}>`;
        },
    };
}

export const configMappers = {
    showHide: (key: string) => (value: boolean) => `:${key}="${value}"`,
    direct: (key: string) => (value: any) => `${key}="${value}"`,
    prop: (key: string) => (value: any) => `:${key}="${value}"`,
    attr: (key: string) => (value: string) => `${key}="${value}"`,
    json: (key: string) => (value: object) =>
        `:${key}='${JSON.stringify(value)}'`,
};
