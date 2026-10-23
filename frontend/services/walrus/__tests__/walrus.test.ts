import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadBlob } from '../upload';
import { downloadBlob } from '../download';
import { BlobNotFoundError } from '../errors';
const mocks = vi.hoisted(() => ({ writeBlob: vi.fn(), readBlob: vi.fn(), flow: vi.fn(), fetch: vi.fn() }));
vi.mock('../config', () => ({ createWalrusClient: () => ({ walrus: { writeBlob: mocks.writeBlob, readBlob: mocks.readBlob, writeBlobFlow: mocks.flow } }),
    WALRUS_CONFIG: { aggregator: 'https://example.test', aggregatorTimeout: 1000, defaultEpochs: 30, maxBlobSize: 1024 } }));

beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('fetch', mocks.fetch); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const payload = new Uint8Array([1, 2, 3]);
const signer = { toSuiAddress: () => '0x1' } as any;

describe('Walrus storage', () => {
    it('retains the real blob object and expiry for session uploads', async () => {
        mocks.writeBlob.mockResolvedValue({ blobId: 'blob', blobObject: { id: '0xabc', storage: { end_epoch: 120 } } });
        const result = await uploadBlob(payload, 30, signer, '0xowner');
        expect(mocks.writeBlob).toHaveBeenCalledWith({ blob: payload, epochs: 30, signer, owner: '0xowner', deletable: false });
        expect(result).toMatchObject({ blobId: 'blob', blobObject: '0xabc', endEpoch: 120, encryptedSizeBytes: 3 });
    });
    it('does not retry paid session registration after failure', async () => {
        mocks.writeBlob.mockRejectedValue(new Error('transaction aborted'));
        await expect(uploadBlob(payload, 30, signer)).rejects.toThrow('aborted');
        expect(mocks.writeBlob).toHaveBeenCalledTimes(1);
    });
    it('requires a signer and rejects oversized blobs before making requests', async () => {
        await expect(uploadBlob(payload)).rejects.toThrow('Connect a wallet');
        await expect(uploadBlob(new Uint8Array(1025), 30, signer)).rejects.toThrow('exceeds max size');
        expect(mocks.writeBlob).not.toHaveBeenCalled();
    });
    it('retries only the data step of a wallet upload', async () => {
        vi.useFakeTimers();
        const register = vi.fn(() => ({ kind: 'register' }));
        const upload = vi.fn().mockRejectedValueOnce(new Error('Network error')).mockResolvedValue({});
        mocks.flow.mockReturnValue({ encode: vi.fn(), register, upload, certify: () => ({ kind: 'certify' }),
            getBlob: async () => ({ blobId: 'raw-blob', blobObjectId: '0xabc', blobObject: { storage: { end_epoch: 120 } } }) });
        const execute = vi.fn().mockResolvedValue({ digest: 'digest' });
        const pending = uploadBlob(payload, 30, undefined, '0xowner', execute);
        await vi.runAllTimersAsync();
        expect((await pending).blobId).toBe('raw-blob');
        expect(register).toHaveBeenCalledTimes(1);
        expect(upload).toHaveBeenCalledTimes(2);
        expect(execute).toHaveBeenCalledTimes(2);
    });
    it('never uploads or certifies after wallet rejection', async () => {
        const upload = vi.fn();
        mocks.flow.mockReturnValue({ encode: vi.fn(), register: () => ({}), upload });
        await expect(uploadBlob(payload, 30, undefined, '0xowner', async () => { throw new Error('User rejected'); })).rejects.toThrow('User rejected');
        expect(upload).not.toHaveBeenCalled();
    });
    it('downloads raw encrypted data from the aggregator', async () => {
        mocks.fetch.mockResolvedValue({ ok: true, blob: async () => new Blob([payload]) });
        expect(await downloadBlob('blob')).toEqual(payload);
        expect(mocks.readBlob).not.toHaveBeenCalled();
    });
    it('falls back to raw SDK reads on network failure', async () => {
        mocks.fetch.mockRejectedValue(new Error('Network error'));
        mocks.readBlob.mockResolvedValue(payload);
        expect(await downloadBlob('blob')).toEqual(payload);
        expect(mocks.readBlob).toHaveBeenCalledWith({ blobId: 'blob' });
    });
    it('reports missing content without retrying an unrecoverable 404', async () => {
        mocks.fetch.mockResolvedValue({ ok: false, status: 404 });
        mocks.readBlob.mockRejectedValue({ status: 404, message: 'not found' });
        await expect(downloadBlob('missing')).rejects.toBeInstanceOf(BlobNotFoundError);
        expect(mocks.readBlob).toHaveBeenCalledTimes(1);
    });
    it('bounds retries when both download paths fail', async () => {
        vi.useFakeTimers();
        mocks.fetch.mockRejectedValue(new Error('Network error'));
        mocks.readBlob.mockRejectedValue(new Error('unavailable'));
        const pending = expect(downloadBlob('blob')).rejects.toThrow('unavailable');
        await vi.runAllTimersAsync();
        await pending;
        expect(mocks.readBlob).toHaveBeenCalledTimes(3);
    });
});
