import type MarkdownIt from "markdown-it";
import type { MarkdownItShikiOptions } from "@shikijs/markdown-it";
import type { Highlighter } from "shiki";
import { codeToKeyedTokens } from "shiki-magic-move/core";

const reMagicMoveBlock =
    /^:::magic-move(?:[ ]*(\{.*?\})?([^\n]*?))?\n([\s\S]+?)^:::$/mg;
const reCodeBlock =
    /^```([\w'-]+?)(?:\s*\[([^\]]*)\])?(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?(.*?))?\n([\s\S]+?)^```$/mg;

const magicMoveFilenames = new Set<string>();

export function normalizeRangeStr(rangeStr = "") {
    return !rangeStr.trim()
        ? []
        : rangeStr
                .trim()
                .split(/\|/g)
                .map((i) => i.trim());
}

export function getMagicMoveFilenames(): string[] {
    return Array.from(magicMoveFilenames);
}

async function MagicMovePlugin(md: MarkdownIt, shiki: Highlighter) {
    md.block.ruler.before(
        "fence",
        "magic-move",
        (state, startLine, endLine, silent) => {
            const start = state.bMarks[startLine] + state.tShift[startLine];
            const max = state.eMarks[startLine];
            if (state.src.slice(start, max).startsWith(":::magic-move")) {
                const [containerBlock = ""] =
                    state.src.slice(start).match(reMagicMoveBlock) || [];
                const matches = Array.from(
                    containerBlock.matchAll(reCodeBlock)
                );
                if (!matches.length)
                    throw new Error(
                        "Magic Move block must contain at least one code block"
                    );

                const ranges = matches.map((i) => normalizeRangeStr(i[3]));
                const steps = matches.map((i) => {
                    const fileName = i[2] || i[1];
                    
                    if (fileName) {
                        magicMoveFilenames.add(fileName);
                    }
                    
                    return {
                        ...codeToKeyedTokens(shiki, i[6].trimEnd(), {
                            lang: i[1] as any,
                            themes: {
                                dark: "github-dark",
                                light: "github-light",
                            },
                        } as unknown as MarkdownItShikiOptions),
                        fileName,
                    };
                });

                const token = state.push("magic-move_open", "div", 1);
                token.meta = {
                    stepsLz: encodeURIComponent(JSON.stringify(steps)),
                };
                state.push("magic-move_close", "div", -1);

                state.line = startLine + containerBlock.split("\n").length;
                return true;
            }
            return false;
        }
    );

    function renderDefault(tokens: any[], idx: number) {
        if (tokens[idx].nesting === 1) {
            const { stepsLz } = tokens[idx].meta;
            
            const steps = JSON.parse(decodeURIComponent(stepsLz));
            const filenameElements = steps
                .map((step: any) => step.fileName)
                .filter(Boolean)
                .map((filename: string) => `<span data-title="${filename}" style="display:none;"></span>`)
                .join('');
            
            return `${filenameElements}<MagicMoveContainer steps-lz="${stepsLz}" />`;
        }
        return "";
    }

    md.renderer.rules["magic-move_open"] = renderDefault;
    md.renderer.rules["magic-move_close"] = renderDefault;
}

export default MagicMovePlugin;