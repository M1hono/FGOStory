<template>
    <div class="commits-counter-container" :class="{ 'is-home': isHomePage }">
        <div class="commits-counter">
            <div class="chart-container">
                <div
                    class="chart-loading"
                    v-if="!chartOptions || !contributions.length"
                >
                    <div class="loading-bars">
                        <div class="bar" v-for="i in 20" :key="i"></div>
                    </div>
                </div>
                <ClientOnly v-else>
                    <v-chart
                        :option="chartOptions"
                        :autoresize="true"
                        class="main-chart"
                    />
                </ClientOnly>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    //@ts-nocheck
    import { ref, computed, onMounted } from "vue";
    import { useData } from "vitepress";
    import { defineAsyncComponent } from "vue";
    import utils from "@utils";
    import { useSafeI18n } from "@utils/i18n/locale";
    import { getProjectInfo } from "../../../config/project-config";

    // Async import for vue-echarts to avoid SSR issues
    const VChart = defineAsyncComponent(async () => {
        const { default: VChart } = await import("vue-echarts");
        const { use } = await import("echarts/core");
        const { LineChart } = await import("echarts/charts");
        const { TooltipComponent, GridComponent } = await import(
            "echarts/components"
        );
        const { CanvasRenderer } = await import("echarts/renderers");

        use([LineChart, TooltipComponent, GridComponent, CanvasRenderer]);

        return VChart;
    });

    const { t } = useSafeI18n("commits-counter", {
        repoActivity: "Repository Activity",
        recentCommits: "Recent commits:",
        commitsOnDate: "{count} commits on {date}"
    });

    const projectInfo = getProjectInfo();
    
    const getRepoInfo = () => {
        const repoUrl = projectInfo.repository.url;
        const match = repoUrl.match(
            /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/
        );
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
        return {
            owner: projectInfo.author,
            repo: projectInfo.name,
        };
    };

    interface Props {
        username?: string;
        repoName?: string;
        daysToFetch?: number;
        height?: number;
        lineWidth?: number;
        fill?: boolean;
        smooth?: boolean;
    }

    const { owner: defaultUsername, repo: defaultRepoName } = getRepoInfo();

    const props = withDefaults(defineProps<Props>(), {
        daysToFetch: 30,
        height: 120,
        lineWidth: 4,
        fill: true,
        smooth: true,
    });

    const username = computed(() => props.username ?? defaultUsername);
    const repoName = computed(() => props.repoName ?? defaultRepoName);

    const { isDark, lang, frontmatter } = useData();
    
    const isHomePage = computed(() => {
        return !!(frontmatter.value.isHome ?? frontmatter.value.layout === "home");
    });

    const contributions = ref<number[]>([]);

    const totalContributions = computed(() =>
        utils.charts.github.commitProcessor.getTotalContributions(
            contributions.value
        )
    );

    /**
     * Generate enhanced chart options with beautiful styling
     */
    const chartOptions = computed(() => {
        if (!contributions.value.length) return {};

        const maxValue = Math.max(...contributions.value);

        return {
            grid: {
                left: 40,
                right: 40,
                top: 30,
                bottom: 30,
            },
            xAxis: {
                type: "category",
                data: contributions.value.map((_, index) =>
                    new Date(
                        Date.now() -
                            (contributions.value.length - 1 - index) *
                                24 *
                                60 *
                                60 *
                                1000
                    ).toLocaleDateString(lang.value, {
                        month: "short",
                        day: "numeric",
                    })
                ),
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: isDark.value
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.1)",
                    },
                },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: isDark.value
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.6)",
                    fontSize: 12,
                    interval: Math.floor(contributions.value.length / 6),
                },
                splitLine: { show: false },
            },
            yAxis: {
                type: "value",
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: isDark.value
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.6)",
                    fontSize: 12,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: isDark.value
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.05)",
                        type: "dashed",
                    },
                },
            },
            series: [
                {
                    type: "line",
                    data: contributions.value,
                    lineStyle: {
                        width: props.lineWidth,
                        color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                                {
                                    offset: 0,
                                    color: isDark.value ? "#60a5fa" : "#3b82f6",
                                },
                                {
                                    offset: 0.5,
                                    color: isDark.value ? "#a78bfa" : "#8b5cf6",
                                },
                                {
                                    offset: 1,
                                    color: isDark.value ? "#f472b6" : "#ec4899",
                                },
                            ],
                        },
                        shadowColor: isDark.value
                            ? "rgba(96, 165, 250, 0.3)"
                            : "rgba(59, 130, 246, 0.3)",
                        shadowBlur: 10,
                        shadowOffsetY: 2,
                    },
                    areaStyle: props.fill
                        ? {
                              color: {
                                  type: "linear",
                                  x: 0,
                                  y: 0,
                                  x2: 0,
                                  y2: 1,
                                  colorStops: [
                                      {
                                          offset: 0,
                                          color: isDark.value
                                              ? "rgba(96, 165, 250, 0.4)"
                                              : "rgba(59, 130, 246, 0.3)",
                                      },
                                      {
                                          offset: 0.7,
                                          color: isDark.value
                                              ? "rgba(167, 139, 250, 0.2)"
                                              : "rgba(139, 92, 246, 0.15)",
                                      },
                                      {
                                          offset: 1,
                                          color: isDark.value
                                              ? "rgba(244, 114, 182, 0.1)"
                                              : "rgba(236, 72, 153, 0.05)",
                                      },
                                  ],
                              },
                          }
                        : undefined,
                    symbol: "circle",
                    symbolSize: 6,
                    showSymbol: false,
                    emphasis: {
                        focus: "series",
                        showSymbol: true,
                        symbolSize: 8,
                        lineStyle: {
                            width: props.lineWidth + 2,
                        },
                    },
                    smooth: props.smooth,
                },
            ],
            tooltip: {
                trigger: "axis",
                backgroundColor: isDark.value
                    ? "rgba(20, 20, 20, 0.9)"
                    : "rgba(255, 255, 255, 0.9)",
                borderColor: isDark.value
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                textStyle: {
                    color: isDark.value ? "#E5E7EB" : "#1F2937",
                },
                formatter: (params: any) => {
                    const dataIndex = params[0].dataIndex;
                    const date = new Date();
                    date.setDate(
                        date.getDate() -
                            (contributions.value.length - 1 - dataIndex)
                    );
                    const dateString = date.toLocaleDateString(lang.value, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    const count = params[0].value;
                    return t.commitsOnDate
                        .replace('{count}', count)
                        .replace('{date}', dateString);
                },
            },
        };
    });

    /**
     * Fetch commit data using extracted GitHub utilities
     */
    const fetchContributions = async () => {
        try {
            const commits = await utils.charts.github.githubApi.fetchAllCommits(
                username.value,
                repoName.value
            );

            contributions.value =
                utils.charts.github.commitProcessor.processContributions(
                    commits,
                    props.daysToFetch
                );
        } catch (error) {
            console.error("Error fetching commit data:", error);
            contributions.value = [];
        }
    };

    onMounted(() => {
        fetchContributions();
    });
