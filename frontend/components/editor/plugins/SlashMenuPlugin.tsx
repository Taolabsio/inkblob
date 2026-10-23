import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $getSelection, $isRangeSelection, $setSelection, type BaseSelection, type TextNode } from 'lexical';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { CheckSquare, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, Type, Table, Lightbulb, ChevronRight } from 'lucide-react';
import { TableGridSelector } from '../ui/TableGridSelector';
import { usePopoverPosition } from '../ui/usePopoverPosition';
import { $applyBlockType, BLOCK_OPTIONS, filterBlockOptions } from '../utils/blockCommands';

class SlashMenuOption extends MenuOption {
  refElement: HTMLElement | null = null;
  constructor(public title: string, public description: string, public keywords: string[], public icon: ReactNode, public onSelect: () => void) { super(title); }
}
function SlashMenuPopover({ anchor, children }: { anchor: MutableRefObject<HTMLElement | null>; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    const update = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 6, left: rect.left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [anchor]);
  const clamped = usePopoverPosition(ref, position);
  return createPortal(<div ref={ref} className="slash-menu" style={clamped}>{children}</div>, document.body);
}
export default function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const [tablePosition, setTablePosition] = useState<{ top: number; left: number } | null>(null);
  const tableSelection = useRef<BaseSelection | null>(null);
  const trigger = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });
  const allOptions = useMemo(() => {
    const icons = { paragraph: Type, h1: Heading1, h2: Heading2, h3: Heading3, check: CheckSquare, bullet: List, number: ListOrdered, quote: Quote, code: Code, callout: Lightbulb, toggle: ChevronRight };
    return [
      ...BLOCK_OPTIONS.map(option => { const Icon = icons[option.type]; return new SlashMenuOption(option.label, option.description, [option.type, ...option.keywords], <Icon size={17} />, () => { $applyBlockType(option.type); }); }),
      new SlashMenuOption('Divider', 'Separate two sections', ['line', 'hr', 'separator', '分隔線'], <Minus size={17} />, () => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined); }),
      new SlashMenuOption('Table', 'Arrange information in rows and columns', ['grid', 'spreadsheet', '表格'], <Table size={17} />, () => {}),
    ];
  }, [editor]);
  const options = useMemo(() => filterBlockOptions(allOptions, query), [allOptions, query]);
  const select = useCallback((option: SlashMenuOption, nodeToRemove: TextNode | null, close: () => void) => {
    const rect = option.refElement?.getBoundingClientRect();
    const isTable = option.title === 'Table';
    editor.update(() => {
      nodeToRemove?.remove();
      if (isTable) {
        const selection = $getSelection();
        tableSelection.current = $isRangeSelection(selection) ? selection.clone() : null;
      } else option.onSelect();
    }, { onUpdate: () => {
      close();
      // Open after Lexical commits the slash removal so its focus reconciliation cannot
      // steal focus back from the keyboard-operated table chooser.
      if (isTable) setTablePosition({ top: rect?.top ?? 100, left: rect?.left ?? 16 });
    } });
  }, [editor]);
  return <>
    <LexicalTypeaheadMenuPlugin<SlashMenuOption> onQueryChange={setQuery} onSelectOption={select} triggerFn={trigger} options={options}
      menuRenderFn={(anchor, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => !tablePosition && query !== null && anchor.current ? <SlashMenuPopover anchor={anchor}>
        <div className="slash-menu-heading">{query ? `Blocks matching “${query}”` : 'Add a block'}</div>
        {options.length ? <ul role="listbox" aria-label="Insert a block">{options.map((option, index) => <li key={option.title} role="option" aria-selected={selectedIndex === index} id={`typeahead-item-${index}`}
          ref={element => { option.refElement = element; option.setRefElement(element); if (selectedIndex === index) element?.scrollIntoView({ block: 'nearest' }); }}
          className={selectedIndex === index ? 'is-active' : ''} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setHighlightedIndex(index)} onClick={() => selectOptionAndCleanUp(option)}>
          <span className="slash-menu-icon">{option.icon}</span><span><strong>{option.title}</strong><small>{option.description}</small></span>
        </li>)}</ul> : <p className="slash-menu-empty">No matching blocks. Try “heading”, “todo”, or “table”.</p>}
        <div className="slash-menu-footer">↑ ↓ to choose <span>Enter to insert</span></div>
      </SlashMenuPopover> : null} />
    {tablePosition && <TableGridSelector position={tablePosition} close={() => setTablePosition(null)} onSelect={(rows, columns) => {
      editor.update(() => {
        if (tableSelection.current) $setSelection(tableSelection.current.clone());
        editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(columns) });
      });
      setTablePosition(null);
      editor.focus();
    }} />}
  </>;
}
