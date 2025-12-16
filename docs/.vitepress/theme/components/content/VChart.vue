<template>
    <div class="echarts-container" :style="{ width, height: computedHeight }">
        <ClientOnly>
            <VueEChart
                :option="enhancedOptions"
                :theme="computedTheme"
                :autoresize="true"
                class="vue-echarts"
            />
        </ClientOnly>
    </div>
</template>

<script setup>
    import { computed } from "vue";
    import { useData } from "vitepress";
    import { defineAsyncComponent } from "vue";

    const VueEChart = defineAsyncComponent(async () => {
        const { default: VChart } = await import("vue-echarts");
        const { use } = await import("echarts/core");

        const {
            LineChart,
            BarChart,
            PieChart,
            ScatterChart,
            RadarChart,
            GaugeChart,
            FunnelChart,
            HeatmapChart,
            SankeyChart,
            GraphChart,
            TreeChart,
            TreemapChart,
            SunburstChart,
            CandlestickChart,
            BoxplotChart,
            ParallelChart,
            ThemeRiverChart,
            PictorialBarChart,
        } = await import("echarts/charts");

        const {
            TitleComponent,
            TooltipComponent,
            LegendComponent,
            GridComponent,
            DatasetComponent,
            TransformComponent,
            ToolboxComponent,
            DataZoomComponent,
            VisualMapComponent,
            TimelineComponent,
            CalendarComponent,
            GraphicComponent,
            MarkPointComponent,
            MarkLineComponent,
            MarkAreaComponent,
            AriaComponent,
            ParallelComponent,
            SingleAxisComponent,
            RadarComponent,
        } = await import("echarts/components");

        const { CanvasRenderer } = await import("echarts/renderers");

        use([
            LineChart,
            BarChart,
            PieChart,
            ScatterChart,
            RadarChart,
            GaugeChart,
            FunnelChart,
            HeatmapChart,
            SankeyChart,
            GraphChart,
            TreeChart,
            TreemapChart,
            SunburstChart,
            CandlestickChart,
            BoxplotChart,
            ParallelChart,
            ThemeRiverChart,
            PictorialBarChart,
            TitleComponent,
            TooltipComponent,
            LegendComponent,
            GridComponent,
            DatasetComponent,
            TransformComponent,
            ToolboxComponent,
            DataZoomComponent,
            VisualMapComponent,
            TimelineComponent,
            CalendarComponent,
            GraphicComponent,
            MarkPointComponent,
            MarkLineComponent,
            MarkAreaComponent,
            AriaComponent,
            ParallelComponent,
            SingleAxisComponent,
            RadarComponent,
            CanvasRenderer,
        ]);

        return VChart;
    });

    const props = defineProps({
        options: {
            type: Object,
            required: true,
        },
        width: {
            type: String,
            default: "100%",
        },
        height: {
            type: String,
            default: "400px",
        },
        theme: {
            type: String,
            default: "auto",
        },
    });

    const { isDark } = useData();

    const computedTheme = computed(() => {
        if (props.theme === "auto") {
            return isDark.value ? "dark" : null;
        }
        return props.theme;
    });

    // Compute height based on chart type
    const computedHeight = computed(() => {
        // Check if it's a radar chart
        const isRadarChart = props.options?.radar || 
                           (props.options?.series && props.options?.series[0]?.type === 'radar');
        
        // If height is not explicitly set and it's a radar chart, use 500px
        if (isRadarChart && props.height === "400px") {
            return "500px";
        }
        
        return props.height;
    });

    const customThemes = {
        light: {
            colors: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#ffc107', '#e91e63', '#009688', '#795548', '#607d8b', '#673ab7', '#3f51b5', '#03a9f4', '#8bc34a', '#cddc39', '#ff5722', '#607d8b'],
            backgroundColor: 'transparent',
            textColor: '#333333',
            axisColor: '#ccc',
            gridColor: '#f5f5f5'
        },
        dark: {
            colors: ['#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#e57373', '#4dd0e1', '#ffd54f', '#f06292', '#4db6ac', '#a1887f', '#90a4ae', '#9575cd', '#7986cb', '#4fc3f7', '#aed581', '#dce775', '#ff8a65', '#90a4ae'],
            backgroundColor: 'transparent',
            textColor: '#ffffff',
            axisColor: '#666',
            gridColor: '#424242'
        }
    };

    const enhancedOptions = computed(() => {
        if (!props.options) return {};
        
        const theme = isDark.value ? customThemes.dark : customThemes.light;
        const baseOptions = { ...props.options };
        
        if (!baseOptions.backgroundColor) {
            baseOptions.backgroundColor = theme.backgroundColor;
        }
        
        if (!baseOptions.textStyle) {
            baseOptions.textStyle = { color: theme.textColor };
        }
        
        if (!baseOptions.color) {
            baseOptions.color = theme.colors;
        }
        
        if (baseOptions.series) {
            baseOptions.series = baseOptions.series.map(series => ({
                ...series,
                textStyle: { color: theme.textColor, ...series.textStyle }
            }));
        }
        
        if (baseOptions.xAxis) {
            const xAxisArray = Array.isArray(baseOptions.xAxis) ? baseOptions.xAxis : [baseOptions.xAxis];
            baseOptions.xAxis = xAxisArray.map(axis => ({
                ...axis,
                axisLabel: { color: theme.textColor, ...axis.axisLabel },
                axisLine: { lineStyle: { color: theme.axisColor, ...axis.axisLine?.lineStyle }, ...axis.axisLine },
                splitLine: { lineStyle: { color: theme.gridColor, ...axis.splitLine?.lineStyle }, ...axis.splitLine }
            }));
        }
        
        if (baseOptions.yAxis) {
            const yAxisArray = Array.isArray(baseOptions.yAxis) ? baseOptions.yAxis : [baseOptions.yAxis];
            baseOptions.yAxis = yAxisArray.map(axis => ({
                ...axis,
                axisLabel: { color: theme.textColor, ...axis.axisLabel },
                axisLine: { lineStyle: { color: theme.axisColor, ...axis.axisLine?.lineStyle }, ...axis.axisLine },
                splitLine: { lineStyle: { color: theme.gridColor, ...axis.splitLine?.lineStyle }, ...axis.splitLine }
            }));
        }
        
        if (baseOptions.title) {
            baseOptions.title = {
                ...baseOptions.title,
                textStyle: { color: theme.textColor, ...baseOptions.title.textStyle }
            };
        }
        
        if (baseOptions.legend) {
            baseOptions.legend = {
                ...baseOptions.legend,
                textStyle: { color: theme.textColor, ...baseOptions.legend.textStyle }
            };
        }
        
        if (baseOptions.tooltip) {
            baseOptions.tooltip = {
                backgroundColor: isDark.value ? '#424242' : '#ffffff',
                borderColor: theme.axisColor,
                textStyle: { color: theme.textColor },
                ...baseOptions.tooltip
            };
        }

        if (baseOptions.grid) {
            baseOptions.grid = {
                ...baseOptions.grid,
                borderColor: theme.axisColor
            };
        }

        // Fix title and legend overlap issues
        if (baseOptions.title && baseOptions.legend) {
            // Adjust title position
            baseOptions.title = {
                ...baseOptions.title,
                top: '3%'
            };
            
            // Adjust legend position to avoid overlap
            baseOptions.legend = {
                ...baseOptions.legend,
                top: '15%'
            };
            
            // For pie charts, adjust the center position to accommodate title and legend
            if (baseOptions.series && baseOptions.series[0] && 
                (baseOptions.series[0].type === 'pie')) {
                baseOptions.series = baseOptions.series.map(series => ({
                    ...series,
                    center: ['50%', '62%']
                }));
            }
            
            // For radar charts, adjust the center and radius to accommodate title and legend
            if (baseOptions.radar) {
                baseOptions.radar = {
                    ...baseOptions.radar,
                    center: ['50%', '65%'],
                    radius: '60%'
                };
            }
        } else if (baseOptions.title) {
            // Only title, position it at the top
            baseOptions.title = {
                ...baseOptions.title,
                top: '3%'
            };
            
            // For pie charts with title only, center slightly lower
            if (baseOptions.series && baseOptions.series[0] && 
                (baseOptions.series[0].type === 'pie')) {
                baseOptions.series = baseOptions.series.map(series => ({
                    ...series,
                    center: ['50%', '55%']
                }));
            }
            
            // For radar charts with title only, adjust center and radius
            if (baseOptions.radar) {
                baseOptions.radar = {
                    ...baseOptions.radar,
                    center: ['50%', '55%'],
                    radius: '70%'
                };
            }
        } else if (baseOptions.legend) {
            // Only legend, position it at the top
            baseOptions.legend = {
                ...baseOptions.legend,
                top: '5%'
            };
            
            // For radar charts with legend only, adjust center and radius
            if (baseOptions.radar) {
                baseOptions.radar = {
                    ...baseOptions.radar,
                    center: ['50%', '55%'],
                    radius: '70%'
                };
            }
        }
        
        return baseOptions;
    });
</script>

<style scoped>
    .echarts-container {
        border-radius: 8px;
        margin: 20px 0;
        overflow: hidden;
        box-sizing: border-box;
        position: relative;
    }

    .vue-echarts {
        width: 100% !important;
        height: 100% !important;
        min-height: 300px;
    }

    @media (max-width: 768px) {
        .echarts-container {
            margin: 16px 0;
        }

        .vue-echarts {
            min-height: 250px;
        }
    }
</style>
