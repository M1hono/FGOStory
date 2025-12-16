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
const timelineTypePresets = {
    success: { dotColor: "success", cardColor: "", icon: "mdi-check-circle", preset: "success" },
    info: { dotColor: "info", cardColor: "", icon: "mdi-information", preset: "info" },
    warning: { dotColor: "warning", cardColor: "", icon: "mdi-alert", preset: "warning" },
    error: { dotColor: "error", cardColor: "", icon: "mdi-close-circle", preset: "error" },
    tip: { dotColor: "primary", cardColor: "", icon: "mdi-lightbulb", preset: "tip" },
    
    start: { dotColor: "green", cardColor: "", icon: "mdi-play-circle", preset: "start" },
    finish: { dotColor: "purple", cardColor: "", icon: "mdi-flag-checkered", preset: "finish" },
    milestone: { dotColor: "amber", cardColor: "", icon: "mdi-trophy", preset: "milestone" },
    deadline: { dotColor: "red", cardColor: "", icon: "mdi-clock-alert", preset: "deadline" },
    meeting: { dotColor: "blue", cardColor: "", icon: "mdi-calendar-plus", preset: "meeting" },
    launch: { dotColor: "deep-purple", cardColor: "", icon: "mdi-rocket-launch", preset: "launch" },
    pause: { dotColor: "orange", cardColor: "", icon: "mdi-pause-circle", preset: "pause" },
    stop: { dotColor: "red", cardColor: "", icon: "mdi-stop-circle", preset: "stop" },
    review: { dotColor: "indigo", cardColor: "", icon: "mdi-eye", preset: "review" },
    approve: { dotColor: "green", cardColor: "", icon: "mdi-check-circle-outline", preset: "approve" },
    reject: { dotColor: "red", cardColor: "", icon: "mdi-close-circle-outline", preset: "reject" },
    pending: { dotColor: "yellow", cardColor: "", icon: "mdi-clock-outline", preset: "pending" },
    progress: { dotColor: "blue", cardColor: "", icon: "mdi-progress-clock", preset: "progress" },
    complete: { dotColor: "green", cardColor: "", icon: "mdi-check-all", preset: "complete" },
    todo: { dotColor: "grey", cardColor: "", icon: "mdi-checkbox-marked-outline", preset: "todo" },
    doing: { dotColor: "orange", cardColor: "", icon: "mdi-hammer-wrench", preset: "doing" },
    done: { dotColor: "green", cardColor: "", icon: "mdi-check-bold", preset: "done" },
    
    bug: { dotColor: "red", cardColor: "", icon: "mdi-bug", preset: "bug" },
    bug_investigating: { dotColor: "orange", cardColor: "", icon: "mdi-magnify", preset: "bug_investigating" },
    bug_fixed: { dotColor: "green", cardColor: "", icon: "mdi-bug-check", preset: "bug_fixed" },
    
    feature: { dotColor: "blue", cardColor: "", icon: "mdi-lightbulb-outline", preset: "feature" },
    feature_designing: { dotColor: "purple", cardColor: "", icon: "mdi-draw", preset: "feature_designing" },
    feature_developing: { dotColor: "blue", cardColor: "", icon: "mdi-code-tags", preset: "feature_developing" },
    feature_testing: { dotColor: "orange", cardColor: "", icon: "mdi-test-tube", preset: "feature_testing" },
    feature_released: { dotColor: "green", cardColor: "", icon: "mdi-rocket", preset: "feature_released" },
    
    task_created: { dotColor: "grey", cardColor: "", icon: "mdi-plus-circle", preset: "task_created" },
    task_assigned: { dotColor: "blue", cardColor: "", icon: "mdi-account-arrow-right", preset: "task_assigned" },
    task_started: { dotColor: "blue", cardColor: "", icon: "mdi-play", preset: "task_started" },
    task_paused: { dotColor: "orange", cardColor: "", icon: "mdi-pause-circle", preset: "task_paused" },
    task_resumed: { dotColor: "blue", cardColor: "", icon: "mdi-play-circle", preset: "task_resumed" },
    task_completed: { dotColor: "green", cardColor: "", icon: "mdi-check-circle", preset: "task_completed" },
    task_cancelled: { dotColor: "red", cardColor: "", icon: "mdi-cancel", preset: "task_cancelled" },
    
    build_started: { dotColor: "blue", cardColor: "", icon: "mdi-hammer", preset: "build_started" },
    build_success: { dotColor: "green", cardColor: "", icon: "mdi-check-bold", preset: "build_success" },
    build_failed: { dotColor: "red", cardColor: "", icon: "mdi-close-thick", preset: "build_failed" },
    
    deploy: { dotColor: "green", cardColor: "", icon: "mdi-cloud-upload", preset: "deploy" },
    deploy_staging: { dotColor: "orange", cardColor: "", icon: "mdi-upload", preset: "deploy_staging" },
    deploy_production: { dotColor: "purple", cardColor: "", icon: "mdi-rocket-launch", preset: "deploy_production" },
    rollback: { dotColor: "red", cardColor: "", icon: "mdi-backup-restore", preset: "rollback" },
    
    security: { dotColor: "amber", cardColor: "", icon: "mdi-shield-search", preset: "security" },
    security_issue: { dotColor: "red", cardColor: "", icon: "mdi-shield-alert", preset: "security_issue" },
    security_fixed: { dotColor: "green", cardColor: "", icon: "mdi-shield-check", preset: "security_fixed" },
    
    performance: { dotColor: "cyan", cardColor: "", icon: "mdi-speedometer", preset: "performance" },
    performance_issue: { dotColor: "orange", cardColor: "", icon: "mdi-speedometer-slow", preset: "performance_issue" },
    performance_optimized: { dotColor: "green", cardColor: "", icon: "mdi-rocket", preset: "performance_optimized" },
    
    documentation: { dotColor: "brown", cardColor: "", icon: "mdi-book-open", preset: "documentation" },
    documentation_updated: { dotColor: "green", cardColor: "", icon: "mdi-book-check", preset: "documentation_updated" },
    
    release: { dotColor: "purple", cardColor: "", icon: "mdi-gift", preset: "release" },
    hotfix: { dotColor: "red", cardColor: "", icon: "mdi-fire", preset: "hotfix" },
    maintenance: { dotColor: "amber", cardColor: "", icon: "mdi-wrench", preset: "maintenance" },
    optimization: { dotColor: "teal", cardColor: "", icon: "mdi-tune", preset: "optimization" },
    testing: { dotColor: "indigo", cardColor: "", icon: "mdi-test-tube", preset: "testing" },
    refactor: { dotColor: "purple", cardColor: "", icon: "mdi-code-braces", preset: "refactor" },
    
    meeting_completed: { dotColor: "green", cardColor: "", icon: "mdi-calendar-check", preset: "meeting_completed" },
    decision_made: { dotColor: "purple", cardColor: "", icon: "mdi-gavel", preset: "decision_made" },
    backup_created: { dotColor: "grey", cardColor: "", icon: "mdi-content-save", preset: "backup_created" },
    user_feedback: { dotColor: "blue", cardColor: "", icon: "mdi-comment-account", preset: "user_feedback" },
    issue_escalated: { dotColor: "red", cardColor: "", icon: "mdi-arrow-up-bold", preset: "issue_escalated" },
    database_migration: { dotColor: "purple", cardColor: "", icon: "mdi-database-arrow-right", preset: "database_migration" },
    api_deprecated: { dotColor: "orange", cardColor: "", icon: "mdi-api-off", preset: "api_deprecated" },
    dependency_updated: { dotColor: "blue", cardColor: "", icon: "mdi-update", preset: "dependency_updated" }
};

