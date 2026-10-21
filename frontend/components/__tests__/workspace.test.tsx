// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import { NoteList } from '../NoteList';
import type { Folder, Note } from '../../types';

const folders: Folder[] = [
  { id: 'notes', name: 'Notes', type: 'system', icon: 'file-text' },
  { id: 'trash', name: 'Trash', type: 'system', icon: 'trash' },
  { id: 'personal', name: 'Personal', type: 'user', icon: 'folder' },
];
const notes: Note[] = [
  { id: 'b', title: 'Beta', folderId: 'personal', content: 'Second thought', contentLoaded: true, blobId: '', updatedAt: new Date('2026-10-21') },
  { id: 'a', title: 'Alpha', folderId: 'personal', content: 'First thought', contentLoaded: true, blobId: '', updatedAt: new Date('2026-10-20') },
];
afterEach(() => { cleanup(); localStorage.clear(); });

function sidebar(readOnly = false) {
  return render(<Sidebar folders={folders} selectedFolderId="notes" isOpen readOnly={readOnly} onSelectFolder={vi.fn()} onRenameFolder={vi.fn()} onDeleteFolder={vi.fn()} onReparentFolder={vi.fn()} onReorderFolders={vi.fn()} onMoveNote={vi.fn()} />);
}
function list(readOnly = false) {
  return render(<NoteList notes={notes} folders={folders} selectedNoteId="b" onSelectNote={vi.fn()} onCreateNote={vi.fn()} onMoveNote={vi.fn()} searchQuery="" onSearchChange={vi.fn()} readOnly={readOnly} />);
}
describe('workspace navigation and permission boundaries', () => {
  it('shows system locations once, without offering destructive folder controls for them', () => {
    sidebar();
    expect(screen.getAllByRole('button', { name: 'Notes' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Trash' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Delete folder' })).toHaveLength(1);
    expect(within(screen.getByRole('list')).queryByRole('button', { name: 'Trash' })).toBeNull();
  });
  it('keeps folder navigation available while hiding write controls in read-only notebooks', () => {
    sidebar(true);
    expect(screen.getByRole('button', { name: 'Personal' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New folder' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete folder' })).toBeNull();
  });
  it('sorts notes by title when requested without changing the input data', () => {
    list();
    const noteTitles = () => screen.getAllByRole('listitem').map(item => within(item).getAllByRole('button')[0].textContent);
    expect(noteTitles()[0]).toContain('Beta');
    fireEvent.change(screen.getByLabelText('Sort notes'), { target: { value: 'title' } });
    expect(noteTitles()[0]).toContain('Alpha');
    expect(notes[0].title).toBe('Beta');
  });
  it('allows reading and local pinning but prevents mutations and dragging in read-only lists', () => {
    list(true);
    expect(screen.queryByRole('button', { name: 'Create new note' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'More options' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Pin note' })).toHaveLength(2);
    for (const item of screen.getAllByRole('listitem')) expect(within(item).getAllByRole('button')[0].draggable).toBe(false);
  });
});
