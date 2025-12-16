import type { DefaultTheme } from 'vitepress';
import { getProjectInfo, getLanguageByCode, getLangCodeFromLink, getSearchLocaleKey, isFeatureEnabled } from '../project-config';
import { getSidebarSync } from '../../utils/sidebar';

const projectInfo = getProjectInfo();
const langConfig = getLanguageByCode('zh-CN')!;

export const zh_CN = <DefaultTheme.Config>{
    label: langConfig.displayName,
    lang: langConfig.giscusLang,
    link: langConfig.link,
    title: 'Mihono Vitepress 模版',
    description: '一个基于 Vitepress 的文档模版',
    themeConfig: {
        nav: [
            {
                text: "首页",
                link: "/",
            }
        ],
        sidebar: getSidebarSync(getLangCodeFromLink(langConfig.link!)),
        outline: {
            level: "deep",
            label: "页面导航",
        },
        docFooter: {
            prev: "上一页",
            next: "下一页",
        },
        lastUpdated: {
            text: "最后更新时间",
            formatOptions: {
                dateStyle: "short",
                timeStyle: "medium",
            },
        },
        editLink: isFeatureEnabled('editLink') && projectInfo.editLink ? {
            pattern: projectInfo.editLink.pattern,
            text: projectInfo.editLink.text || "在 GitHub 上编辑此页面"
        } : undefined,
        langMenuLabel: "切换语言",
        returnToTopLabel: "回到顶部",
        sidebarMenuLabel: "菜单",
        darkModeSwitchLabel: "主题",
        lightModeSwitchTitle: "切换到浅色模式",
        darkModeSwitchTitle: "切换到深色模式",
    },
};

export const search: DefaultTheme.AlgoliaSearchOptions["locales"] = {
    [getSearchLocaleKey(langConfig.code)]: {
        placeholder: "搜索文档",
        translations: {
            button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
            },
            modal: {
                searchBox: {
                    resetButtonTitle: "清除查询条件",
                    resetButtonAriaLabel: "清除查询条件",
                    cancelButtonText: "取消",
                    cancelButtonAriaLabel: "取消",
                },
                startScreen: {
                    recentSearchesTitle: "搜索历史",
                    noRecentSearchesText: "没有搜索历史",
                    saveRecentSearchButtonTitle: "保存至搜索历史",
                    removeRecentSearchButtonTitle: "从搜索历史中移除",
                    favoriteSearchesTitle: "收藏",
                    removeFavoriteSearchButtonTitle: "从收藏中移除",
                },
                errorScreen: {
                    titleText: "无法获取结果",
                    helpText: "你可能需要检查你的网络连接",
                },
                footer: {
                    selectText: "选择",
                    navigateText: "切换",
                    closeText: "关闭",
                    searchByText: "搜索提供者",
                },
                noResultsScreen: {
                    noResultsText: "无法找到相关结果",
                    suggestedQueryText: "你可以尝试查询",
                    reportMissingResultsText: "你认为该查询应该有结果？",
                    reportMissingResultsLinkText: "点击反馈",
                },
            },
        },
    },
};
