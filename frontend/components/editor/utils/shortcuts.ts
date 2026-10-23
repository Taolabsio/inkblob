import type { BlockType } from './blockCommands';
export type EditorShortcut = { kind: 'block'; type: BlockType } | { kind: 'format'; format: 'code' | 'strikethrough' } | { kind: 'link' };
export function getEditorShortcut(event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'code' | 'key' | 'isComposing'>): EditorShortcut | null {
  if (event.isComposing || !(event.metaKey || event.ctrlKey)) return null;
  if (event.altKey && !event.shiftKey && /^Digit[0-9]$/.test(event.code)) {
    const blocks: BlockType[] = ['paragraph', 'h1', 'h2', 'h3', 'check', 'bullet', 'number', 'toggle', 'code', 'quote'];
    return { kind: 'block', type: blocks[Number(event.code.slice(-1))] };
  }
  if (event.altKey) return null;
  if (!event.shiftKey && event.key.toLowerCase() === 'e') return { kind: 'format', format: 'code' };
  if (event.shiftKey && event.key.toLowerCase() === 'x') return { kind: 'format', format: 'strikethrough' };
  if (event.shiftKey && event.key.toLowerCase() === 'k') return { kind: 'link' };
  return null;
}
