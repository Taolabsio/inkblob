import { Transaction } from '@mysten/sui/transactions';
import { createWalrusClient, WALRUS_CONFIG } from './config';

export function renewBlobTransaction(blobObjectId: string, epochs = WALRUS_CONFIG.defaultEpochs) {
    if (!/^0x[\da-f]{64}$/i.test(blobObjectId)) throw new Error('This note has no renewable storage object. Save it first.');
    const transaction = new Transaction();
    transaction.add(createWalrusClient().walrus.extendBlob({ blobObjectId, epochs }));
    return transaction;
}
