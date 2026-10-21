export type Network = 'testnet' | 'mainnet';
const env = import.meta.env;
export const NETWORK: Network = env.VITE_SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
export const GRPC_URL = env.VITE_SUI_GRPC_URL || `https://fullnode.${NETWORK}.sui.io:443`;
export const PACKAGE_ID: string = env.VITE_SUI_PACKAGE_ID || '';
export const ENCRYPTION_KEY_REGISTRY_ID: string | null = env.VITE_ENCRYPTION_KEY_REGISTRY_ID || null;
export const WAL_PACKAGE_ID = env.VITE_WAL_PACKAGE_ID || (NETWORK === 'testnet'
    ? '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a'
    : '');
export const WAL_COIN_TYPE = `${WAL_PACKAGE_ID}::wal::WAL`;
export const STORAGE_EPOCHS = Math.max(1, Math.min(53, Number(env.VITE_WALRUS_STORAGE_EPOCHS) || 30));

export function deploymentError(): string | null {
    if (!/^0x[\da-f]{64}$/i.test(PACKAGE_ID) || BigInt(PACKAGE_ID) === 0n) {
        return 'This workspace is being prepared. Please return once setup is complete.';
    }
    if (!ENCRYPTION_KEY_REGISTRY_ID || !/^0x[\da-f]{64}$/i.test(ENCRYPTION_KEY_REGISTRY_ID) || BigInt(ENCRYPTION_KEY_REGISTRY_ID) === 0n) {
        return 'Encryption setup is incomplete. Your wallet and existing notes have not been changed.';
    }
    if (!WAL_PACKAGE_ID) return 'Set the WAL package for this network before opening the workspace.';
    return null;
}
