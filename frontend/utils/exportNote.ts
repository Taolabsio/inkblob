import type { Note } from '../types';

export function exportNote(note: Note) {
    const blob = new Blob([JSON.stringify({ format: 'inkblob-note-v1', exportedAt: new Date().toISOString(),
        title: note.title, content: note.content }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(note.title || 'Untitled').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 80)}.inkblob.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
