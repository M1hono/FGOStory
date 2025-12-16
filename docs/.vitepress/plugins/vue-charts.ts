import type MarkdownIt from 'markdown-it';

interface ChartConfig {
    title?: string;
    subtitle?: string;
    width?: string;
    height?: string;
    theme?: string;
    smooth?: boolean;
    legend?: boolean;
    [key: string]: any;
}

/**
 * Parse chart data from markdown content
 */
function parseChartData(content: string, chartType: string): any {
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    switch (chartType) {
        case 'line':
        case 'bar':
        case 'area':
            return parseLineBarData(lines);
        case 'pie':
        case 'doughnut':
            return parsePieData(lines);
        case 'scatter':
            return parseScatterData(lines);
        case 'radar':
            return parseRadarData(lines);
        case 'gauge':
            return parseGaugeData(lines);
        case 'funnel':
            return parseFunnelData(lines);
        case 'heatmap':
            return parseHeatmapData(lines);
        case 'sankey':
            return parseSankeyData(lines);
        case 'graph':
            return parseGraphData(lines);
        // 移除有问题的树类图表
        // case 'tree':
        // case 'treemap': 
        // case 'sunburst':
        //     return parseTreeData(lines);
        case 'candlestick':
        case 'k':
            return parseCandlestickData(lines);
        case 'boxplot':
            return parseBoxplotData(lines);
        case 'parallel':
            return parseParallelData(lines);
        case 'themeRiver':
            return parseThemeRiverData(lines);
        case 'pictorialBar':
            return parsePictorialBarData(lines);
        default:
            return { data: [] };
    }
}

/**
 * Parse line/bar chart data
 */
function parseLineBarData(lines: string[]): any {
    const result: any = {
        categories: [],
        series: []
    };
    
    for (const line of lines) {
        if (line.includes('|')) {
            // Multi-series format: SeriesName | Cat1: Val1, Cat2: Val2, ...
            const [seriesName, dataStr] = line.split('|').map(s => s.trim());
            const dataPoints: any = {};
            const pairs = dataStr.split(',').map(s => s.trim());
            
            for (const pair of pairs) {
                const [cat, val] = pair.split(':').map(s => s.trim());
                dataPoints[cat] = parseFloat(val) || 0;
                if (!result.categories.includes(cat)) {
                    result.categories.push(cat);
                }
            }
            
            result.series.push({
                name: seriesName,
                data: [],
                dataPoints: dataPoints
            });
        } else if (line.includes(':')) {
            // Single series format: Category: Value
            const [cat, val] = line.split(':').map(s => s.trim());
            result.categories.push(cat);
            
            if (result.series.length === 0) {
                result.series.push({ name: 'Series 1', data: [] });
            }
            result.series[0].data.push(parseFloat(val) || 0);
        }
    }
    
    // Fill in data for each series based on all categories
    for (const series of result.series) {
        if (series.dataPoints) {
            series.data = result.categories.map((cat: string) => series.dataPoints[cat] || 0);
            delete series.dataPoints; // Clean up temporary property
        }
    }
    
    return result;
}

/**
 * Parse pie chart data
 */
function parsePieData(lines: string[]): any {
    const data: any[] = [];

    for (const line of lines) {
        if (line.includes(':')) {
            const [name, value] = line.split(':').map(s => s.trim());
            data.push({
                name,
                value: parseFloat(value) || 0
            });
        }
    }
    
    return { data };
}

/**
 * Parse scatter data
 */
function parseScatterData(lines: string[]): any {
    const data: number[][] = [];
    
    for (const line of lines) {
        const values = line.split(',').map(s => parseFloat(s.trim()) || 0);
        if (values.length >= 2) {
            data.push(values);
        }
    }
    
    return { data };
}

/**
 * Parse radar data
 */
