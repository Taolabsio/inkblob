// @vitest-environment jsdom
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { useNotes } from '../useNotes';
const mocks = vi.hoisted(() => ({ fetchNotes: vi.fn() }));
vi.mock('../../wallet', () => ({ useSuiClient: () => ({}) }));
vi.mock('../useActiveNotebook', () => ({ useActiveNotebook: () => ({ notebookId: 'book', encryptionKey: {} }) }));
vi.mock('../../services/suiService', () => ({ SuiService: class { fetchNotes = mocks.fetchNotes; } }));
vi.mock('../../crypto/decryption', () => ({ decryptText: async (text: string) => {
    if (text === 'wrong-key') throw new Error('Decryption failed');
    return 'Title';
} }));
const raw = (id: string, blobId: string, title = 'encrypted') => ({ id: { id }, blob_id: blobId, encrypted_title: title, revision: '0', updated_at: '1' });

describe('fetched note content state', () => {
    it('treats notes that were never saved as loaded empty pages so they can be edited and saved', async () => {
        mocks.fetchNotes.mockResolvedValue([raw('fresh', 'temp_blob_id'), raw('saved', 'walrus-blob-id-0123456789'), raw('locked', 'temp_blob_id', 'wrong-key')]);
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
        const { result } = renderHook(() => useNotes(), { wrapper });
        await waitFor(() => expect(result.current.data).toHaveLength(3));
        const byId = new Map(result.current.data!.map(note => [note.id, note]));
        expect(byId.get('fresh')).toMatchObject({ content: '', contentLoaded: true });
        // Real content is still downloaded on demand, and an undecryptable note never becomes editable.
        expect(byId.get('saved')?.contentLoaded).toBeUndefined();
        expect(byId.get('locked')?.contentLoaded).toBeUndefined();
    });
});
