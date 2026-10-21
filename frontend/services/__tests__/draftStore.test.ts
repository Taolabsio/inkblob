import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { writeDraft, readDraft, clearDraft } from '../draftStore';
import { deriveNotebookKey } from '../../crypto/keySharing';
import { toBase64 } from '@mysten/sui/utils';
import type { Note } from '../../types';
const storage = new Map<string, string>();
vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('localStorage', { getItem: (id: string) => storage.get(id) ?? null,
    setItem: (id: string, value: string) => storage.set(id, value), removeItem: (id: string) => storage.delete(id) });
const address = '0x' + '1'.repeat(64);
const notebook = '0x' + '2'.repeat(64);
const signature = toBase64(new Uint8Array(64).fill(1));
const note: Note = { id: 'note', title: 'Private title', content: 'secret draft', blobId: 'blob', folderId: 'notes', updatedAt: new Date(1000), revision: '3' };
beforeEach(() => storage.clear());
describe('encrypted draft recovery', () => {
    it('restores content and its original revision without storing plaintext', async () => {
        const key = await deriveNotebookKey(signature, address, notebook);
        await writeDraft('account:book', note, key);
        expect([...storage.values()].join('')).not.toContain('secret');
        expect([...storage.values()].join('')).not.toContain('Private title');
        expect(await readDraft('account:book', note, key)).toMatchObject({ content: note.content, revision: '3', hasDraft: true, contentLoaded: true });
    });
    it('isolates notebooks and accounts', async () => {
        const key = await deriveNotebookKey(signature, address, notebook);
        const other = await deriveNotebookKey(signature, address, '0x' + '3'.repeat(64));
        await writeDraft('account:book', note, key);
        await expect(readDraft('account:book', note, other)).rejects.toThrow();
        expect(await readDraft('other:book', note, key)).toBeNull();
    });
    it('does not resurrect a draft whose encryption completes after acknowledgement', async () => {
        const key = await deriveNotebookKey(signature, address, notebook);
        const pending = writeDraft('scope', note, key);
        clearDraft('scope', note.id);
        await pending;
        expect(await readDraft('scope', note, key)).toBeNull();
    });
});
