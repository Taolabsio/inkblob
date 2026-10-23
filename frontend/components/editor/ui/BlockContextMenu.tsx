import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { NodeKey, $getNodeByKey } from 'lexical';
import { $isCollapsibleContainerNode } from '../nodes/CollapsibleNode';
import {
    CheckSquare,
    Code,
    Copy,
    Trash2,
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Lightbulb,
    ChevronRight,
} from 'lucide-react';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { duplicateBlock } from '../utils/duplicateNode';
import { applyColorToBlock } from '../utils/blockTransforms';
import { applyBlockTypeToNode, BLOCK_OPTIONS } from '../utils/blockCommands';
import { usePopoverPosition } from './usePopoverPosition';
import { HIGHLIGHT_COLORS, TEXT_COLORS } from './colors';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface BlockContextMenuProps {
    nodeKey: NodeKey;
    position: { top: number; left: number };
    onClose: () => void;
}

/**
 * Duplicate/Delete/Turn-into/Color popover opened from the drag handle - follows the same
 * fixed+portaled+fade/zoom-in pattern already established by SlashMenuPopover.
 */
export const BlockContextMenu: React.FC<BlockContextMenuProps> = ({ nodeKey, position, onClose }) => {
    const [editor] = useLexicalComposerContext();
    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, onClose);
    const clamped = usePopoverPosition(containerRef, position);

    const run = (action: () => void) => {
        action();
        onClose();
    };

    // "Turn into" conversions don't apply to a toggle's own container - $setBlocksType and
    // wrapBlockAsToggle both guard against it (would otherwise land on the inner title or
    // double-wrap), so hide the whole section rather than offering options that silently no-op.
    const isToggleTarget = editor.getEditorState().read(() => $isCollapsibleContainerNode($getNodeByKey(nodeKey)));

    const icons = { paragraph: Type, h1: Heading1, h2: Heading2, h3: Heading3, check: CheckSquare, bullet: List, number: ListOrdered, quote: Quote, code: Code, callout: Lightbulb, toggle: ChevronRight };
    const turnIntoOptions = isToggleTarget ? [] : BLOCK_OPTIONS.map(option => {
        const Icon = icons[option.type];
        return { label: option.label, icon: <Icon size={14} />, action: () => applyBlockTypeToNode(editor, nodeKey, option.type) };
    });

    return createPortal(
        <div
            ref={containerRef}
            role="dialog" aria-label="Block actions"
            className="fixed z-50 w-60 max-h-[calc(100dvh-16px)] overflow-y-auto rounded-lg border border-web3-border bg-web3-card shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
            style={clamped}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => run(() => duplicateBlock(editor, nodeKey))}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-web3-text hover:bg-web3-cardHover"
            >
                <Copy size={14} /> Duplicate
            </button>
            <button
                onClick={() => run(() => editor.update(() => { $getNodeByKey(nodeKey)?.remove(); }))}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-web3-textMuted hover:bg-red-500/10 hover:text-red-400"
            >
                <Trash2 size={14} /> Delete
            </button>

            {turnIntoOptions.length > 0 && (
                <>
                    <div className="h-[1px] bg-web3-border/50 my-1" />
                    <div className="text-[10px] font-semibold text-web3-textMuted uppercase tracking-wider px-2 mb-1">Turn into</div>
                    <div className="grid grid-cols-3 gap-0.5 px-1 pb-1">
                        {turnIntoOptions.map((opt) => (
                            <button
                                key={opt.label}
                                title={opt.label}
                                aria-label={`Turn into ${opt.label}`}
                                onClick={() => run(opt.action)}
                                className="flex items-center justify-center p-1.5 rounded text-web3-textMuted hover:bg-web3-cardHover hover:text-web3-primary"
                            >
                                {opt.icon}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="h-[1px] bg-web3-border/50 my-1" />
            <div className="text-[10px] font-semibold text-web3-textMuted uppercase tracking-wider px-2 mb-1">Color</div>
            <div className="flex items-center gap-1 px-2 pb-1">
                {TEXT_COLORS.map((c) => (
                    <button
                        key={c.label}
                        title={c.label}
                        aria-label={`Text color: ${c.label}`}
                        onClick={() => run(() => applyColorToBlock(editor, nodeKey, 'color', c.value))}
                        className="w-5 h-5 rounded-full border border-web3-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.swatch === 'transparent' ? 'transparent' : c.swatch, opacity: c.swatch === 'transparent' ? 1 : 0.85 }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-1 px-2 pb-1">
                {HIGHLIGHT_COLORS.map((c) => (
                    <button
                        key={c.label}
                        title={c.label}
                        aria-label={`Highlight color: ${c.label}`}
                        onClick={() => run(() => applyColorToBlock(editor, nodeKey, 'background-color', c.value))}
                        className="w-5 h-5 rounded-full border border-web3-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.swatch === 'transparent' ? 'transparent' : c.swatch, opacity: c.swatch === 'transparent' ? 1 : 0.85 }}
                    />
                ))}
            </div>
        </div>,
        document.body
    );
};
