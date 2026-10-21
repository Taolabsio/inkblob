import { noteText } from '../utils/noteText';
import { FileText, ArrowDownWideNarrow, X, Coins, MoreHorizontal, Pin, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { NOTE_DELETE_ENABLED, NOTE_DELETE_DISABLED_REASON } from '../config/featureFlags';
import { usePinnedNotes } from '../hooks/usePinnedNotes';
import { Folder, Note } from '../types';
import { FolderPicker } from './FolderPicker';

interface NoteListProps {
  notes: Note[];
  folderName?: string;
  folders: Folder[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  onDeleteNote?: (id: string) => void;
  onRestoreNote?: (id: string) => void;
  // Claims the escrowed WAL storage-fee rebate for a deleted-but-not-yet-refunded note (see
  // suiService.ts's claimWalRebateTx / notebook.move's claim_wal_storage_rebate). Optional so
  // NoteList doesn't require every caller to wire this up.
  onClaimWalRebate?: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchFocus?: () => void;
  /** True when viewing a shared notebook with a READ-only grant - hides every mutation
   *  affordance (create, move, delete, restore) and disables note dragging. Pin deliberately
   *  stays enabled: it's a localStorage-only client preference, not an on-chain mutation.
   *  Default false = all existing behavior. */
  readOnly?: boolean;
  /** True when viewing a shared notebook at EITHER permission level - hides "Claim WAL Rebate"
   *  (the rebate refunds the OWNER's escrowed WAL; owner-only affordance). Default false. */
  isSharedMode?: boolean;
}

const NOTE_DRAG_TYPE = 'application/x-inkblob-note';

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  folderName = 'Notes',
  folders,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onMoveNote,
  onDeleteNote,
  onRestoreNote,
  onClaimWalRebate,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  readOnly = false,
  isSharedMode = false,
}) => {
  const [sort, setSort] = useState('updated');
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : b.updatedAt.getTime() - a.updatedAt.getTime()), [notes, sort]);
  const { pinnedIds, togglePin } = usePinnedNotes();
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<{ noteId: string; rect: { top: number; left: number; right: number } } | null>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const pinnedNotes = sortedNotes.filter(n => pinnedIds.has(n.id));
  const unpinnedNotes = sortedNotes.filter(n => !pinnedIds.has(n.id));

  const openMoveMenu = (noteId: string) => {
    const btn = menuButtonRefs.current[noteId];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPickerAnchor({ noteId, rect: { top: rect.bottom + 4, left: rect.left, right: rect.right } });
    setMenuNoteId(null);
  };

  const renderNoteRow = (note: Note) => (
    <li key={note.id} className="relative group/row">
      <button
        draggable={!readOnly}
        onDragStart={(e) => {
          if (readOnly) return;
          e.dataTransfer.setData(NOTE_DRAG_TYPE, note.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onSelectNote(note.id)}
        className={`note-row w-full text-left group ${selectedNoteId === note.id
          ? 'is-selected'
          : ''
          }`}
      >
        <div className="note-row-title">
          {pinnedIds.has(note.id) && <Pin size={11} className="text-web3-accent shrink-0" fill="currentColor" />}
          <div className={`text-sm font-semibold truncate transition-colors ${selectedNoteId === note.id ? 'text-web3-primary' : 'text-web3-text'}`}>
            {note.title || 'New Note'}
          </div>
        </div>
        <p className="note-excerpt">{note.contentLoaded ? (noteText(note.content).slice(0, 110) || 'A fresh page. Make it yours.') : 'Open to decrypt your note'}</p>
        <div className="note-row-meta"><span>{formatDate(note.updatedAt)}</span><span><FileText size={11} /> {folders.find(f => f.id === note.folderId)?.name || 'Notes'}</span></div>
      </button>

      <div className="absolute top-2 right-1.5 flex items-center opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
          title={pinnedIds.has(note.id) ? 'Unpin' : 'Pin'}
          aria-label={pinnedIds.has(note.id) ? 'Unpin note' : 'Pin note'}
          className="p-1 rounded hover:bg-web3-cardHover text-web3-textMuted hover:text-web3-accent"
        >
          <Pin size={13} fill={pinnedIds.has(note.id) ? 'currentColor' : 'none'} />
        </button>
        {/* In read-only shared mode every menu entry below would be hidden, so the menu opener
            itself goes too rather than opening an empty popover. */}
        {!readOnly && (
          <button
            ref={(el) => { menuButtonRefs.current[note.id] = el; }}
            onClick={(e) => { e.stopPropagation(); setMenuNoteId(menuNoteId === note.id ? null : note.id); }}
            title="More options"
            aria-label="More options"
            className="p-1 rounded hover:bg-web3-cardHover text-web3-textMuted hover:text-web3-text"
          >
            <MoreHorizontal size={13} />
          </button>
        )}
      </div>

      {menuNoteId === note.id && !readOnly && (
        <div className="absolute top-8 right-1.5 z-40 w-40 rounded-lg border border-web3-border bg-web3-card shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100">
          {!note.isDeleted && (
            <button
              onClick={() => openMoveMenu(note.id)}
              className="w-full text-left px-2 py-1.5 text-sm rounded text-web3-text hover:bg-web3-cardHover"
            >
              Move to folder...
            </button>
          )}
          {note.isDeleted ? (
            <>
              <button
                onClick={() => { onRestoreNote?.(note.id); setMenuNoteId(null); }}
                className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 text-sm rounded text-web3-text hover:bg-web3-cardHover"
              >
                <RotateCcw size={13} />
                Restore
              </button>
              {/* Owner-only: the rebate refunds the notebook OWNER's escrowed WAL, so it's
                  hidden for grantees in BOTH shared modes. */}
              {!isSharedMode && !!note.walPaid && note.walPaid > 0 && !note.rebateClaimed && (
                <button
                  onClick={() => { onClaimWalRebate?.(note.id); setMenuNoteId(null); }}
                  title="Claim back the WAL storage fee escrowed for this note"
                  className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 text-sm rounded text-web3-accent hover:bg-web3-cardHover"
                >
                  <Coins size={13} />
                  Claim WAL Rebate
                </button>
              )}
            </>
          ) : (
            <button
              disabled={!NOTE_DELETE_ENABLED}
              onClick={NOTE_DELETE_ENABLED ? () => { onDeleteNote?.(note.id); setMenuNoteId(null); } : undefined}
              title={NOTE_DELETE_ENABLED ? undefined : NOTE_DELETE_DISABLED_REASON}
              className={`w-full flex items-center gap-1.5 text-left px-2 py-1.5 text-sm rounded ${NOTE_DELETE_ENABLED
                ? 'text-web3-text hover:bg-web3-cardHover'
                : 'text-web3-textMuted/40 cursor-not-allowed'
                }`}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );

  return (
    <section className="note-list" aria-label={`${folderName} note list`}>
      <div className="note-list-heading"><div><h1>{searchQuery ? 'Search results' : folderName}</h1><span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span></div>
        {!readOnly && <button onClick={onCreateNote} className="new-note-button" aria-label="Create new note" title="Create new note"><Plus size={19} /></button>}
      </div>
      <div className="note-search"><Search size={15} /><input aria-label="Search notes" type="search" placeholder="Find a thought…" value={searchQuery} onChange={e => onSearchChange(e.target.value)} onFocus={onSearchFocus} />
        {searchQuery && <button aria-label="Clear search" onClick={() => onSearchChange('')}><X size={14} /></button>}
      </div>
      <div className="note-sort"><span>{searchQuery ? 'Matching notes' : 'Your notes'}</span><label><ArrowDownWideNarrow size={13} /><select aria-label="Sort notes" value={sort} onChange={e => setSort(e.target.value)}><option value="updated">Last edited</option><option value="title">Title A–Z</option></select></label></div>
      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" onClick={() => setMenuNoteId(null)}>
        {pinnedNotes.length > 0 && (
          <>
            <h3 className="note-group-label">Pinned</h3>
            <ul className="space-y-1 px-2 mb-2">
              {pinnedNotes.map(renderNoteRow)}
            </ul>
          </>
        )}

        <h3 className="note-group-label">
          {pinnedNotes.length > 0 && unpinnedNotes.length > 0 ? 'Other notes' : ''}
        </h3>

        {notes.length === 0 && <div className="notes-empty"><FileText size={26} strokeWidth={1.3} /><h2>{searchQuery ? 'No thoughts found' : folderName === 'Trash' ? 'A clean slate' : 'A space for something new'}</h2><p>{searchQuery ? 'Try a different word or clear your search.' : folderName === 'Trash' ? 'Deleted notes will appear here.' : 'Every idea starts with a blank page.'}</p>{!searchQuery && folderName !== 'Trash' && !readOnly && <button className="text-button" onClick={onCreateNote}>Write your first note <Plus size={14} /></button>}</div>}
        <ul className="space-y-1 px-2">
          {unpinnedNotes.map(renderNoteRow)}
        </ul>
      </div>

      {pickerAnchor && (
        <FolderPicker
          folders={folders.filter(f => !f.isDeleted)}
          anchorRect={pickerAnchor.rect}
          onSelect={(folderId) => {
            onMoveNote(pickerAnchor.noteId, folderId);
            setPickerAnchor(null);
          }}
          onClose={() => setPickerAnchor(null)}
        />
      )}
    </section>
  );
};
