import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount } from '../wallet';
import { useSuiService } from '../hooks/useSuiService';
import { useActiveNotebook } from '../hooks/useActiveNotebook';
import { useActiveNotebookContext } from './ActiveNotebookContext';

const SyncContext = createContext<Record<string, never> | null>(null);
export function SyncProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const service = useSuiService();
    const { notebookId, isShared, permission } = useActiveNotebook();
    const { exitShared } = useActiveNotebookContext();
    const account = useCurrentAccount();
    useEffect(() => {
        if (!notebookId) return;
        let cancelled = false;
        let polling = false;
        const poll = async () => {
            if (polling || document.visibilityState === 'hidden') return;
            polling = true;
            try {
                if (isShared && account) {
                    const grants = await service.fetchNotebookPermissions(notebookId);
                    const grant = grants.find(entry => entry.address.toLowerCase() === account.address.toLowerCase());
                    if (cancelled) return;
                    if (!grant || grant.permission !== permission ||
                        (grant.expiresAt !== '18446744073709551615' && Number(grant.expiresAt) <= Date.now())) {
                        exitShared();
                        queryClient.removeQueries({ queryKey: ['note-content'] });
                        return;
                    }
                }
                if (cancelled) return;
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['notes', notebookId] }),
                    queryClient.invalidateQueries({ queryKey: ['folders', notebookId] }),
                ]);
            } catch { /* Keep the last successful state on transient network failures. */ }
            finally { polling = false; }
        };
        // gRPC-backed polling works in browsers without the retired JSON-RPC WebSocket API.
        const timer = setInterval(() => { void poll(); }, 10000);
        const onFocus = () => { void poll(); };
        window.addEventListener('focus', onFocus);
        return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', onFocus); };
    }, [notebookId, isShared, permission, account, service, queryClient, exitShared]);
    return <SyncContext.Provider value={{}}>{children}</SyncContext.Provider>;
}
export function useSync() {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync requires SyncProvider');
    return context;
}
