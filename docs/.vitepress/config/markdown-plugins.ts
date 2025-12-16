//@ts-nocheck
import { argv, cwd, env } from "node:process";

import { MarkdownOptions } from "vitepress";

import { BiDirectionalLinks } from "@nolebase/markdown-it-bi-directional-links";
import { InlineLinkPreviewElementTransform } from "@nolebase/vitepress-plugin-inline-link-preview/markdown-it";
import multipleChoicePlugin from 'markdown-it-multiple-choice'
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import mdFootnote from "markdown-it-footnote";
import mdTaskLists from "markdown-it-task-lists";
import mdDeflist from "markdown-it-deflist";
import mdAbbr from "markdown-it-abbr";
import { imgSize } from "@mdit/plugin-img-size";
import { align } from "@mdit/plugin-align";
import { spoiler } from "@mdit/plugin-spoiler";
import { sub } from "@mdit/plugin-sub";
import { sup } from "@mdit/plugin-sup";
import { ruby } from "@mdit/plugin-ruby";
import { demo } from "@mdit/plugin-demo";
import { dl } from "@mdit/plugin-dl";
import { stepper } from "../plugins/stepper";
import { vuetifyTimeline } from "../plugins/vuetify-timeline";
import { tab } from "@mdit/plugin-tab";
import { mark } from "@mdit/plugin-mark";
import { ins } from "@mdit/plugin-ins";
import { customAlert } from "../plugins/custom-alert";
import { v_alert } from "../plugins/v-alert";
import { mdDemo } from "../plugins/demo";
import { carousels } from "../plugins/carousels";
import { iframes } from "../plugins/iframe";
import { card } from "../plugins/card";
import { chartGrid } from "../plugins/table-grid";
import { groupIconMdPlugin } from "vitepress-plugin-group-icons";
import MagicMovePlugin from "../plugins/magic-move";
import { dialogPlugin } from "../plugins/dialog";
import { chatPlugin } from "../plugins/chat-message";
import { withMarkmap } from "../plugins/markmap";
import { vueCharts } from "../plugins/vue-charts";
import { isFeatureEnabled } from "./project-config";
import ts from "typescript";

import fs from "fs";
import path from "path";

let magicMoveShiki: any = null;

export const markdown: MarkdownOptions = {
    math: true,
    theme: {
        light: "github-light",
        dark: "github-dark"
    },
    shikiSetup: async (shiki) => {
        const commonLanguages = [
            'javascript', 'js', 'typescript', 'ts', 'java', 'python', 'py',
            'cpp', 'c', 'csharp', 'cs', 'php', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'scala', 'r', 'sql', 'html', 'css', 'scss', 'sass',
            'json', 'yaml', 'yml', 'xml', 'markdown', 'md', 'bash', 'sh',
            'powershell', 'docker', 'dockerfile', 'vue', 'react', 'jsx', 'tsx'
        ];
        
        for (const lang of commonLanguages) {
            try {
                if (!shiki.getLoadedLanguages().includes(lang)) {
                    await shiki.loadLanguage(lang as any);
                }
            } catch (error) {}
        }
        
        magicMoveShiki = shiki;
    },
    config: async (md) => {
        md.use(InlineLinkPreviewElementTransform);
        md.use(BiDirectionalLinks());
        md.use(groupIconMdPlugin);
        
        md.use(tabsMarkdownPlugin);
        md.use(dialogPlugin);
        md.use(chatPlugin);
        md.use(multipleChoicePlugin);
        
        md.use(mdFootnote);
        md.use(mdTaskLists);
        md.use(mdDeflist);
        md.use(mdAbbr);
        md.use(imgSize);
        md.use(align);
        md.use(spoiler);
        md.use(sub);
        md.use(sup);
        md.use(ruby);
        md.use(demo, mdDemo);
        md.use(dl);
        md.use(customAlert);
        md.use(v_alert);
        md.use(mark);
        md.use(ins);
        md.use(chartGrid);

        md.use(tab, stepper);
        md.use(tab, carousels);
        md.use(tab, iframes);

        md.use(card);
        md.use(vueCharts);
        md.use(vuetifyTimeline);
        
        if (isFeatureEnabled('markmap')) {
            withMarkmap(md);
        }
        
        if (magicMoveShiki) {
            md.use(MagicMovePlugin, magicMoveShiki, {
                light: "github-light",
                dark: "github-dark"
            });
        }

        md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
            let htmlResult = slf.renderToken(tokens, idx, options);
            if (tokens[idx].tag === "h1") htmlResult += `<ArticleMetadata />`;
            return htmlResult;
        };
    },
    image: {
        lazyLoading: true,
    },
};