</script>

<style scoped>
    .commits-counter-container {
        /* Default normal layout */
        width: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        position: relative;
        overflow: hidden;
    }

    /* Full-width styling only for home pages */
    .commits-counter-container.is-home {
        width: 100vw;
        margin-left: 50%;
        transform: translateX(-50%);
        background: #ffffff;
    }

    .dark .commits-counter-container.is-home {
        background: #1b1b1f;
    }

    .commits-counter {
        /* Default normal layout - fit container */
        max-width: 100%;
        margin: 0;
        padding: 20px 0;
        background: transparent;
        border: none;
        border-radius: 0;
        position: relative;
        width: 100%;
        box-sizing: border-box;
    }

    /* Wider layout for home pages */
    .commits-counter-container.is-home .commits-counter {
        max-width: 1800px;
        margin: 0 auto;
        padding: 60px 24px;
    }

    @media (min-width: 640px) {
        .commits-counter {
            padding: 30px 0;
        }
        
        .commits-counter-container.is-home .commits-counter {
            padding: 80px 48px;
        }
    }

    @media (min-width: 960px) {
        .commits-counter {
            padding: 40px 0;
        }
        
        .commits-counter-container.is-home .commits-counter {
            padding: 100px 64px;
        }
    }

    .chart-container {
        /* Transparent background for non-home pages */
        background: transparent;
        border: none;
        border-radius: 16px;
        padding: 20px 16px;
        position: relative;
        overflow: hidden;
        height: 300px;
        width: 100%;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    /* Styled background for home pages only */
    .commits-counter-container.is-home .chart-container {
        background: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        padding: 40px 32px;
        height: 400px;
    }

    @media (min-width: 640px) {
        .chart-container {
            padding: 24px 20px;
            height: 350px;
        }
        
        .commits-counter-container.is-home .chart-container {
            padding: 50px 40px;
            height: 480px;
        }
    }

    @media (min-width: 960px) {
        .chart-container {
            padding: 32px 24px;
            height: 400px;
        }
        
        .commits-counter-container.is-home .chart-container {
            padding: 60px 50px;
            height: 550px;
        }
    }

    @media (min-width: 1200px) {
        .chart-container {
            height: 450px;
            padding: 40px 32px;
        }
        
        .commits-counter-container.is-home .chart-container {
            height: 600px;
            padding: 70px 60px;
        }
    }

    .main-chart {
        width: 100%;
        height: 100%;
    }

    .chart-loading {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-bars {
        display: flex;
        align-items: end;
        gap: 6px;
        height: 80px; /* Larger loading bars */
    }

    .bar {
        width: 10px; /* Wider bars */
        background: linear-gradient(
            0deg,
            var(--vp-c-brand-1) 0%,
            var(--vp-c-brand-3) 100%
        );
        border-radius: 5px;
        animation: loading-wave 1.5s ease-in-out infinite;
        animation-delay: calc(var(--i) * 0.1s);
    }

    .bar:nth-child(1) {
        --i: 0;
        height: 20%;
    }
    .bar:nth-child(2) {
        --i: 1;
        height: 40%;
    }
    .bar:nth-child(3) {
        --i: 2;
        height: 60%;
    }
    .bar:nth-child(4) {
        --i: 3;
        height: 80%;
    }
    .bar:nth-child(5) {
        --i: 4;
        height: 100%;
    }
    .bar:nth-child(6) {
        --i: 5;
        height: 70%;
    }
    .bar:nth-child(7) {
        --i: 6;
        height: 30%;
    }
    .bar:nth-child(8) {
        --i: 7;
        height: 50%;
    }
    .bar:nth-child(9) {
        --i: 8;
        height: 90%;
    }
    .bar:nth-child(10) {
        --i: 9;
        height: 40%;
    }
    .bar:nth-child(11) {
        --i: 10;
        height: 60%;
    }
    .bar:nth-child(12) {
        --i: 11;
        height: 35%;
    }
    .bar:nth-child(13) {
        --i: 12;
        height: 75%;
    }
    .bar:nth-child(14) {
        --i: 13;
        height: 85%;
    }
    .bar:nth-child(15) {
        --i: 14;
        height: 45%;
    }
    .bar:nth-child(16) {
        --i: 15;
        height: 65%;
    }
    .bar:nth-child(17) {
        --i: 16;
        height: 25%;
    }
    .bar:nth-child(18) {
        --i: 17;
        height: 55%;
    }
    .bar:nth-child(19) {
        --i: 18;
        height: 95%;
    }
    .bar:nth-child(20) {
        --i: 19;
        height: 35%;
    }

    @keyframes loading-wave {
        0%,
        100% {
            transform: scaleY(1);
            opacity: 0.7;
        }
        50% {
            transform: scaleY(1.5);
            opacity: 1;
        }
    }

    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
        .commits-counter {
            padding: 20px 0;
            max-width: 100%;
        }
        
        .commits-counter-container.is-home .commits-counter {
            padding: 40px 16px;
        }

        .chart-container {
            height: 280px;
            padding: 16px 12px;
        }
        
        .commits-counter-container.is-home .chart-container {
            height: 350px;
            padding: 30px 20px;
        }
    }
</style>
