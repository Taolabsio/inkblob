import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import { GRPC_URL, NETWORK, STORAGE_EPOCHS } from '../../config/network';

export const WALRUS_CONFIG = {
    network: NETWORK,
    uploadRelay: import.meta.env.VITE_WALRUS_UPLOAD_RELAY_URL || `https://upload-relay.${NETWORK}.walrus.space`,
    aggregator: import.meta.env.VITE_WALRUS_AGGREGATOR_URL || `https://aggregator.walrus-${NETWORK}.walrus.space`,
    defaultEpochs: STORAGE_EPOCHS,
    maxBlobSize: 100 * 1024 * 1024,
    aggregatorTimeout: Number(import.meta.env.VITE_WALRUS_AGGREGATOR_TIMEOUT) || 10000,
};

export function createWalrusClient(_signer?: unknown) {
    return new SuiGrpcClient({ network: NETWORK, baseUrl: GRPC_URL }).$extend(walrus({
        wasmUrl: walrusWasmUrl,
        uploadRelay: { host: WALRUS_CONFIG.uploadRelay, sendTip: { max: 1000 } },
    }));
}