function parseRadarData(lines: string[]): any {
    const result: any = {
        indicators: [],
        series: []
    };
    
    // 收集所有指标名称
    const allIndicators = new Set<string>();
    const seriesData = new Map<string, Map<string, number>>();
    
    for (const line of lines) {
        if (line.includes('|')) {
            // 多系列格式: 张三 | 技术: 90, 沟通: 85, 创新: 88
            const [seriesName, dataStr] = line.split('|').map(s => s.trim());
            const dataPoints = new Map<string, number>();
            const pairs = dataStr.split(',').map(s => s.trim());
            
            for (const pair of pairs) {
                const [indicator, val] = pair.split(':').map(s => s.trim());
                allIndicators.add(indicator);
                dataPoints.set(indicator, parseFloat(val) || 0);
            }
            
            seriesData.set(seriesName, dataPoints);
        }
    }
    
    // 转换为最终格式
    result.indicators = Array.from(allIndicators);
    
    for (const [seriesName, dataMap] of seriesData) {
        const values = result.indicators.map((indicator: string) => dataMap.get(indicator) || 0);
        result.series.push({
            name: seriesName,
            value: values
        });
    }
    
    return result;
}

/**
 * Parse gauge data
 */
function parseGaugeData(lines: string[]): any {
    const value = parseFloat(lines[0] || '0') || 0;
    return {
        data: [{
            value,
            name: 'Score'
        }]
    };
}

/**
 * Parse funnel data
 */
function parseFunnelData(lines: string[]): any {
    const data: any[] = [];
    
    for (const line of lines) {
        if (line.includes(':')) {
            const [name, value] = line.split(':').map(s => s.trim());
            data.push({
                name,
                value: parseFloat(value) || 0
            });
        }
    }
    
    return { data };
}

/**
 * Parse heatmap data
 */
function parseHeatmapData(lines: string[]): any {
    const data: number[][] = [];
    
    for (const line of lines) {
        const values = line.split(',').map(s => parseFloat(s.trim()) || 0);
        if (values.length >= 3) {
            data.push(values);
        }
    }
    
    return { data };
}

/**
 * Parse sankey data
 */
function parseSankeyData(lines: string[]): any {
    const nodes = new Set<string>();
    const links: any[] = [];
    
    for (const line of lines) {
        if (line.includes('->')) {
            const [source, rest] = line.split('->').map(s => s.trim());
            const [target, value] = rest.split(':').map(s => s.trim());
            
            nodes.add(source);
            nodes.add(target);
            links.push({ source, target, value: parseFloat(value) || 0 });
        }
    }
    
    return {
        data: Array.from(nodes).map(name => ({ name })),
        links
    };
}

/**
 * Parse graph data
 */
function parseGraphData(lines: string[]): any {
    const nodes = new Set<string>();
    const links: any[] = [];
    
    for (const line of lines) {
        if (line.includes('->') && line.includes(':')) {
            const parts = line.split('->').map(s => s.trim());
            if (parts.length >= 2) {
                const [source, rest] = parts;
                const restParts = rest.split(':').map(s => s.trim());
                if (restParts.length >= 2) {
                    const [target, value] = restParts;
                    
                    nodes.add(source);
                    nodes.add(target);
                    links.push({ 
                        source, 
                        target, 
                        value: parseFloat(value) || 1,
                        lineStyle: {
                            width: Math.max(1, (parseFloat(value) || 1) / 5),
                            color: '#5470c6'
                        }
                    });
                }
            }
        }
    }
    
    return {
        data: Array.from(nodes).map((name, index) => ({ 
            name, 
            symbolSize: 30,
            itemStyle: {
                color: index % 2 === 0 ? '#5470c6' : '#91cc75'
            },
            label: {
                show: true
            }
        })),
        links
    };
}

/**
 * Parse tree data
 */
function parseTreeData(lines: string[]): any {
    const root: any = { name: 'Root', children: [] };
    const stack: any[] = [{ node: root, level: -1 }];
    
    for (const line of lines) {
        const level = line.search(/\S/);
        const content = line.trim();
        
        let name = content;
        let value = 1;
        
        if (content.includes(':')) {
            const parts = content.split(':');
            name = parts[0].trim();
            value = parseFloat(parts[1].trim()) || 1;
        }
        
        const node = { name, value, children: [] };
        
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }
        
        if (stack.length > 0) {
            stack[stack.length - 1].node.children.push(node);
        }
        
        stack.push({ node, level });
    }
    
    return root.children.length > 0 ? root.children[0] : root;
}

/**
 * Parse candlestick data
 */
