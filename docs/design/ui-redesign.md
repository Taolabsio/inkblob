# InkBlob writing workspace redesign

## Direction

Requested direction: a bright, simple writing product, inspired by Notion and Craft.
The original logo and existing notebook capabilities are retained. The new interface uses
stone and white surfaces, graphite text, a single forest-green accent, system fonts,
and restrained interaction feedback. Light is the default; saved theme choices persist.

Before: a dark particle landing page, purple/pink/cyan accents, translucent panels,
competing storage/session indicators, and sparse empty states.
After: a clear public entry, notebook navigation, searchable note list, and focused writing
surface. Shared notebooks, read-only access, storage renewal, encrypted draft recovery,
export, and wallet/session controls retain their existing integration paths.

## Scope

- Rebuilt landing, unlock/creation, loading/error, workspace header, navigation, note list,
  editor presentation, settings, and empty states.
- Unified light/dark tokens also apply to sharing dialogs, menus, toasts, and editor tools.
- Storage information is accessible in the editor's “Storage details” disclosure.
- Search opens from the sidebar or Cmd/Ctrl+K. Note lists support recent/title sorting.
- Phone layout uses a drawer and switches between list and editor, including a back button.
- Added a wallet-free interactive preview using the actual sidebar, list, Lexical editor,
  settings, and command palette. Notes exist only in React memory and are discarded on exit.
  The preview has no chain save handler, storage renewal, or notebook sharing action.
- The landing image is a screenshot of the running workspace, not a simulated UI.

## Validation

- TypeScript, ESLint, production build, and 102 tests pass.
- Four new regression tests cover system-folder isolation, read-only navigation and
  mutation boundaries, and sorting without mutating source data.
- Browser checks cover writing, title/body search, quick search, note deletion/restoration,
  folder creation, light/dark appearance, phone navigation, and desktop/tablet layouts.
- Inspected layouts at 390, 768, and 1440 CSS pixels; screenshots saved during visual QA.
- Existing wallet, Sui, and Walrus behavior is not certified by the preview. Live wallet
  signatures and chain transactions still require a correctly configured deployment.
- Production build retains its existing large SDK bundle warning. No Lighthouse score
  is claimed by this change.

## Local review

Run `npm run dev` from `frontend`, open the local address, then select “Take a look inside”.
The preview intentionally labels transient note changes rather than claiming chain storage.
