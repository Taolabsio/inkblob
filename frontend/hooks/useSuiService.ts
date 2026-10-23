import { useSuiClient } from '../wallet';
import { useMemo } from 'react';
import { SuiService } from '../services/suiService';

export function useSuiService() {
    const client = useSuiClient();

    return useMemo(() => new SuiService(client), [client]);
}
