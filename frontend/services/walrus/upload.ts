import { createWalrusClient, WALRUS_CONFIG } from './config';
import { encryptContent } from '../../crypto/encryption';
import { withRetry } from './errors';
import type { Signer } from '@mysten/sui/cryptography';
import type { Transaction } from '@mysten/sui/transactions';

export interface UploadResult {
    blobId: string;
    blobObject: string;
    epochs: number;
    endEpoch: number;
    encryptedSizeBytes: number;
}
type ExecuteWallet = (options: { transaction: Transaction }) => Promise<{ digest: string }>;

/** Raw-blob encoding is identical for wallets and sessions, so both decrypt through one path. */
export async function uploadBlob(encryptedContent: Uint8Array, epochs = WALRUS_CONFIG.defaultEpochs,
    signer?: Signer, owner?: string, execute?: ExecuteWallet): Promise<UploadResult> {
    if (encryptedContent.length > WALRUS_CONFIG.maxBlobSize) throw new Error(`Blob exceeds max size of ${WALRUS_CONFIG.maxBlobSize} bytes`);
    if (!signer && (!owner || !execute)) throw new Error('Connect a wallet before saving.');
    const client = createWalrusClient();
    if (signer) {
        // SDK resumes its own registered/uploaded steps; do not repeat a full paid upload.
        const result = await client.walrus.writeBlob({ blob: encryptedContent, epochs, deletable: false, signer, owner });
        return { blobId: result.blobId, blobObject: result.blobObject.id,
            endEpoch: result.blobObject.storage.end_epoch, epochs, encryptedSizeBytes: encryptedContent.length };
    }
    const flow = client.walrus.writeBlobFlow({ blob: encryptedContent });
    await flow.encode();
    const registration = await execute!({ transaction: flow.register({ epochs, owner: owner!, deletable: false }) });
    // Retrying the upload step never re-registers or reopens a paid wallet transaction.
    await withRetry(() => flow.upload({ digest: registration.digest }));
    await execute!({ transaction: flow.certify() });
    const result = await flow.getBlob();
    return { blobId: result.blobId, blobObject: result.blobObjectId,
        endEpoch: result.blobObject.storage.end_epoch, epochs, encryptedSizeBytes: encryptedContent.length };
}
export async function uploadInkBlobContent(plaintext: string, key: CryptoKey, signer?: Signer,
    epochs?: number, owner?: string, execute?: ExecuteWallet) {
    return uploadBlob(await encryptContent(plaintext, key), epochs, signer, owner, execute);
}
