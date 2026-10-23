import { describe, it, expect, vi } from 'vitest';
import { InkBlobClient, moveFields } from '../chainClient';
const object = { objectId: '0x1', version: '1', digest: 'digest', type: 'type', owner: {}, json: { id: '0x1', value: 'test' } };
describe('gRPC boundary', () => {
    it('normalizes notebook tables, note ids, and optional parents', () => {
        const parsed = moveFields({ notes: { id: 'table', size: '1' }, folder_id: null, parent_note_id: 'parent', id: 'note', revision: '9007199254740993' }).fields;
        expect(parsed.notes.fields.id.id).toBe('table');
        expect(parsed.id.id).toBe('note');
        expect(parsed.folder_id.fields.vec).toEqual([]);
        expect(parsed.parent_note_id.fields.vec).toEqual(['parent']);
        expect(parsed.revision).toBe('9007199254740993');
    });
    it('chunks large tables instead of relying on implicit RPC batching', async () => {
        const getObjects = vi.fn().mockImplementation(async ({ objectIds }) => ({ objects: objectIds.map(() => object) }));
        const client = new InkBlobClient({ getObjects } as any);
        const result = await client.multiGetObjects({ ids: Array.from({ length: 123 }, (_, index) => String(index)) });
        expect(result).toHaveLength(123);
        expect(getObjects.mock.calls.map(call => call[0].objectIds.length)).toEqual([50, 50, 23]);
    });
    it('never converts a failed table read into an apparently successful partial list', async () => {
        const client = new InkBlobClient({ getObjects: async () => ({ objects: [object, new Error('unavailable')] }) } as any);
        await expect(client.multiGetObjects({ ids: ['a', 'b'] })).rejects.toThrow('unavailable');
    });
    it('rejects aborted session transactions', async () => {
        const client = new InkBlobClient({ signAndExecuteTransaction: async () => ({ FailedTransaction: { status: { error: { message: 'MoveAbort(24)' } } } }) } as any);
        await expect(client.executeWithSigner({} as any, {} as any)).rejects.toThrow('MoveAbort');
    });
});
