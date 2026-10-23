import { noteText } from '../utils/noteText';
import { FileText, Folder as FolderIcon, Search } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { Folder, Note } from '../types';
import { fuzzyMatch } from '../utils/fuzzyMatch';

interface CommandPaletteProps {
    notes: Note[];
    folders: Folder[];
    getIndexedContent: (blobId: string | undefined | null) => string;
    onSelectNote: (id: string) => void;
    onSelectFolder: (id: string) => void;
    onOpenIntent: () => void;
}

interface PaletteItem {
    id: string;
    kind: 'note' | 'folder';
    title: string;
    subtitle?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    notes, folders, getIndexedContent, onSelectNote, onSelectFolder, onOpenIntent,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dialogId = useId();

    const close = () => { setIsOpen(false); setQuery(''); setSelectedIndex(0); };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && !e.altKey && !e.shiftKey && !e.defaultPrevented && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(prev => {
                    if (!prev) onOpenIntent();
                    return !prev;
                });
                return;
            }
            if (e.key === 'Escape' && isOpen) close();
        };
        const openSearch = () => { onOpenIntent(); setIsOpen(true); };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('inkblob:search', openSearch);
        return () => { document.removeEventListener('keydown', handleKeyDown); document.removeEventListener('inkblob:search', openSearch); };
    }, [isOpen, onOpenIntent]);

    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        inputRef.current?.focus();
        const trapFocus = (event: KeyboardEvent) => {
            if (event.key !== 'Tab' || !panelRef.current) return;
            const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>('input, button'));
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
        };
        document.addEventListener('keydown', trapFocus);
        return () => { document.removeEventListener('keydown', trapFocus); previousFocus?.focus(); };
    }, [isOpen]);

    // Matches Modal.tsx's body-scroll-lock behavior while an overlay is open
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, [isOpen]);

    const items = useMemo<PaletteItem[]>(() => {
        const noteItems: PaletteItem[] = notes.map(n => ({
            id: n.id,
            kind: 'note',
            title: n.title || 'Untitled',
            subtitle: n.updatedAt.toLocaleDateString(),
        }));
        const folderItems: PaletteItem[] = folders
            .filter(f => f.type === 'user' || f.id === 'notes')
            .map(f => ({ id: f.id, kind: 'folder', title: f.name }));
        return [...folderItems, ...noteItems];
    }, [notes, folders]);

    const results = useMemo(() => {
        if (!query.trim()) return items.slice(0, 20);
        return items.filter(item => {
            if (fuzzyMatch(query, item.title)) return true;
            if (item.kind === 'note') {
                const note = notes.find(n => n.id === item.id);
                if (note && fuzzyMatch(query, getIndexedContent(note.blobId) || noteText(note.content))) return true;
            }
            return false;
        }).slice(0, 20);
    }, [items, query, notes, getIndexedContent]);

    useEffect(() => { setSelectedIndex(0); }, [query]);

    const selectItem = (item: PaletteItem) => {
        if (item.kind === 'note') onSelectNote(item.id);
        else onSelectFolder(item.id);
        close();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150" onClick={close}>
            <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Quick search" id={dialogId}
                className="w-full max-w-lg rounded-xl border border-web3-border bg-web3-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-web3-border/50">
                    <Search size={16} className="text-web3-textMuted shrink-0" />
                    <input
                        ref={inputRef}
                        aria-label="Search notes and folders"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notes and folders..."
                        className="flex-1 bg-transparent outline-none text-sm text-web3-text placeholder-web3-textMuted"
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
                            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
                            if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); selectItem(results[selectedIndex]); }
                        }}
                    />
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-web3-border text-web3-textMuted">Esc</kbd>
                </div>

                <div className="max-h-80 overflow-y-auto custom-scrollbar p-1">
                    {results.length === 0 && (
                        <div className="px-4 py-6 text-sm text-web3-textMuted text-center">No results</div>
                    )}
                    {results.map((item, i) => (
                        <button
                            key={`${item.kind}-${item.id}`}
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => setSelectedIndex(i)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${i === selectedIndex ? 'bg-web3-cardHover text-web3-primary' : 'text-web3-text'
                                }`}
                        >
                            {item.kind === 'note' ? <FileText size={15} className="shrink-0 opacity-70" /> : <FolderIcon size={15} className="shrink-0 opacity-70" />}
                            <span className="truncate flex-1">{item.title}</span>
                            {item.subtitle && <span className="text-xs text-web3-textMuted shrink-0">{item.subtitle}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
