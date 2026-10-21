import type { Note } from '../types';

/** RPC metadata refreshes must not replace dirty drafts or clear already-loaded content. */
export function mergeRemoteNotes(local: Note[], remote: Note[], dirtyIds: ReadonlySet<string>): Note[] {
    const byId = new Map(local.map(note => [note.id, note]));
    const merged = remote.map(note => {
        const previous = byId.get(note.id);
        if (!previous || (note.hasDraft && !previous.contentLoaded)) return note;
        if (dirtyIds.has(note.id)) return previous;
        if (previous.blobId === note.blobId && previous.contentLoaded) {
            return { ...note, content: previous.content, contentLoaded: true };
        }
        return note;
    });
    const remoteIds = new Set(remote.map(note => note.id));
    return [...local.filter(note => !remoteIds.has(note.id) && dirtyIds.has(note.id)), ...merged];
}
