# v2 deployment and release acceptance

## Compatibility

This build adds `Note.revision`, notebook session revocation state, and a notebook-to-reserve reference. Notebook encryption keys are now scoped by notebook id. These are **breaking storage and encryption changes**.

Do not point this frontend at a historical package or attempt an in-place upgrade of existing objects. Export notes with the old client while the old deployment is still accessible, preserve a verified local backup, publish a new package, and import/copy into newly created v2 notebooks. Automated migration and import are not implemented; exports must be retained until a migration flow has been verified. Do not erase old data or keys.

The historical `docs/profiles/testnet/` manifests describe v1 only. The environment example deliberately leaves v2 package and registry ids empty; the workspace remains unavailable until deployment setup is complete.

## Publish and record

Publishing is a separate, explicitly authorized wallet/network operation. Do not run publish commands as part of tests or local setup. Use the Sui CLI's successful publish output, including object changes, to create a manifest:

```sh
cd frontend
node scripts/prepare-deployment.mjs /absolute/path/publish.json testnet /absolute/path/new-deployment-directory
```

This script only parses an existing JSON file and writes a new directory. It never publishes and refuses to overwrite an existing output directory. It accepts the `objectChanges` publish-output format; if a CLI emits a different format, normalize it before running the script rather than guessing ids.

Copy package and `EncryptionKeyRegistry` ids into `.env.local`. Also set the network-specific WAL coin type and Walrus relay/aggregator. Testnet defaults are provided; mainnet requires explicit WAL configuration and separate validation. Never mix ids from different networks or deployments.

```sh
npm run deployment:check
```

The preflight performs read-only gRPC checks against the configured registry and v2 entry points. It does not fund a hot wallet, derive private keys, or submit a transaction.

## Authorization

Owner revocation uses `revoke_access_by_address`; it never requires the grantee-owned receipt as an input. The permissions table is authoritative, and stale receipts do not restore a revoked grant.

Device revocation uses `revoke_session_by_id`. Both authorization helpers and session writes reject revoked capabilities. Revoking does not automatically transfer remaining SUI/WAL out of the device wallet.

Sharing copies a notebook-scoped content key to recipients. Revocation cannot erase a recipient's saved content/key. Future read revocation requires rotating keys and re-encrypting content; this is not implemented and must not be promised by UI or documentation.

## Retention and recovery

Both wallet and session saves write raw encrypted blobs, so downloads use one encoding. Wallet uploads retry data transport without repeating registration. Metadata retries reuse a completed upload in the current session.

`blob_object_id` is the actual Walrus object, not a blob id or placeholder. The editor reads its retention epoch directly and can request a wallet-signed extension. Verify expiry, renewal cost, and ownership using real wallets on the target network.

Local drafts are encrypted and scoped by network, account, notebook, and note. They retain their original revision on recovery, so an old draft cannot silently overwrite newer chain data. Export a local copy before choosing “Reload saved copy.” Exported JSON is plaintext.

## Required release acceptance

Before closed testing, verify on a freshly published testnet package:

1. Create, save, reload, and reopen notes with two wallet accounts and two devices.
2. Save while continuing to type; the newest draft must remain dirty until its own commit succeeds.
3. Edit the same base revision from two devices; exactly one write succeeds.
4. Reject wallet requests and force network/transaction failures; no false “Saved” status or repeated automatic wallet prompts.
5. Recover an encrypted draft after refresh, including a draft based on an older revision.
6. Move, trash, and restore notes, then edit immediately without a false conflict.
7. Share read-only and write access, revoke by owner, and confirm revoked writes fail without access to the recipient wallet.
8. Revoke a session while its hot wallet retains its capability; subsequent writes must fail.
9. Switch/disconnect wallets; keys, caches, open notes, and in-flight operations must not leak into the next account.
10. Verify retention against the actual Walrus object and extend storage with the owner wallet.
11. Complete desktop/mobile, keyboard, focus, and assistive-technology checks.

Unit tests, a successful build, or read-only connectivity checks do not replace this acceptance run. Mainnet publishing and production operations remain separate release work.
