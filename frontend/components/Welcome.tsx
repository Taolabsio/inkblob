import { lazy, Suspense, useState } from 'react';
import { ArrowRight, FileText, LockKeyhole, Plus } from 'lucide-react';
import { Folder, Note } from '../types';
import { noteText } from '../utils/noteText';
import { getDescendantFolderIds } from '../utils/folderTree';
import { useToast } from '../context/ToastContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NoteList } from './NoteList';
import { LandingPage } from './LandingPage';
import { Modal } from './Modal';
import { SettingsModal } from './SettingsModal';
import { CommandPalette } from './CommandPalette';

const Editor = lazy(() => import('./Editor').then(module => ({ default: module.Editor })));

const previewFolders: Folder[] = [
  { id: 'notes', name: 'Notes', icon: 'file-text', type: 'system' },
  { id: 'preview-personal', name: 'Personal', icon: 'folder', type: 'user' },
  { id: 'preview-work', name: 'Work & projects', icon: 'folder', type: 'user' },
  { id: 'preview-reading', name: 'Reading room', icon: 'folder', type: 'user' },
  { id: 'trash', name: 'Trash', icon: 'trash', type: 'system' },
];

function documentContent(blocks: [string, string][]) {
  return JSON.stringify({ root: { type: 'root', version: 1, format: '', indent: 0, direction: null,
    children: blocks.map(([type, text]) => ({ type: type.startsWith('h') ? 'heading' : type,
      ...(type.startsWith('h') ? { tag: type } : {}), version: 1, format: '', indent: 0, direction: null,
      children: [{ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' }] })) } });
}

function initialNotes(): Note[] {
  const content: [string, string, [string, string][]][] = [
    ['Make room for what matters', 'preview-personal', [
      ['paragraph', 'Some ideas need a little room to grow. A place without the notifications, the noise, or the pressure to turn every thought into something finished.'],
      ['paragraph', 'This is that place. A notebook for the half-formed ideas, the everyday observations, and the things you don’t want to forget.'],
      ['h2', 'Start wherever you are'],
      ['paragraph', 'Write a sentence. Make a list. Follow a thought somewhere unexpected. There’s no right way to fill a blank page.'],
      ['quote', 'Give the small ideas somewhere to stay.'],
      ['h2', 'A few things to try'],
      ['paragraph', 'Select some text to format it. Type / on a new line to add a heading, a list, or a quote. Give your ideas a home with folders and nested pages.'],
      ['paragraph', 'This is an interactive preview. Make it your own; changes stay here until you leave.'],
    ]],
    ['Little things worth keeping', 'preview-personal', [['paragraph', 'The first quiet hour of a Sunday. A line from a book. A conversation that changes how you see something.'], ['h2', 'Keep a small collection'], ['paragraph', 'There are things you notice only when you start writing them down.']]],
    ['A project, in its first shape', 'preview-work', [['paragraph', 'Before the plan, there is a question. What would make this worth doing?'], ['h2', 'What we know'], ['paragraph', 'The best tools make room for the work. Start with the smallest useful version, and learn from there.']]],
    ['Notes from the reading room', 'preview-reading', [['paragraph', 'A running collection of passages, questions, and ideas to come back to.'], ['h2', 'On paying attention'], ['paragraph', 'Read slowly enough to notice what stays with you. Then put it in your own words.']]],
    ['An idea for another day', 'preview-personal', [['paragraph', 'A small weekend project: take a walk without a destination and write down five things you have never noticed before.']]],
  ];
  return content.map(([title, folderId, blocks], i) => ({ id: `preview-note-${i}`, title, folderId,
    content: documentContent(blocks), contentLoaded: true, blobId: '', updatedAt: new Date(Date.now() - i * 86_400_000) }));
}

export function Welcome() {
  const [isPreview, setIsPreview] = useState(false);
  return isPreview ? <PreviewWorkspace onExit={() => setIsPreview(false)} /> : <LandingPage onExplore={() => setIsPreview(true)} />;
}

function PreviewWorkspace({ onExit }: { onExit: () => void }) {
  const [notes, setNotes] = useState(initialNotes);
  const [folders, setFolders] = useState(previewFolders);
  const [selectedFolderId, setSelectedFolderId] = useState('notes');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => window.matchMedia('(max-width: 767px)').matches ? null : 'preview-note-0');
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 1023px)').matches);
  const [query, setQuery] = useState('');
  const [folderDialog, setFolderDialog] = useState<{ parentId: string | null } | null>(null);
  const [folderName, setFolderName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showShared, setShowShared] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();
  const currentNote = notes.find(note => note.id === selectedNoteId) ?? null;
  const liveFolders = folders.filter(folder => !folder.isDeleted);
  const filtered = notes.filter(note => {
    if (selectedFolderId === 'trash' ? !note.isDeleted : note.isDeleted) return false;
    if (selectedFolderId !== 'notes' && selectedFolderId !== 'trash' && note.folderId !== selectedFolderId) return false;
    return !query || `${note.title} ${noteText(note.content)}`.toLowerCase().includes(query.toLowerCase());
  });
  const selectFolder = (id: string) => {
    setSelectedFolderId(id); setQuery(''); setSelectedNoteId(null);
    if (window.matchMedia('(max-width: 1023px)').matches) setSidebarOpen(false);
  };
  const updateNote = (id: string, updates: Partial<Note>) => setNotes(items => items.map(note => note.id === id ? { ...note, ...updates } : note));
  const createNote = (parentNoteId?: string) => {
    const id = `preview-${crypto.randomUUID()}`;
    const parent = notes.find(note => note.id === parentNoteId);
    const folderId = parent?.folderId ?? (selectedFolderId === 'notes' || selectedFolderId === 'trash' ? '' : selectedFolderId);
    setNotes(items => [{ id, title: '', content: '', contentLoaded: true, blobId: '', folderId, parentNoteId, updatedAt: new Date() }, ...items]);
    if (selectedFolderId === 'trash') setSelectedFolderId('notes');
    setQuery(''); setSelectedNoteId(id);
  };
  return <div className="workspace">
    <Sidebar folders={liveFolders} selectedFolderId={selectedFolderId} onSelectFolder={selectFolder}
      noteCount={notes.filter(note => !note.isDeleted).length} preview isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      onCreateFolder={parentId => { setFolderName(''); setFolderDialog({ parentId }); }}
      onRenameFolder={(id, name) => setFolders(items => items.map(folder => folder.id === id ? { ...folder, name } : folder))}
      onDeleteFolder={id => {
        const deleted = new Set([id, ...getDescendantFolderIds(folders, id)]);
        setFolders(items => items.map(folder => deleted.has(folder.id) ? { ...folder, isDeleted: true } : folder));
        setNotes(items => items.map(note => deleted.has(note.folderId) ? { ...note, isDeleted: true } : note));
        if (deleted.has(selectedFolderId)) selectFolder('notes');
        toast.info('Folder moved to Trash', 'Its notes can be restored from Trash.');
      }}
      onReparentFolder={(id, parentId) => setFolders(items => items.map(folder => folder.id === id ? { ...folder, parentId } : folder))}
      onReorderFolders={(ids, orders) => setFolders(items => items.map(folder => ids.includes(folder.id) ? { ...folder, sortOrder: orders[ids.indexOf(folder.id)] } : folder))}
      onMoveNote={(id, folderId) => updateNote(id, { folderId: folderId ?? '' })}
      onOpenSettings={() => setShowSettings(true)} onOpenSharedWithMe={() => setShowShared(true)} />
    <div className="flex flex-col flex-1 min-w-0">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} folderName={folders.find(folder => folder.id === selectedFolderId)?.name} onCreateNote={() => createNote()} preview onExitPreview={onExit} />
      <div className="preview-banner"><span><LockKeyhole size={11} /> Interactive preview. Changes last until you leave.</span><button onClick={onExit}>Connect to keep your notes <ArrowRight size={11} className="inline ml-1" /></button></div>
      <div className="flex flex-1 overflow-hidden">
        <div className={`note-list-column ${selectedNoteId ? 'mobile-hidden' : ''}`}>
          {selectedFolderId === 'trash' && folders.some(folder => folder.isDeleted) && <div className="p-4 text-xs text-web3-textMuted"><p className="mb-2">Deleted folders</p>{folders.filter(folder => folder.isDeleted).map(folder => <button key={folder.id} className="flex w-full justify-between py-2" onClick={() => { setFolders(items => items.map(item => item.id === folder.id ? { ...item, isDeleted: false, parentId: null } : item)); }}> {folder.name}<span className="text-web3-accent">Restore</span></button>)}</div>}
          <NoteList notes={filtered} folders={liveFolders} folderName={folders.find(folder => folder.id === selectedFolderId)?.name} selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId} onCreateNote={() => createNote()} onMoveNote={(id, folderId) => updateNote(id, { folderId: folderId ?? '' })}
            onDeleteNote={setDeleteId} onRestoreNote={id => updateNote(id, { isDeleted: false })} searchQuery={query} onSearchChange={setQuery} />
        </div>
        <main className={`${selectedNoteId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 overflow-hidden`}>
          {currentNote ? <Suspense fallback={<div role="status" className="workspace-empty">Opening your page…</div>}><Editor key={currentNote.id} note={currentNote} notes={notes} folders={liveFolders}
            childNotes={notes.filter(note => note.parentNoteId === currentNote.id && !note.isDeleted)} onUpdateNote={updateNote}
            onHydrateContent={(id, content) => updateNote(id, { content, contentLoaded: true })} onSave={async () => 'saved'}
            onDeleteNote={setDeleteId} onRestoreNote={id => updateNote(id, { isDeleted: false })} onCreateNote={() => createNote()}
            onCreateSubNote={createNote} onNavigateToFolder={selectFolder} onNavigateToNote={setSelectedNoteId} onBack={() => setSelectedNoteId(null)} preview />
          </Suspense> : <div className="workspace-empty w-full"><FileText size={34} strokeWidth={1.2} /><h2>A little room for your next idea.</h2><p>Open a note from the list, or start fresh. The page is yours.</p>{selectedFolderId !== 'trash' && <button className="primary-button" onClick={() => createNote()}><Plus size={15} />Create a note</button>}<kbd>⌘ / Ctrl + K to find anything</kbd></div>}
        </main>
      </div>
    </div>
    <Modal isOpen={folderDialog !== null} onClose={() => setFolderDialog(null)} title="Create new folder">
      <form onSubmit={e => { e.preventDefault(); if (!folderName.trim()) return; const id = `preview-${crypto.randomUUID()}`; setFolders(items => [...items, { id, name: folderName.trim(), icon: 'folder', type: 'user', parentId: folderDialog?.parentId }]); setFolderDialog(null); selectFolder(id); }}>
        <label htmlFor="preview-folder" className="block text-xs text-web3-textMuted mb-2">Folder name</label><input id="preview-folder" autoFocus required value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="A home for your ideas" className="w-full rounded-md border border-web3-border bg-background px-3 py-2 text-sm" />
        <div className="flex justify-end gap-5 mt-6"><button type="button" className="text-button" onClick={() => setFolderDialog(null)}>Cancel</button><button className="primary-button" type="submit">Create folder</button></div>
      </form>
    </Modal>
    <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Move note to Trash?">
      <p className="text-sm text-web3-textMuted leading-relaxed">You can restore this note from Trash whenever you need it.</p><div className="flex justify-end gap-5 mt-6"><button className="text-button" onClick={() => setDeleteId(null)}>Keep note</button><button className="primary-button" onClick={() => { if (deleteId) { updateNote(deleteId, { isDeleted: true }); if (selectedNoteId === deleteId) setSelectedNoteId(null); } setDeleteId(null); }}>Move to Trash</button></div>
    </Modal>
    <Modal isOpen={showShared} onClose={() => setShowShared(false)} title="A space to share">
      <p className="text-sm text-web3-textMuted leading-relaxed">Connect your Sui wallet to see notebooks shared with you. Notebook owners can invite your wallet with read or write access.</p><button className="primary-button mt-6" onClick={onExit}>Back to connect wallet <ArrowRight size={14} /></button>
    </Modal>
    <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    <CommandPalette notes={notes.filter(note => !note.isDeleted)} folders={liveFolders} getIndexedContent={() => ''} onOpenIntent={() => {}} onSelectFolder={selectFolder} onSelectNote={id => { const note = notes.find(item => item.id === id); if (note) setSelectedFolderId(note.folderId || 'notes'); setSelectedNoteId(id); }} />
  </div>;
}
