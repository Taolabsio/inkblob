import { SuiGrpcClient } from '@mysten/sui/grpc';
const network = process.env.VITE_SUI_NETWORK || 'testnet';
const packageId = process.env.VITE_SUI_PACKAGE_ID;
const registryId = process.env.VITE_ENCRYPTION_KEY_REGISTRY_ID;
const validId = value => /^0x[0-9a-f]{64}$/i.test(value || '') && BigInt(value) !== 0n;
if (!['testnet', 'mainnet'].includes(network) || !validId(packageId) || !validId(registryId)) {
    throw new Error('Provide a v2 package and encryption registry in .env.local. Historical deployment ids are incompatible.');
}
const client = new SuiGrpcClient({ network, baseUrl: process.env.VITE_SUI_GRPC_URL || `https://fullnode.${network}.sui.io:443` });
const [{ object: registry }] = await Promise.all([
    client.getObject({ objectId: registryId, include: { json: true } }),
    ...['update_note', 'revoke_access_by_address', 'revoke_session_by_id'].map(name =>
        client.getMoveFunction({ packageId, moduleName: 'notebook', name })),
]);
const normalize = value => value.replace(/^0x0+/, '0x');
if (normalize(registry.type) !== normalize(`${packageId}::notebook::EncryptionKeyRegistry`) || !registry.json?.keys) {
    throw new Error('The registry does not belong to the configured package.');
}
console.log(`Verified ${network} gRPC connectivity, v2 contract entry points, and encryption registry.`);
