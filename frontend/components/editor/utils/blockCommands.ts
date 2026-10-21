import { $createParagraphNode, $getNodeByKey, $getSelection, $isRangeSelection, $isRootOrShadowRoot, type LexicalEditor, type NodeKey } from 'lexical';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $insertList, $isListNode, $removeList } from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createCalloutNode, $isCalloutNode } from '../nodes/CalloutNode';
import { $isCollapsibleContainerNode, $isCollapsibleContentNode, $isCollapsibleTitleNode } from '../nodes/CollapsibleNode';
import { $resolveActionableBlock, $wrapBlockAsToggle } from './blockTransforms';

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'check' | 'bullet' | 'number' | 'toggle' | 'code' | 'quote' | 'callout';
export const BLOCK_OPTIONS: { type: BlockType; label: string; description: string; keywords: string[]; shortcut?: string }[] = [
  { type: 'paragraph', label: 'Text', description: 'A plain paragraph', keywords: ['paragraph', 'plain', '文字', '段落'], shortcut: 'Mod Alt 0' },
  { type: 'h1', label: 'Heading 1', description: 'A large section heading', keywords: ['title', 'large', '標題'], shortcut: 'Mod Alt 1' },
  { type: 'h2', label: 'Heading 2', description: 'A medium section heading', keywords: ['subtitle', 'medium', '標題'], shortcut: 'Mod Alt 2' },
  { type: 'h3', label: 'Heading 3', description: 'A small section heading', keywords: ['small', '標題'], shortcut: 'Mod Alt 3' },
  { type: 'check', label: 'To-do List', description: 'Track tasks with checkboxes', keywords: ['todo', 'task', 'checklist', 'checkbox', '待辦', '任務'], shortcut: 'Mod Alt 4' },
  { type: 'bullet', label: 'Bullet List', description: 'A simple bulleted list', keywords: ['ul', 'unordered', 'point', '清單'], shortcut: 'Mod Alt 5' },
  { type: 'number', label: 'Numbered List', description: 'A list with ordered steps', keywords: ['ol', 'ordered', 'steps', '序號'], shortcut: 'Mod Alt 6' },
  { type: 'toggle', label: 'Toggle List', description: 'A heading with collapsible content', keywords: ['collapse', 'details', 'expand', '折疊'], shortcut: 'Mod Alt 7' },
  { type: 'code', label: 'Code Block', description: 'A block for code snippets', keywords: ['snippet', 'pre', '程式碼'], shortcut: 'Mod Alt 8' },
  { type: 'quote', label: 'Quote', description: 'Give a passage some emphasis', keywords: ['blockquote', 'citation', '引用'], shortcut: 'Mod Alt 9' },
  { type: 'callout', label: 'Callout', description: 'Draw attention to a thought', keywords: ['note', 'tip', 'info', '提示'] },
];

/** Runs inside an editor update; use Lexical's list operations to preserve list structure. */
export function $applyBlockType(type: BlockType): boolean {
  let selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;
  // A toggle title is structural, not a normal paragraph that can be replaced.
  let ancestor = selection.anchor.getNode();
  while (!$isRootOrShadowRoot(ancestor)) {
    if ($isCollapsibleTitleNode(ancestor)) return false;
    const parent = ancestor.getParent();
    if (!parent) break;
    ancestor = parent;
  }
  if (type === 'bullet' || type === 'number' || type === 'check') { $insertList(type); return true; }
  $removeList();
  selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;
  if (type === 'toggle') {
    const block = $resolveActionableBlock(selection.anchor.getNode());
    if (!block) return false;
    $wrapBlockAsToggle(block.getKey());
    return true;
  }
  $setBlocksType(selection, () => {
    if (type === 'h1' || type === 'h2' || type === 'h3') return $createHeadingNode(type);
    if (type === 'code') return $createCodeNode();
    if (type === 'quote') return $createQuoteNode();
    if (type === 'callout') return $createCalloutNode();
    return $createParagraphNode();
  });
  return true;
}

export function $getSelectionBlockType(): BlockType {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return 'paragraph';
  let node = selection.anchor.getNode();
  while (!$isRootOrShadowRoot(node)) {
    if ($isListNode(node)) return node.getListType();
    if ($isHeadingNode(node)) { const tag = node.getTag(); return tag === 'h1' || tag === 'h2' || tag === 'h3' ? tag : 'h3'; }
    if ($isCodeNode(node)) return 'code';
    if ($isQuoteNode(node)) return 'quote';
    if ($isCalloutNode(node)) return 'callout';
    if ($isCollapsibleTitleNode(node) || $isCollapsibleContainerNode(node)) return 'toggle';
    const parent = node.getParent();
    if (!parent || $isCollapsibleContentNode(parent)) break;
    node = parent;
  }
  return 'paragraph';
}

export function filterBlockOptions<T extends { title: string; keywords: string[] }>(options: T[], query: string | null): T[] {
  const words = (query ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return words.length ? options.filter(option => words.every(word => `${option.title} ${option.keywords.join(' ')}`.toLocaleLowerCase().includes(word))) : options;
}

export function applyBlockTypeToNode(editor: LexicalEditor, key: NodeKey, type: BlockType) {
  editor.update(() => {
    const node = $getNodeByKey(key);
    if (!node) return;
    const target = $resolveActionableBlock(node);
    if (!target || $isCollapsibleContainerNode(target)) return;
    target.selectStart();
    $applyBlockType(type);
  });
}
