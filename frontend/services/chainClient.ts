import { SuiGrpcClient } from '@mysten/sui/grpc';
import { bcs } from '@mysten/sui/bcs';
import { deriveDynamicFieldID } from '@mysten/sui/utils';
import { requireSuccessfulTransaction } from '../utils/transactions';

// Keep Move parsing at the boundary while transaction building uses the native gRPC client.
const optionalIds = new Set(['folder_id', 'parent_id', 'parent_note_id', 'wal_fee_reserve_id']);
export function moveFields(value: any): any {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(moveFields);
    if (value.fields) return value;
    return { fields: Object.fromEntries(Object.entries(value).map(([key, entry]) => {
        if (optionalIds.has(key)) return [key, { fields: { vec: entry == null ? [] : Array.isArray(entry) ? entry : [entry] } }];
        if (key === 'id') return [key, typeof entry === 'string' ? { id: entry } : entry];
        return [key, moveFields(entry)];
    })) };
}

export class InkBlobClient {
    constructor(public readonly raw: SuiGrpcClient) {}
    private objectResponse(object: any) {
        return { data: { objectId: object.objectId, version: object.version, digest: object.digest,
            type: object.type, owner: object.owner, content: { dataType: 'moveObject', type: object.type,
                fields: moveFields(object.json)?.fields } } };
    }
    async getObject({ id }: { id: string; options?: unknown }) {
        const { object } = await this.raw.getObject({ objectId: id, include: { json: true } });
        return this.objectResponse(object);
    }
    async getOwnedObjects({ owner, filter, cursor, limit }: { owner: string; filter?: { StructType: string }; options?: unknown; cursor?: string | null; limit?: number }) {
        const page = await this.raw.listOwnedObjects({ owner, type: filter?.StructType, cursor, limit: limit ?? 50, include: { json: true } });
        return { data: page.objects.map(object => this.objectResponse(object)), hasNextPage: page.hasNextPage, nextCursor: page.cursor };
    }
    async getDynamicFields({ parentId, cursor }: { parentId: string; cursor?: string | null }) {
        const page = await this.raw.listDynamicFields({ parentId, cursor, limit: 50 });
        return { data: page.dynamicFields.map(field => ({ objectId: field.fieldId })), hasNextPage: page.hasNextPage, nextCursor: page.cursor };
    }
    async getDynamicFieldObject({ parentId, name }: { parentId: string; name: { type: string; value: string } }) {
        const key = name.type === 'address' || name.type.endsWith('::object::ID')
            ? bcs.Address.serialize(name.value).toBytes() : bcs.string().serialize(name.value).toBytes();
        return this.getObject({ id: deriveDynamicFieldID(parentId, name.type, key) });
    }
    async multiGetObjects({ ids }: { ids: string[]; options?: unknown }) {
        const output = [];
        for (let offset = 0; offset < ids.length; offset += 50) {
            const { objects } = await this.raw.getObjects({ objectIds: ids.slice(offset, offset + 50), include: { json: true } });
            for (const object of objects) {
                if (object instanceof Error) throw object;
                output.push(this.objectResponse(object));
            }
        }
        return output;
    }
    async getCoins({ owner, coinType, cursor }: { owner: string; coinType?: string; cursor?: string | null }) {
        const page = await this.raw.listCoins({ owner, coinType, cursor, limit: 50 });
        return { data: page.objects.map(coin => ({ coinObjectId: coin.objectId, balance: coin.balance })), nextCursor: page.cursor, hasNextPage: page.hasNextPage };
    }
    async getBalance({ owner, coinType }: { owner: string; coinType?: string }) {
        const { balance } = await this.raw.getBalance({ owner, coinType });
        return { totalBalance: balance.balance };
    }
    async queryEvents({ query, cursor, descendingOrder, order }: { query: { MoveEventType?: string }; cursor?: string | null; descendingOrder?: boolean; order?: string }) {
        const descending = descendingOrder ?? (order !== 'ascending');
        const page = await this.raw.listEvents({ filter: query.MoveEventType ? { eventType: query.MoveEventType } : undefined,
            ...(descending ? { before: cursor } : { after: cursor }), order: descending ? 'descending' : 'ascending', limit: 50 });
        return { data: page.events.map(event => ({ parsedJson: event.json, type: event.eventType })), nextCursor: page.endCursor, hasNextPage: page.hasNextPage };
    }
    async executeWithSigner(transaction: import('@mysten/sui/transactions').Transaction, signer: import('@mysten/sui/cryptography').Signer) {
        return requireSuccessfulTransaction(await this.raw.signAndExecuteTransaction({ transaction, signer, include: { effects: true } }));
    }
}
