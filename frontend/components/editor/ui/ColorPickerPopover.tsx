import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePopoverPosition } from './usePopoverPosition';
import { useClickOutside } from '../../../hooks/useClickOutside';

import { TEXT_COLORS, HIGHLIGHT_COLORS, type ColorSwatch } from './colors';


interface ColorPickerPopoverProps {
    position: { top: number; left: number };
    onSelectTextColor: (value: string) => void;
    onSelectHighlight: (value: string) => void;
    onClose: () => void;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({ position, onSelectTextColor, onSelectHighlight, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, onClose);
    const clamped = usePopoverPosition(containerRef, position);

    const renderRow = (label: string, colors: ColorSwatch[], onSelect: (value: string) => void) => (
        <div>
            <div className="text-[10px] font-semibold text-web3-textMuted uppercase tracking-wider px-1 mb-1">{label}</div>
            <div className="flex items-center gap-1">
                {colors.map((c) => (
                    <button
                        key={c.label}
                        title={c.label}
                        aria-label={`${label}: ${c.label}`}
                        onClick={() => { onSelect(c.value); onClose(); }}
                        className="w-6 h-6 rounded-full border border-web3-border flex items-center justify-center hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.swatch === 'transparent' ? 'transparent' : c.swatch, opacity: c.swatch === 'transparent' ? 1 : 0.85 }}
                    >
                        {c.swatch === 'transparent' && <span className="text-[10px] text-web3-textMuted">✕</span>}
                    </button>
                ))}
            </div>
        </div>
    );

    return createPortal(
        <div
            ref={containerRef}
            role="dialog" aria-label="Text and highlight colors"
            className="fixed z-50 w-64 rounded-lg border border-web3-border bg-web3-card shadow-xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100"
            style={clamped}
            onClick={(e) => e.stopPropagation()}
        >
            {renderRow('Text color', TEXT_COLORS, onSelectTextColor)}
            {renderRow('Highlight', HIGHLIGHT_COLORS, onSelectHighlight)}
        </div>,
        document.body
    );
};
