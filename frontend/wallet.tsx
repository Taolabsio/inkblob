import { createDAppKit, useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { useCallback, useMemo } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { GRPC_URL, NETWORK } from './config/network';
import { InkBlobClient } from './services/chainClient';
import { requireSuccessfulTransaction } from './utils/transactions';
export { useCurrentAccount };
export { ConnectButton } from '@mysten/dapp-kit-react/ui';

export const dAppKit = createDAppKit({ networks: [NETWORK],
    createClient: network => new SuiGrpcClient({ network, baseUrl: GRPC_URL }) });

declare module '@mysten/dapp-kit-react' { interface Register { dAppKit: typeof dAppKit } }

export function useSuiClient() {
    const raw = useCurrentClient();
    return useMemo(() => new InkBlobClient(raw), [raw]);
}
export function useSignPersonalMessage() {
    const kit = useDAppKit();
    const mutateAsync = useCallback(({ message }: { message: Uint8Array }) => kit.signPersonalMessage({ message }), [kit]);
    return { mutateAsync };
}
export function useSignAndExecuteTransaction() {
    const kit = useDAppKit();
    const account = useCurrentAccount();
    const mutateAsync = useCallback(async ({ transaction }: { transaction: Transaction }) => {
        if (!account || kit.stores.$connection.get().account?.address !== account.address) throw new Error('Wallet changed. Unlock your notebook again.');
        const result = requireSuccessfulTransaction(await kit.signAndExecuteTransaction({ transaction }));
        return { digest: result.Transaction!.digest, result };
    }, [kit, account]);
    return { mutateAsync };
}
