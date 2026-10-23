import { encryptText } from '../crypto/encryption';
import { decryptText } from '../crypto/decryption';
import type { Note } from '../types';

const sequences = new Map<string, number>();
const storageKey = (scope: string, id: string) => `inkblob:draft:v2:${scope}:${id}`;

export async function writeDraft(scope: string, note: Note, key: CryptoKey) {
    const id = storageKey(scope, note.id);
    const sequence = (sequences.get(id) ?? 0) + 1;
    sequences.set(id, sequence);
    const encrypted = await encryptText(JSON.stringify({ id: note.id, title: note.title, content: note.content,
        folderId: note.folderId, parentNoteId: note.parentNoteId, revision: note.revision, updatedAt: note.updatedAt }), key);
    if (sequences.get(id) === sequence) localStorage.setItem(id, encrypted);
}

export function clearDraft(scope: string, noteId: string) {
    const id = storageKey(scope, noteId);
    sequences.set(id, (sequences.get(id) ?? 0) + 1);
    localStorage.removeItem(id);
}

export async function readDraft(scope: string, note: Note, key: CryptoKey): Promise<Note | null> {
    const encrypted = localStorage.getItem(storageKey(scope, note.id));
    if (!encrypted) return null;
    const draft = JSON.parse(await decryptText(encrypted, key));
    if (draft.id !== note.id || typeof draft.content !== 'string' || typeof draft.title !== 'string' || typeof draft.revision !== 'string') {
        throw new Error('Invalid encrypted draft');
    }
    return { ...note, ...draft, updatedAt: new Date(draft.updatedAt), contentLoaded: true, hasDraft: true };
}