function parseCandlestickData(lines: string[]): any {
    const data: any[] = [];
    const categories: string[] = [];
    
    for (const line of lines) {
        if (line.includes(':')) {
            const parts = line.split(':').map(s => s.trim());
            if (parts.length >= 2) {
                const [date, values] = parts;
                const vals = values.split(',').map(s => parseFloat(s.trim()) || 0);
                // ECharts K线数据格式: [open, close, lowest, highest]
                if (vals.length >= 4) {
                    const [open, close, low, high] = vals;
                    data.push([open, close, low, high]);
                    categories.push(date);
                }
            }
        }
    }
    
    return { data, categories };
}

/**
 * Parse boxplot data
 */
function parseBoxplotData(lines: string[]): any {
    const data: any[] = [];
    
    for (const line of lines) {
        const values = line.split(',').map(s => parseFloat(s.trim()) || 0);
        if (values.length >= 5) {
            data.push(values);
        }
    }
    
    return { data };
}

/**
 * Parse parallel data
 */
function parseParallelData(lines: string[]): any {
    const data: any[] = [];
    
    for (const line of lines) {
        const values = line.split(',').map(s => parseFloat(s.trim()) || 0);
        data.push(values);
    }
    
    return { data };
}

/**
 * Parse theme river data
 */
function parseThemeRiverData(lines: string[]): any {
    const data: any[] = [];
    
    for (const line of lines) {
        if (line.includes(':') && line.includes(',')) {
            const [dateAndName, value] = line.split(':').map(s => s.trim());
            const parts = dateAndName.split(',').map(s => s.trim());
            if (parts.length >= 2) {
                const [date, name] = parts;
                data.push([date, parseFloat(value) || 0, name]);
            }
        }
    }
    
    return { data };
}

/**
 * Parse pictorial bar data
 */
function parsePictorialBarData(lines: string[]): any {
    const data: any[] = [];
    
    for (const line of lines) {
        if (line.includes(':')) {
            const [name, value] = line.split(':').map(s => s.trim());
            data.push({
                name,
                value: parseFloat(value) || 0
            });
        }
    }
    
    return { data };
}

/**
 * Generate ECharts option from parsed data
 */
