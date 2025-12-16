import type { PluginSimple } from "markdown-it";
import type MarkdownIt from "markdown-it";

/**
 * Escapes attribute values to be safely used in HTML.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
function escapeAttr(str: any): string {
    if (str === null || str === undefined) return "";
    return String(str).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

export const containerConfigMappers = {
    /**
     * Maps a config value to a Vue prop using dynamic binding for all types.
     * @param {string} key The name of the prop.
     */
    prop: (key: string) => (value: any) => {
        if (typeof value === 'string') {
            return ` ${key}="${escapeAttr(value)}"`;
        } else if (typeof value === 'boolean') {
            return ` :${key}="${value}"`;
        } else if (typeof value === 'number') {
            return ` :${key}="${value}"`;
        } else {
            return ` :${key}="${escapeAttr(String(value))}"`;
        }
    },
    /**
     * Maps a config value to a static HTML attribute.
     * @param {string} key The name of the attribute.
     */
    attr: (key: string) => (value: string) => ` ${key}="${escapeAttr(value)}"`,
};

/**
 * Configuration for a container-based plugin.
 */
interface ContainerPluginConfig {
    /** Name of the plugin/container, used in ::: name */
    name: string;
    /** The Vue component to render for the container */
    component: string;
    /** Declarative mapping of JSON config keys to component props */
    configMapping?: Record<string, (value: any) => string>;
    /** Default values for the configuration */
    defaultConfig?: Record<string, any>;
}

/**
 * Creates a markdown-it plugin for a custom container that renders a Vue component.
 * This is a custom implementation that preserves configuration properly.
 * @param {ContainerPluginConfig} pluginConfig The configuration for the plugin.
 * @returns {PluginSimple} A markdown-it plugin.
 */
export function createContainerPlugin(pluginConfig: ContainerPluginConfig): PluginSimple {
    return (md: MarkdownIt) => {
        const { name, component, configMapping = {}, defaultConfig = {} } = pluginConfig;
        
        md.block.ruler.before('paragraph', `container_${name}`, (state, start, end, silent) => {
            let pos = state.bMarks[start] + state.tShift[start];
            const max = state.eMarks[start];
            
            // Count consecutive colons
            let colonCount = 0;
            while (pos + colonCount < max && state.src[pos + colonCount] === ':') {
                colonCount++;
            }
            
            // Need at least 3 colons
            if (colonCount < 3) return false;
            
            const marker = ':'.repeat(colonCount);
            const markerLen = marker.length;
            
            pos += markerLen;
            
            let info = state.src.slice(pos, max).trim();
            
            if (!info.startsWith(name)) return false;
            
            const configPart = info.slice(name.length).trim();
            let config = { ...defaultConfig };
            
            if (configPart && configPart.startsWith('{')) {
                try {
                    config = { ...defaultConfig, ...JSON.parse(configPart) };
                } catch (e) {
                    console.error(`[${name}] Invalid JSON config:`, configPart);
                }
            }
            
            if (silent) return true;
            
            let nextLine = start;
            let autoClosed = false;
            
            while (nextLine < end) {
                nextLine++;
                if (nextLine >= end) break;
                
                pos = state.bMarks[nextLine] + state.tShift[nextLine];
                const max = state.eMarks[nextLine];
                
                if (pos < max && state.sCount[nextLine] < state.blkIndent) {
                    break;
                }
                
                // Check for matching closing marker (same number of colons)
                const closingColonCount = (state.src.slice(pos).match(/^:+/) || [''])[0].length;
                if (closingColonCount === colonCount) {
                    autoClosed = true;
                    break;
                }
            }
            
            const oldParent = state.parentType;
            const oldLineMax = state.lineMax;
            state.parentType = 'blockquote';
            
            const tokenOpen = state.push(`container_${name}_open`, 'div', 1);
            tokenOpen.markup = marker;
            tokenOpen.block = true;
            tokenOpen.info = info;
            tokenOpen.map = [start, nextLine];
            
            tokenOpen.meta = { config };
            
            state.lineMax = nextLine;

            state.md.block.tokenize(state, start + 1, nextLine);
            
            state.lineMax = oldLineMax;
            state.parentType = oldParent;
            
            const tokenClose = state.push(`container_${name}_close`, 'div', -1);
            tokenClose.markup = marker;
            tokenClose.block = true;
            
            if (autoClosed) {
                nextLine++;
            }
            
            state.line = nextLine;
            return true;
        });
        
        md.renderer.rules[`container_${name}_open`] = (tokens, idx) => {
            const token = tokens[idx];
            const config = token.meta?.config || defaultConfig;
            
            let parsedConfigString = "";
            let classNames: string[] = [];
            let stylesArray: string[] = [];
            
            // Special handling for __fullConfig mapper that gets the entire config
            if (configMapping.__fullConfig) {
                const fullConfigResult = configMapping.__fullConfig(config);
                parsedConfigString += fullConfigResult;
            } else {
                // Standard per-key mapping
                for (const [key, mapper] of Object.entries(configMapping)) {
                    if (config[key] !== undefined) {
                        const propString = mapper(config[key]);
                        
                        const classMatch = propString.match(/class="([^"]*)"/);
                        if (classMatch) {
                            classNames.push(classMatch[1]);
                            parsedConfigString += propString.replace(/class="[^"]*"/, '');
                        } else if (propString.includes('style="')) {
                            const styleMatch = propString.match(/style="([^"]*)"/);
                            if (styleMatch) {
                                stylesArray.push(styleMatch[1]);
                            }
                        } else {
                            parsedConfigString += propString;
                        }
                    }
                }
                
                // Combine all styles into one style attribute
                if (stylesArray.length > 0) {
                    parsedConfigString += ` style="${stylesArray.join('; ')}"`;
                }
            }
            
            if (classNames.length > 0) {
                parsedConfigString += ` class="${classNames.join(' ')}"`;
            }
            
            return `<${component}${parsedConfigString}>`;
        };
        
        md.renderer.rules[`container_${name}_close`] = () => {
            return `</${component}>`;
        };
    };
}