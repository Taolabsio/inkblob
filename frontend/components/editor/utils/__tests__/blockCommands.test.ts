import { describe, expect, it } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { EditorNodes } from '../../nodes';
import { $applyBlockType, $getSelectionBlockType, applyBlockTypeToNode, filterBlockOptions, type BlockType } from '../blockCommands';
import { $isCollapsibleContainerNode, $isCollapsibleContentNode } from '../../nodes/CollapsibleNode';
import { noteText } from '../../../../utils/noteText';

function setup() {
  const editor = createEditor({ nodes: EditorNodes, onError: error => { throw error; } });
  editor.update(() => { const p = $createParagraphNode().append($createTextNode('A thought to keep')); $getRoot().append(p); p.selectEnd(); }, { discrete: true });
  return editor;
}
describe('shared block commands', () => {
  it.each<BlockType>(['h1', 'h2', 'h3', 'quote', 'code', 'callout', 'bullet', 'number', 'check', 'toggle'])('preserves text when converting to %s', type => {
    const editor = setup();
    editor.update(() => { expect($applyBlockType(type)).toBe(true); }, { discrete: true });
    expect(editor.getEditorState().read(() => $getRoot().getTextContent().trim())).toBe('A thought to keep');
    expect(editor.getEditorState().read($getSelectionBlockType)).toBe(type);
    const reloaded = createEditor({ nodes: EditorNodes, onError: error => { throw error; } });
    reloaded.setEditorState(reloaded.parseEditorState(editor.getEditorState().toJSON()));
    expect(reloaded.getEditorState().read(() => $getRoot().getTextContent().trim())).toBe('A thought to keep');
  });
  it('keeps checklist completion through a JSON round-trip', () => {
    const editor = setup();
    editor.update(() => {
      $applyBlockType('check');
      const list = $getRoot().getFirstChild();
      expect($isListNode(list) && list.getListType()).toBe('check');
      const item = $isListNode(list) ? list.getFirstChild() : null;
      if (!$isListItemNode(item)) throw new Error('Expected a checklist item');
      item.setChecked(true);
    }, { discrete: true });
    const reloaded = createEditor({ nodes: EditorNodes });
    reloaded.setEditorState(reloaded.parseEditorState(editor.getEditorState().toJSON()));
    expect(reloaded.getEditorState().read(() => { const list = $getRoot().getFirstChild(); const item = $isListNode(list) ? list.getFirstChild() : null; return $isListItemNode(item) && item.getChecked(); })).toBe(true);
  });
  it('turns lists into plain text without losing their contents', () => {
    const editor = setup();
    editor.update(() => { $applyBlockType('check'); }, { discrete: true });
    editor.update(() => { $applyBlockType('paragraph'); }, { discrete: true });
    expect(editor.getEditorState().read(() => [$getRoot().getFirstChild()?.getType(), $getRoot().getTextContent()])).toEqual(['paragraph', 'A thought to keep']);
  });
  it('does not replace a toggle title with an invalid structural node', () => {
    const editor = setup();
    editor.update(() => { $applyBlockType('toggle'); }, { discrete: true });
    editor.update(() => { expect($applyBlockType('h1')).toBe(false); }, { discrete: true });
    expect(editor.getEditorState().read(() => $getRoot().getFirstChild()?.getType())).toBe('collapsible-container');
  });
  it('converts a nested body paragraph without replacing its enclosing toggle', async () => {
    const editor = setup(); let key = '';
    editor.update(() => {
      $applyBlockType('toggle');
      const container = $getRoot().getFirstChild();
      if (!$isCollapsibleContainerNode(container)) throw new Error('Expected a toggle');
      const content = container.getLastChild();
      if (!$isCollapsibleContentNode(content)) throw new Error('Expected toggle content');
      key = content.getFirstChild()!.getKey();
    }, { discrete: true });
    applyBlockTypeToNode(editor, key, 'h2'); await Promise.resolve();
    expect(editor.getEditorState().read(() => { const container = $getRoot().getFirstChild(); const content = $isCollapsibleContainerNode(container) ? container.getLastChild() : null; return [container?.getType(), $isCollapsibleContentNode(content) && content.getFirstChild()?.getType()]; })).toEqual(['collapsible-container', 'heading']);
  });
  it('filters slash options by all query words and aliases', () => {
    const options = [{ title: 'To-do List', keywords: ['todo', 'task', '待辦'] }, { title: 'Heading 2', keywords: ['h2', 'title'] }];
    expect(filterBlockOptions(options, 'todo')).toEqual([options[0]]);
    expect(filterBlockOptions(options, '待辦')).toEqual([options[0]]);
    expect(filterBlockOptions(options, 'heading 2')).toEqual([options[1]]);
    expect(filterBlockOptions(options, 'heading task')).toEqual([]);
    expect(filterBlockOptions(options, '')).toHaveLength(2);
  });
  it('separates task items and table cells in note text', () => {
    expect(noteText(JSON.stringify({ root: { children: [{ type: 'list', children: [{ type: 'listitem', children: [{ text: 'First task' }] }, { type: 'listitem', children: [{ text: 'Next task' }] }] }] } }))).toBe('First task\nNext task');
    expect(noteText(JSON.stringify({ root: { children: [{ type: 'table', children: [{ type: 'tablerow', children: [{ type: 'tablecell', children: [{ type: 'paragraph', children: [{ text: 'Name' }] }] }, { type: 'tablecell', children: [{ type: 'paragraph', children: [{ text: 'Value' }] }] }] }] }] } }))).toBe('Name\tValue');
  });
});
