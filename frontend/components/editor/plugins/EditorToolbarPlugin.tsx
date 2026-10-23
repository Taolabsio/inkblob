import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, $getRoot, $getSelection, $insertNodes, $isRangeSelection, $setSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, FORMAT_TEXT_COMMAND, KEY_DOWN_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, type RangeSelection, type TextFormatType } from 'lexical';
import { $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isCodeNode, getCodeLanguageOptions, normalizeCodeLanguage, registerCodeHighlighting } from '@lexical/code';
import { mergeRegister } from '@lexical/utils';
import { Bold, Code, Italic, Keyboard, Link, Redo2, Strikethrough, Underline, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../../Modal';
import { LinkEditPopover } from '../ui/LinkEditPopover';
import { $applyBlockType, $getSelectionBlockType, BLOCK_OPTIONS, type BlockType } from '../utils/blockCommands';
import { getEditorShortcut } from '../utils/shortcuts';

const formats = [
  { type: 'bold', label: 'Bold', shortcut: 'Mod B', Icon: Bold },
  { type: 'italic', label: 'Italic', shortcut: 'Mod I', Icon: Italic },
  { type: 'underline', label: 'Underline', shortcut: 'Mod U', Icon: Underline },
  { type: 'strikethrough', label: 'Strikethrough', shortcut: 'Mod Shift X', Icon: Strikethrough },
  { type: 'code', label: 'Inline code', shortcut: 'Mod E', Icon: Code },
] as const;
const codeLanguages = getCodeLanguageOptions();

export default function EditorToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const selectionRef = useRef<RangeSelection | null>(null);
  const linkUrl = useRef<string | null>(null);
  const linkButton = useRef<HTMLButtonElement>(null);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [language, setLanguage] = useState('plain');
  const [linkPosition, setLinkPosition] = useState<{ top: number; left: number } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const openLink = useCallback(() => {
    const rect = linkButton.current?.getBoundingClientRect();
    if (rect) setLinkPosition({ top: rect.bottom + 7, left: rect.left });
  }, []);
  const update = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    selectionRef.current = selection.clone();
    setBlockType($getSelectionBlockType());
    setActiveFormats(new Set(formats.filter(format => selection.hasFormat(format.type)).map(format => format.type)));
    const anchor = selection.anchor.getNode();
    const parent = anchor.getParent();
    const link = $isLinkNode(anchor) ? anchor : $isLinkNode(parent) ? parent : null;
    linkUrl.current = link?.getURL() ?? null;
    setIsLink(!!link);
    let node = anchor;
    while (node.getParent() && !$isCodeNode(node)) node = node.getParent()!;
    setLanguage($isCodeNode(node) ? normalizeCodeLanguage(node.getLanguage() ?? 'plain') : 'plain');
  }, []);
  useEffect(() => {
    editor.getEditorState().read(update);
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(update)),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { update(); return false; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(CAN_UNDO_COMMAND, value => { setCanUndo(value); return false; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(CAN_REDO_COMMAND, value => { setCanRedo(value); return false; }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DOWN_COMMAND, event => {
        const action = getEditorShortcut(event);
        if (!action) return false;
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;
        event.preventDefault();
        if (action.kind === 'block') $applyBlockType(action.type);
        else if (action.kind === 'format') editor.dispatchCommand(FORMAT_TEXT_COMMAND, action.format);
        else openLink();
        return true;
      }, COMMAND_PRIORITY_HIGH),
      registerCodeHighlighting(editor),
    );
  }, [editor, update, openLink]);
  const restore = (run: () => void) => {
    editor.update(() => {
      if (selectionRef.current) $setSelection(selectionRef.current.clone());
      else $getRoot().selectEnd();
      run();
    });
    editor.focus();
  };
  return <>
    <div className="format-toolbar" role="toolbar" aria-label="Formatting tools">
      <select aria-label="Block type" value={blockType} onChange={event => restore(() => { $applyBlockType(event.target.value as BlockType); })}>
        {BLOCK_OPTIONS.map(option => <option key={option.type} value={option.type}>{option.label}</option>)}
      </select>
      <span className="format-toolbar-separator" />
      {formats.map(({ type, label, shortcut, Icon }) => <button key={type} aria-label={label} title={`${label} (${shortcut.replace('Mod', '⌘ / Ctrl +')})`} aria-pressed={activeFormats.has(type)}
        onMouseDown={event => event.preventDefault()} onClick={() => restore(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type))}><Icon size={15} /></button>)}
      <button ref={linkButton} aria-label="Insert or edit link" title="Link (⌘ / Ctrl + Shift + K)" aria-pressed={isLink} onMouseDown={event => event.preventDefault()} onClick={openLink}><Link size={15} /></button>
      <span className="format-toolbar-separator" />
      <button aria-label="Undo" title="Undo (⌘ / Ctrl + Z)" disabled={!canUndo} onMouseDown={event => event.preventDefault()} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}><Undo2 size={15} /></button>
      <button aria-label="Redo" title="Redo (⌘ / Ctrl + Shift + Z)" disabled={!canRedo} onMouseDown={event => event.preventDefault()} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}><Redo2 size={15} /></button>
      {blockType === 'code' && <select aria-label="Code language" value={language} onChange={event => restore(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        let node = selection.anchor.getNode();
        while (node.getParent() && !$isCodeNode(node)) node = node.getParent()!;
        if ($isCodeNode(node)) node.setLanguage(event.target.value || 'plain');
      })}>{codeLanguages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
      <button aria-label="Editor keyboard shortcuts" title="Keyboard shortcuts" className="toolbar-help" onClick={() => setShowShortcuts(true)}><Keyboard size={16} /></button>
    </div>
    {linkPosition && <LinkEditPopover currentUrl={linkUrl.current} position={linkPosition} onClose={() => { setLinkPosition(null); editor.focus(); }}
      onApply={url => restore(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed() && !linkUrl.current) $insertNodes([$createLinkNode(url).append($createTextNode(url))]);
        else editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      })} onRemove={() => restore(() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null))} />}
    <Modal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} title="Write without breaking your flow">
      <p className="text-xs text-web3-textMuted mb-4">Mod means ⌘ on Mac or Ctrl on Windows and Linux. Shortcuts apply while writing in the editor.</p>
      <dl className="editor-shortcuts">
        {[
          ['Add or search blocks', '/'], ['Bold / Italic / Underline', 'Mod B / I / U'], ['Inline code', 'Mod E'], ['Strikethrough', 'Mod Shift X'],
          ['Insert or edit a link', 'Mod Shift K'], ['Duplicate current block', 'Mod D'], ['Undo / Redo', 'Mod Z / Mod Shift Z'], ['Save note', 'Mod S'],
          ['Text / Heading 1, 2, 3', 'Mod Alt 0 / 1 / 2 / 3'], ['To-do / Bullet / Numbered list', 'Mod Alt 4 / 5 / 6'], ['Toggle / Code / Quote', 'Mod Alt 7 / 8 / 9'],
          ['Markdown task', '[] Space'], ['Quick search', 'Mod K'],
        ].map(([label, key]) => <div key={label}><dt>{label}</dt><dd><kbd>{key}</kbd></dd></div>)}
      </dl>
    </Modal>
  </>;
}
