import type { DefaultTheme } from 'vitepress';
import { getProjectInfo, getLanguageByCode, getLangCodeFromLink, getSearchLocaleKey, isFeatureEnabled } from '../project-config';
import { getSidebarSync } from '../../utils/sidebar';

const projectInfo = getProjectInfo();
const langConfig = getLanguageByCode('en-US')!;

export const en_US = <DefaultTheme.Config>{
    label: langConfig.displayName,
    lang: langConfig.giscusLang,
    link: langConfig.link,
    title: 'Mihono Vitepress Template',
    description: 'A template for Vitepress documentation',
    themeConfig: {
        nav: [
            {
                text: "Home",
                link: "/",
            }   
        ],
        sidebar: getSidebarSync(getLangCodeFromLink(langConfig.link!)),
        outline: {
            level: "deep",
            label: "Page Content",
        },
        docFooter: {
            prev: "Previous Page",
            next: "Next Page",
        },
        lastUpdated: {
            text: "Last Updated",
            formatOptions: {
                dateStyle: "short",
                timeStyle: "medium",
            },
        },
        editLink: isFeatureEnabled('editLink') && projectInfo.editLink ? {
            pattern: projectInfo.editLink.pattern,
            text: projectInfo.editLink.text || "Edit this page on GitHub"
        } : undefined,
        langMenuLabel: "Change Language",
        darkModeSwitchLabel: "Switch Theme",
        lightModeSwitchTitle: "Switch to light mode",
        darkModeSwitchTitle: "Switch to dark mode",
        returnToTopLabel: "Return to top",
        sidebarMenuLabel: "Menu",
    },
};

export const search: DefaultTheme.AlgoliaSearchOptions["locales"] = {
    [getSearchLocaleKey(langConfig.code)]: {
        placeholder: "Search docs",
        translations: {
            button: {
                buttonText: "Search",
                buttonAriaLabel: "Search",
            },
            modal: {
                searchBox: {
                    resetButtonTitle: "Clear the query",
                    resetButtonAriaLabel: "Clear the query",
                    cancelButtonText: "Cancel",
                    cancelButtonAriaLabel: "Cancel",
                },
                startScreen: {
                    recentSearchesTitle: "Recent",
                    noRecentSearchesText: "No recent searches",
                    saveRecentSearchButtonTitle: "Save this search",
                    removeRecentSearchButtonTitle: "Remove this search from history",
                    favoriteSearchesTitle: "Favorites",
                    removeFavoriteSearchButtonTitle: "Remove this search from favorites",
                },
                errorScreen: {
                    titleText: "Unable to fetch results",
                    helpText: "You might want to check your network connection",
                },
                footer: {
                    selectText: "to select",
                    navigateText: "to navigate",
                    closeText: "to close",
                    searchByText: "Search by",
                },
                noResultsScreen: {
                    noResultsText: "No results for",
                    suggestedQueryText: "Try searching for",
                    reportMissingResultsText: "Believe this query should return results?",
                    reportMissingResultsLinkText: "Let us know",
                },
            },
        },
    },
};
