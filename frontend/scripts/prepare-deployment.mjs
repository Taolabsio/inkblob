import fs from 'node:fs';
import path from 'node:path';
const [input, network, output] = process.argv.slice(2);
if (!input || !['testnet', 'mainnet'].includes(network) || !output) {
    throw new Error('Usage: node scripts/prepare-deployment.mjs <publish.json> <testnet|mainnet> <new-output-directory>');
}
const publish = JSON.parse(fs.readFileSync(input, 'utf8'));
const changes = publish.objectChanges;
const packageId = changes?.find(change => change.type === 'published' && change.modules?.includes('notebook'))?.packageId;
const registry = changes?.find(change => change.type === 'created' && change.objectType?.endsWith('::notebook::EncryptionKeyRegistry'));
if (!packageId || !registry?.objectId || publish.effects?.status?.status !== 'success' || !publish.digest) {
    throw new Error('Publish output must include a successful notebook package and its created EncryptionKeyRegistry. No files were written.');
}
const env = `VITE_SUI_NETWORK=${network}\nVITE_SUI_GRPC_URL=https://fullnode.${network}.sui.io:443\nVITE_SUI_PACKAGE_ID=${packageId}\nVITE_ENCRYPTION_KEY_REGISTRY_ID=${registry.objectId}\nVITE_WALRUS_STORAGE_EPOCHS=30\n`;
fs.mkdirSync(output); // Refuse to overwrite an existing deployment directory.
fs.writeFileSync(path.join(output, 'deployment.json'), JSON.stringify({ schemaVersion: 2, network, packageId,
    encryptionKeyRegistryId: registry.objectId, transactionDigest: publish.digest, createdAt: new Date().toISOString() }, null, 2) + '\n');
fs.writeFileSync(path.join(output, '.env.deployment'), env);
console.log(`Deployment manifest written to ${output}. Add network-specific WAL and relay settings before using it.`);
