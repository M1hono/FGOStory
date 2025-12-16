import { createContainerPlugin } from './container-plugin-factory';
import type { PluginSimple } from "markdown-it";

/**
 * Chart Grid Plugin - Optimized for Vue Charts
 * Uses the fixed container plugin factory
 */
const chartGridPlugin = createContainerPlugin({
    name: 'chart-grid',
    component: 'div',
    defaultConfig: {
        columns: 2,
        gap: "24px",
        responsive: true,
        equalHeight: true,
        minHeight: "300px"
    },
    configMapping: {
        __fullConfig: (config: any) => {
            
            const styles = [
                'display: grid',
                `grid-template-columns: repeat(${config.columns || 2}, 1fr)`,
                `gap: ${config.gap || '24px'}`,
                'margin: 20px 0',
                'align-items: stretch'
            ];
            
            if (config.minHeight) {
                styles.push(`min-height: ${config.minHeight}`);
            }
            
            const className = config.responsive ? 'chart-grid chart-grid-responsive' : 'chart-grid';
            
            return ` style="${styles.join('; ')}" class="${className}"`;
        }
    }
});

/**
 * Table Grid Plugin - For mixed content layouts
 */
const tableGridPlugin = createContainerPlugin({
    name: 'table-grid', 
    component: 'div',
    defaultConfig: {
        columns: 2,
        gap: "20px",
        responsive: true
    },
    configMapping: {
        __fullConfig: (config: any) => {
            const styles = [
                'display: grid',
                `grid-template-columns: repeat(${config.columns || 2}, 1fr)`,
                `gap: ${config.gap || '20px'}`,
                'margin: 20px 0'
            ];
            
            const className = config.responsive ? 'table-grid table-grid-responsive' : 'table-grid';
            
            return ` style="${styles.join('; ')}" class="${className}"`;
        }
    }
});

// Export wrapper function that registers both plugins
export const chartGrid: PluginSimple = (md) => {
    chartGridPlugin(md);
    tableGridPlugin(md);
};