export const vuetifyTimeline: PluginSimple = (md) => {
    md.use(container, {
        name: "timeline",
        openRender: (tokens, index) => {
            const info = tokens[index].info
                .trim()
                .slice("timeline".length)
                .trim();
            const attrs = parseAttrs(info);
            const propsStr = attrsToPropsStr(attrs);
            return `<v-timeline ${propsStr}>`;
        },
        closeRender: () => `</v-timeline>`,
    });

    md.use(container, {
        name: "timeline-item",
        openRender: (tokens, index) => {
            const info = tokens[index].info
                .trim()
                .slice("timeline-item".length)
                .trim();
            const attrs = parseAttrs(info);

            const timelineAttrs: Record<string, string> = {};
            const cardAttrs: Record<string, string> = {};
            let isCardMode = false;
            let themeColorClass = "";

            if (attrs.type && attrs.type in timelineTypePresets) {
                const preset =
                    timelineTypePresets[
                        attrs.type as keyof typeof timelineTypePresets
                    ];
                timelineAttrs["dot-color"] = preset.dotColor;
                if (preset.icon) timelineAttrs["icon"] = preset.icon;
                if (attrs.card === "true") {
                    isCardMode = true;
                }
            }

            const colorPresets = ['red', 'pink', 'purple', 'indigo', 'blue', 'lightblue', 'cyan', 'teal', 'green', 'lightgreen', 'lime', 'yellow', 'amber', 'orange', 'deeporange', 'brown', 'grey', 'bluegrey', 'black', 'white'];

            for (const [key, value] of Object.entries(attrs)) {
                if (key === "type") {
                    continue;
                } else if (key === "card") {
                    isCardMode = value === "true";
                } else if (key.startsWith("card-")) {
                    const cardKey = key.replace("card-", "");
                    cardAttrs[cardKey] = value;
                } else {
                    if (!timelineAttrs[key]) {
                        timelineAttrs[key] = value;
                        
                        if (key === "dot-color" && colorPresets.includes(value)) {
                            themeColorClass = `timeline-color-${value}`;
                        }
                    }
                }
            }

            const dotColor = timelineAttrs["dot-color"];
            const cardColor = cardAttrs.color;
            
            if (dotColor && colorPresets.includes(dotColor) && !cardColor) {
                cardAttrs.color = dotColor;
            }
            
            if (cardColor && colorPresets.includes(cardColor) && !dotColor) {
                timelineAttrs["dot-color"] = cardColor;
                if (!themeColorClass) themeColorClass = `timeline-color-${cardColor}`;
            }
            
            if (cardAttrs.color && colorPresets.includes(cardAttrs.color)) {
                if (!themeColorClass) themeColorClass = `timeline-color-${cardAttrs.color}`;
            }

            const timelinePropsStr = attrsToPropsStr(timelineAttrs);
            const oppositeText = attrs.opposite || "";

            let html = `<v-timeline-item ${timelinePropsStr}${
                themeColorClass ? ` class="${themeColorClass}"` : ""
            }>`;

            if (oppositeText) {
                const dotColor = timelineAttrs["dot-color"] || "primary";
                html += `<template v-slot:opposite>`;
                html += `<div class="pt-1 headline font-weight-bold text-${dotColor}">${oppositeText}</div>`;
                html += `</template>`;
            }

            if (isCardMode) {
                const cardColor =
                    cardAttrs.color || timelineAttrs["dot-color"] || "";
                const cardIcon = cardAttrs.icon || "";
                const cardIconAlign = cardAttrs["icon-align"] || "left";
                const cardTitle = cardAttrs.title || "";

                html += `<v-card>`;

                let titleClass = "";
                if (cardColor && !themeColorClass) {
                    titleClass += `bg-${cardColor}`;
                }
                if (cardIconAlign === "right") {
                    if (titleClass) titleClass += " justify-end";
                    else titleClass = "justify-end";
                }

                html += `<v-card-title${
                    titleClass ? ` class="${titleClass}"` : ""
                }>`;

                if (cardIconAlign === "right") {
                    html += cardTitle;
                    if (cardIcon) {
                        html += ` <v-icon icon="${cardIcon}" size="large"></v-icon>`;
                    }
                } else {
                    if (cardIcon) {
                        html += `<v-icon icon="${cardIcon}" size="large"></v-icon> `;
                    }
                    html += cardTitle;
                }

                html += "</v-card-title>";
                
                html += '<v-card-text class="timeline-card-content">';
            }

            return html;
        },
        closeRender: (tokens, index) => {
            let openToken = null;
            for (let i = index - 1; i >= 0; i--) {
                if (tokens[i].type === "container_timeline-item_open") {
                    openToken = tokens[i];
                    break;
                }
            }

            if (openToken && openToken.info) {
                const info = openToken.info
                    .trim()
                    .slice("timeline-item".length)
                    .trim();
                const attrs = parseAttrs(info);
                const isCardMode = attrs.card === "true";

                if (isCardMode) {
                    let html = "";

                    const cardButton = attrs["card-button"] === "true";
                    if (cardButton) {
                        const cardButtonColor =
                            attrs["card-button-color"] ||
                            attrs["dot-color"] ||
                            "primary";
                        const cardButtonText =
                            attrs["card-button-text"] || "Button";
                        const cardButtonLink = attrs["card-button-link"] || "";
                        const cardButtonTarget =
                            attrs["card-button-target"] || "_self";

                        if (cardButtonLink) {
                            html += `<v-btn color="${cardButtonColor}" variant="outlined" class="mt-2" href="${cardButtonLink}" target="${cardButtonTarget}">${cardButtonText}</v-btn>`;
                        } else {
                            html += `<v-btn color="${cardButtonColor}" variant="outlined" class="mt-2">${cardButtonText}</v-btn>`;
                        }
                    }

                    html += "</v-card-text></v-card></v-timeline-item>";
                    return html;
                }
            }

            return "</v-timeline-item>";
        },
    });
};
