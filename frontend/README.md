# InkBlob frontend

React 19, Lexical, TypeScript, Vite, Sui gRPC, current dApp Kit, and Walrus.

Use Node.js 24. Run `npm ci`, copy `.env.local.example` to `.env.local`, and populate a fresh v2 deployment. Run `npm run deployment:check` before connecting a wallet, then `npm run dev`.

`npm run check` runs the typechecker, linter, regression tests, and production build. `npm test -- --run` runs the tests once.

No Gemini API key is required. Private service credentials must never be embedded in frontend environment variables.

See the root README and `../docs/develop/deployment-v2.md` for privacy, retention, sharing, and migration limits.
