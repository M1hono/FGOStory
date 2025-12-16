import MarkdownIt from 'markdown-it';

/**
 * @function withMarkmap
 * @description VitePress plugin to add markmap support for ```markmap code blocks
 */
export function withMarkmap(md: MarkdownIt) {
  const defaultFenceRender = md.renderer.rules.fence!;
  
  md.renderer.rules.fence = (tokens, idx, _options, env, self) => {
    const token = tokens[idx];
    const lang = token.info.trim() || 'text';

    if (lang === 'markmap') {
      return `
        <ClientOnly>
          <MarkMapView markdown="${encodeURIComponent(token.content)}" />
        </ClientOnly>
      `;
    }

    return defaultFenceRender(tokens, idx, _options, env, self);
  };
}

export default withMarkmap; 