function generateChartOption(chartType: string, parsedData: any, config: ChartConfig): any {
    const option: any = {
        animation: true,
        animationDuration: 750
    };
    
    // Add title if provided
    if (config.title) {
        option.title = {
            text: config.title,
            subtext: config.subtitle || '',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        };
    }
    
    // Add tooltip with proper configuration
    if (chartType === 'pie' || chartType === 'doughnut') {
        option.tooltip = {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        };
    } else if (chartType === 'radar') {
        option.tooltip = {
            trigger: 'item'
        };
    } else if (chartType === 'gauge') {
        option.tooltip = {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c}%'
        };
    } else {
        option.tooltip = {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        };
    }
    
    // Add grid for axis-based charts
    if (['line', 'bar', 'area', 'scatter'].includes(chartType)) {
        option.grid = {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: config.title ? '22%' : '8%',
            containLabel: true
        };
    }
    
    // Generate series based on chart type
    switch (chartType) {
        case 'line':
        case 'bar':
            option.xAxis = { 
                type: 'category', 
                data: parsedData.categories || [],
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.yAxis = { 
                type: 'value',
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.series = (parsedData.series || []).map((s: any) => ({
                name: s.name,
                data: s.data,
                type: chartType,
                smooth: config.smooth || false
            }));
            break;
            
        case 'area':
            option.xAxis = { 
                type: 'category', 
                data: parsedData.categories || [],
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.yAxis = { 
                type: 'value',
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.series = (parsedData.series || []).map((s: any) => ({
                name: s.name,
                data: s.data,
                type: 'line',
                areaStyle: {},
                smooth: config.smooth || false
            }));
            break;
            
        case 'pie':
        case 'doughnut':
            option.series = [{
                name: config.title || '数据分布',
                type: 'pie',
                radius: chartType === 'doughnut' ? ['40%', '70%'] : '50%',
                data: parsedData.data
            }];
            break;
            
        case 'scatter':
            option.xAxis = { 
                type: 'value',
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.yAxis = { 
                type: 'value',
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.series = [{
                name: '散点',
                type: 'scatter',
                data: parsedData.data,
                symbolSize: 8
            }];
            break;
            
        case 'radar':
            if (parsedData.indicators && parsedData.series) {
                const allValues = parsedData.series.flatMap((s: any) => s.value);
                const maxValue = Math.max(...allValues) * 1.2;
                
                option.radar = {
                    indicator: parsedData.indicators.map((name: string) => ({
                        name,
                        max: maxValue
                    }))
                };
                option.series = [{
                    type: 'radar',
                    data: parsedData.series
                }];
            }
            break;
            
        case 'gauge':
            option.series = [{
                type: 'gauge',
                data: parsedData.data
            }];
            break;
            
        case 'funnel':
            option.series = [{
                type: 'funnel',
                data: parsedData.data ? parsedData.data.sort((a: any, b: any) => b.value - a.value) : []
            }];
            break;
            
        case 'heatmap':
            // Extract unique x and y values
            const xValues = parsedData.data ? [...new Set(parsedData.data.map((d: any) => d[0]))].sort() : [];
            const yValues = parsedData.data ? [...new Set(parsedData.data.map((d: any) => d[1]))].sort() : [];
            
            option.xAxis = { 
                type: 'category',
                data: xValues,
                splitArea: {
                    show: true
                }
            };
            option.yAxis = { 
                type: 'category',
                data: yValues,
                splitArea: {
                    show: true
                }
            };
            option.visualMap = {
                min: 0,
                max: parsedData.data && parsedData.data.length > 0 ? Math.max(...parsedData.data.map((d: any) => d[2])) : 100,
                calculable: true,
                orient: 'vertical',
                left: 'left',
                top: 'center'
            };
            option.series = [{
                name: '热力图',
                type: 'heatmap',
                data: parsedData.data,
                label: {
                    show: true
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }];
            break;
            
        case 'sankey':
            option.series = [{
                type: 'sankey',
                data: parsedData.data,
                links: parsedData.links
            }];
            break;
            
        case 'graph':
            option.series = [{
                type: 'graph',
                layout: 'force',
                data: parsedData.data,
                links: parsedData.links,
                roam: true,
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{b}'
                },
                force: {
                    repulsion: 100,
                    gravity: 0.05,
                    edgeLength: 30,
                    layoutAnimation: true
                },
                draggable: true,
                focusNodeAdjacency: true,
                emphasis: {
                    lineStyle: {
                        width: 3
                    }
                }
            }];
            break;
            
        // 移除有问题的树类图表
        // case 'tree':
        // case 'treemap':
        // case 'sunburst':
        //     break;
            
        case 'candlestick':
        case 'k':
            option.xAxis = { 
                type: 'category',
                data: parsedData.categories || [],
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.yAxis = { 
                type: 'value',
                scale: true,
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.series = [{
                name: 'K线',
                type: 'candlestick',
                data: parsedData.data,
                itemStyle: {
                    color: '#ef232a',
                    color0: '#14b143',
                    borderColor: '#ef232a',
                    borderColor0: '#14b143'
                },
                emphasis: {
                    itemStyle: {
                        color: 'black',
                        color0: '#444',
                        borderColor: 'black',
                        borderColor0: '#444'
                    }
                }
            }];
            break;
            
        case 'boxplot':
            option.xAxis = { type: 'category' };
            option.yAxis = { type: 'value' };
            option.series = [{
                type: 'boxplot',
                data: parsedData.data
            }];
            break;
            
        case 'parallel':
            option.parallelAxis = (parsedData.data && parsedData.data[0]) ? parsedData.data[0].map((_: any, i: number) => ({
                dim: i,
                name: `Axis ${i + 1}`
            })) : [];
            option.series = [{
                type: 'parallel',
                data: parsedData.data
            }];
            break;
            
        case 'themeRiver':
            option.singleAxis = { type: 'time' };
            option.series = [{
                type: 'themeRiver',
                data: parsedData.data
            }];
            break;
            
        case 'pictorialBar':
            option.xAxis = { 
                type: 'category', 
                data: parsedData.categories || parsedData.data?.map((d: any) => d.name) || [],
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.yAxis = { 
                type: 'value',
                axisLabel: { show: true },
                axisTick: { show: true }
            };
            option.series = [{
                name: '人口',
                type: 'pictorialBar',
                data: (parsedData.series && parsedData.series[0]?.data) || parsedData.data?.map((d: any) => d.value) || [],
                symbol: 'path://M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z', // 人形图标
                symbolSize: [20, 30],
                symbolRepeat: true,
                symbolMargin: '10%',
                z: 10,
                itemStyle: {
                    color: '#5470c6'
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}'
                }
            }];
            break;
    }
    
    // Add legend if multiple series or explicitly requested
    // For radar charts, also show legend if there are multiple data items in a single series
    const shouldShowLegend = (option.series && option.series.length > 1) || 
                            config.legend ||
                            (chartType === 'radar' && option.series && option.series[0] && 
                             option.series[0].data && option.series[0].data.length > 1);
    
    if (shouldShowLegend) {
        let legendData: string[] = [];
        
        if (chartType === 'radar' && option.series && option.series[0] && option.series[0].data) {
            // For radar charts, use the names from the data items
            legendData = option.series[0].data.map((item: any) => item.name).filter(Boolean);
        } else {
            // For other charts, use series names
            legendData = option.series ? option.series.map((s: any) => s.name).filter(Boolean) : [];
        }
        
        option.legend = {
            top: config.title ? '15%' : '5%',
            left: 'center',
            data: legendData
        };
    }
    
    // Apply additional config (but preserve title structure)
    const titleBackup = option.title;
    Object.assign(option, config);
    
    // Restore title if it was overwritten by config
    if (titleBackup && typeof config.title === 'string') {
        option.title = titleBackup;
    }
    
    return option;
}

/**
 * Vue Charts plugin for markdown-it
 */
export const vueCharts = (md: MarkdownIt) => {
    const marker = ':::';
    const markerLen = marker.length;
    
    // Parser rule
    md.block.ruler.before('fence', 'chart', (state, startLine, endLine, silent) => {
        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        
        if (pos + markerLen > max) return false;
        
        const markerChars = state.src.slice(pos, pos + markerLen);
        if (markerChars !== marker) return false;
        
        pos += markerLen;
        
        // Check for chart type
        const match = state.src.slice(pos, max).match(/^\s*chart\s+(\w+)(?:\s+(.*))?$/);
        if (!match) return false;
        
        const chartType = match[1];
        const configStr = match[2] || '{}';
        
        // Parse config
        let config: ChartConfig = {};
        try {
            config = JSON.parse(configStr);
        } catch (e) {
            // Use default config on parse error
            config = {};
        }
        
        if (silent) return true;
        
        let nextLine = startLine;
        let content = '';
        
        // Find closing marker
        while (nextLine < endLine) {
            nextLine++;
            if (nextLine >= endLine) break;
            
            pos = state.bMarks[nextLine] + state.tShift[nextLine];
            const lineMax = state.eMarks[nextLine];
            
            if (state.src.slice(pos, pos + markerLen) === marker) {
                break;
            }
            
            content += state.src.slice(pos, lineMax) + '\n';
        }
        
        // Parse chart data
        const parsedData = parseChartData(content, chartType);
        const chartOption = generateChartOption(chartType, parsedData, config);
        
        // Create token
        const token = state.push('chart', 'div', 0);
        token.markup = marker;
        token.block = true;
        token.info = chartType;
        token.map = [startLine, nextLine + 1];
        token.meta = { 
            chartType,
            config,
            option: chartOption
        };
        
        state.line = nextLine + 1;
        return true;
    });
    
    // Renderer
    md.renderer.rules.chart = (tokens, idx) => {
        const token = tokens[idx];
        const { config, option } = token.meta;
        
        const width = config.width || '100%';
        const height = config.height || '400px';
        const theme = config.theme || 'auto';
        
        // Convert option to a JSON string and escape for HTML
        const optionJson = JSON.stringify(option);
        const escapedOption = optionJson
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
        
        // Return VChart component with inline props
        return `<VChart :options='${escapedOption}' width="${width}" height="${height}" theme="${theme}" :auto-resize="true" class="markdown-chart" />`;
    };
};
