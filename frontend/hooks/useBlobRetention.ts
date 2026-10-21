import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '../wallet';

/** Read retention from the actual Walrus object rather than trusting notebook metadata. */
export function useBlobRetention(blobObjectId: string | undefined) {
    const client = useSuiClient();
    return useQuery({
        queryKey: ['blob-retention', blobObjectId],
        queryFn: async () => {
            const object = await client.getObject({ id: blobObjectId! });
            const endEpoch = Number(object.data.content.fields?.storage?.fields?.end_epoch);
            if (!Number.isFinite(endEpoch)) throw new Error('Unable to verify storage expiry');
            return endEpoch;
        },
        enabled: !!blobObjectId && /^0x[\da-f]{64}$/i.test(blobObjectId),
        staleTime: 60_000,
        refetchInterval: 60_000,
    });
}
