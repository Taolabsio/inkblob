# InkBlob

Private, encrypted notes on Sui and Walrus. A React/Lexical workspace with nested folders, sub-pages, search, recoverable deletion, and notebook sharing.

The current code is an **Alpha integration build**, not a production release. It requires a fresh v2 contract deployment. Historical testnet addresses under `docs/profiles/testnet/` must not be used with this frontend.

## Run locally

Requirements: Node.js 24, npm, and Sui CLI 1.67.1 for contract tests.

```sh
cd frontend
npm ci
cp .env.local.example .env.local
# Fill in ids from a NEW v2 deployment.
npm run deployment:check
npm run dev
```

The application uses the current gRPC Sui client and dApp Kit. JSON-RPC public fullnodes and their WebSocket subscriptions are no longer used. Cross-device metadata refreshes every 10 seconds while the tab is visible, and on window focus.

## Verification

```sh
cd frontend
npm run check
```

```sh
cd contracts/inkblob
sui move test
```

CI runs frontend typechecking, lint, tests, production build, and Move tests. Regression tests cover revision conflicts in the same epoch, revoked sessions, owner-reachable access revocation, editing during saves, failed transactions, gRPC pagination, raw Walrus uploads, and encrypted draft recovery.

## Data and storage

- Titles, folder names, and content are encrypted in the browser with AES-256-GCM.
- Each v2 notebook has its own key derived from the owner's wallet signature. Sharing one notebook does not reveal keys for other notebooks.
- Unsaved drafts are encrypted before being placed in local storage. A successful save only acknowledges the submitted draft, preserving newer edits.
- On-chain revisions increase with mutations. Local edit timestamps are never used as concurrency tokens.
- Walrus storage is **time-limited**, defaulting to 30 Walrus epochs. Epoch duration depends on the network; this is not a promise of 30 days or permanent retention.
- Owners can extend storage from the editor. The real Walrus blob object id is recorded on-chain; retention is read from that object.
- The editor can export an **unencrypted local JSON copy**. Treat exported files as private documents.
- Share access covers the entire notebook. Revocation blocks future writes and removes the wrapped key from the access table. A recipient can retain previously obtained content and keys; cryptographic revocation of future reads requires a separate key-rotation design.

## Deployment and migration

See [deployment-v2.md](docs/develop/deployment-v2.md) for deployment manifests, preflight checks, compatibility constraints, and the remaining release acceptance work. No mainnet deployment or wallet transaction is performed by the development scripts automatically.

The older architecture documents and test coverage matrix are historical references. Passing unit tests does not certify production readiness, current deployment state, or end-to-end wallet compatibility.
