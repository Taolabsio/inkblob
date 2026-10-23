import { useQuery } from '@tanstack/react-query';
import { useActiveNotebook } from './useActiveNotebook';
import { isValidBlobId } from '../utils/noteState';

/**
 * Hook to fetch and decrypt note content from Walrus
 */
export function useNoteContent(blobId: string | null | undefined, alreadyLoaded = false) {
    // Active-notebook seam: own mode = the own encryption key (identical to before), shared mode
    // = the unwrapped shared content key. The queryKey stays ['note-content', blobId] - safe
    // because a given blobId belongs to exactly one notebook, so the blobId -> correct-key
    // mapping is deterministic and cached plaintext can't be poisoned across modes.
    const { encryptionKey } = useActiveNotebook();

    return useQuery({
        queryKey: ['note-content', blobId],
        queryFn: async () => {
            if (!blobId || !encryptionKey) {
                return '';
            }

            // Validate blob ID before attempting download
            if (!isValidBlobId(blobId)) {
                console.debug('[useNoteContent] Invalid or placeholder blob ID detected, skipping download:', blobId);
                return '';
            }

            try {
                console.debug('[useNoteContent] Loading content for blob:', blobId);
                const { downloadInkBlobContent } = await import('../services/walrus/download');
                const content = await downloadInkBlobContent(blobId, encryptionKey);
                return content;
            } catch (error) {
                console.error('[useNoteContent] Failed to load note content:', {
                    blobId,
                    error: error.message,
                    errorType: error.constructor.name
                });

                throw error;
            }
        },
        enabled: !alreadyLoaded && !!blobId && !!encryptionKey && isValidBlobId(blobId),
        staleTime: 5 * 60 * 1000, // Cache content for 5 minutes
        retry: 2, // Retry failed downloads twice
    });
}
