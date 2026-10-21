import React, { useEffect, useMemo } from 'react';
import { DAppKitProvider, useCurrentAccount } from '@mysten/dapp-kit-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dAppKit } from './wallet';

function AccountQueries({ children }: { children: React.ReactNode }) {
    const account = useCurrentAccount();
    // A new cache per account prevents decrypted content from crossing wallet boundaries.
    const cacheScope = account?.address ?? 'disconnected';
    const client = useMemo(() => { void cacheScope; return new QueryClient({ defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: true } } }); }, [cacheScope]);
    useEffect(() => () => { void client.cancelQueries().then(() => client.clear()); }, [client]);
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
export function Providers({ children }: { children: React.ReactNode }) {
    return <DAppKitProvider dAppKit={dAppKit}><AccountQueries>{children}</AccountQueries></DAppKitProvider>;
}
