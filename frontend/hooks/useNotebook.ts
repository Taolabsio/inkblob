import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '../wallet';
import { deploymentError } from '../config/network';
import { useSuiService } from './useSuiService';

export function useNotebook() {
    const account = useCurrentAccount();
    const service = useSuiService();
    return useQuery({
        queryKey: ['notebook', account?.address],
        queryFn: async () => {
            if (!account) return null;
            const registry = await service.queryNotebookRegistry(account.address);
            if (!registry) return null; // Only actual absence is allowed to trigger creation.
            const fields = registry.data?.content?.fields;
            const name = fields?.active_notebook;
            const tableId = fields?.notebooks?.fields?.id?.id;
            if (!name || !tableId) throw new Error('Invalid notebook registry. No data has been changed.');
            const field = await service.getDynamicFieldObject(tableId, name);
            const id = field.data?.content?.fields?.value;
            if (typeof id !== 'string') throw new Error('Invalid notebook reference. No data has been changed.');
            const notebook = await service.fetchNotebook(id);
            if (!notebook.data?.content?.fields?.revoked_sessions) {
                throw new Error('This notebook requires migration to the current contract. Its data has not been changed.');
            }
            return notebook;
        },
        enabled: !!account && !deploymentError(),
        staleTime: 30_000,
    });
}
