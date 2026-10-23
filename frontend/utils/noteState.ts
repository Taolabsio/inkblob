import type { Note } from '../types';

/**
 * Check if a blob ID is valid for fetching from Walrus
 * Filters out placeholder values and invalid formats
 */
export function isValidBlobId(blobId: string | null | undefined): blobId is string {
    // Check for null/undefined/empty
    if (!blobId || blobId.trim() === '') {
        return false;
    }

    // Check for known placeholder values used in SuiService
    const placeholderValues = ['temp_blob_id', 'temp_blob_object_id'];
    if (placeholderValues.includes(blobId)) {
        console.debug(`[useNoteContent] Skipping placeholder blob ID: ${blobId}`);
        return false;
    }

    // Basic format validation (blob IDs should be reasonably long strings)
    // This is a simple check to avoid obviously invalid IDs
    if (blobId.length < 10) {
        console.debug(`[useNoteContent] Skipping blob ID that's too short: ${blobId}`);
        return false;
    }

    return true;
}

/** A note created on-chain but never saved has no Walrus content to download: it is an empty page,
 *  already loaded. Leaving it unloaded would keep autosave from ever becoming ready for it. */
export function withPlaceholderContent(note: Note): Note {
    return isValidBlobId(note.blobId) ? note : { ...note, content: '', contentLoaded: true };
}

/** A refresh that started before a save landed can resolve after it with the older revision. */
function predatesLocal(remote: Note, local: Note): boolean {
    return remote.revision !== undefined && local.revision !== undefined && BigInt(remote.revision) < BigInt(local.revision);
}

/** RPC metadata refreshes must not replace dirty drafts or clear already-loaded content. */
export function mergeRemoteNotes(local: Note[], remote: Note[], dirtyIds: ReadonlySet<string>): Note[] {
    const byId = new Map(local.map(note => [note.id, note]));
    const merged = remote.map(note => {
        const previous = byId.get(note.id);
        if (!previous || (note.hasDraft && !previous.contentLoaded)) return note;
        if (dirtyIds.has(note.id) || predatesLocal(note, previous)) return previous;
        if (previous.blobId === note.blobId && previous.contentLoaded) {
            return { ...note, content: previous.content, contentLoaded: true };
        }
        return note;
    });
    const remoteIds = new Set(remote.map(note => note.id));
    return [...local.filter(note => !remoteIds.has(note.id) && dirtyIds.has(note.id)), ...merged];
}
