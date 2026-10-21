/** Extract user-visible text from Lexical state without exposing serialization in previews. */
export function noteText(content: string): string {
    if (!content.trim().startsWith('{')) return content;
    try {
        const state = JSON.parse(content);
        if (!Array.isArray(state.root?.children)) return content;
        const collect = (node: { text?: string; type?: string; children?: unknown[] }): string => {
            if (typeof node.text === 'string') return node.text;
            if (node.type === 'linebreak') return '\n';
            return (node.children ?? []).map(child => collect(child as typeof node)).join(node.type === 'tablerow' ? '\t' : ['root', 'list', 'table', 'tablecell', 'collapsible-container', 'collapsible-content'].includes(node.type ?? '') ? '\n' : '');
        };
        return collect({ ...state.root, type: 'root' });
    } catch { return content; }
}
