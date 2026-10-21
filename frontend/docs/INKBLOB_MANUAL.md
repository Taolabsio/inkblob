# InkBlob product manual

InkBlob is a private writing workspace. Connect and unlock a Sui wallet to use your encrypted
notebook, or select **Take a look inside** to explore an interactive preview. Preview notes stay
in memory only and disappear when you leave the preview.

## Write with blocks

Type `/` to search for a block by name or alias. For example, `/h2`, `/todo`, `/code`, `/table`,
and `/待辦` narrow the menu. Use the arrow keys and Enter to insert, or click an option.

Available blocks: text, three heading levels, bullet and numbered lists, to-do lists,
quotes, code, callouts, toggles, dividers, and tables.

- Use the formatting toolbar to change the current block type. Select text to use the floating
  toolbar for bold, italic, underline, strikethrough, inline code, links, and colors.
- Check tasks by clicking their checkbox or focusing it and pressing Space. Enter adds a task;
  Enter again on an empty task returns to a paragraph. `[] ` also starts a task list.
- Convert a paragraph into a toggle to retain its text as the toggle title. Enter in the title
  starts its body. Backspace at the beginning of the title unwraps it.
- Click a block's drag handle to duplicate, delete, convert, or color it. Drag it to reorder.
- Insert a table by clicking its dimensions or using arrow keys and Enter. Tab moves between
  table cells. Wide tables scroll within the page.
- In code blocks, choose a language from the toolbar to enable syntax highlighting.
- Paste `example.com/page` into the link popover to create an HTTPS link. Email and telephone
  links use `mailto:` and `tel:` respectively.

The keyboard button at the right of the formatting toolbar opens the shortcut reference.

## Keyboard shortcuts

“Mod” means Command on macOS or Ctrl on Windows and Linux. Editor shortcuts apply while
writing in the note content; Save also works from the title. IME composition is left alone.

| Shortcut | Action |
|---|---|
| `/` | Search and insert a block |
| Mod B / I / U | Bold / italic / underline |
| Mod E | Inline code |
| Mod Shift X | Strikethrough |
| Mod Shift K | Insert or edit a link |
| Mod D | Duplicate the current block |
| Mod Z / Mod Shift Z | Undo / redo |
| Mod S | Save the note |
| Mod Alt 0 | Plain text |
| Mod Alt 1 / 2 / 3 | Heading 1 / 2 / 3 |
| Mod Alt 4 / 5 / 6 | To-do / bullet / numbered list |
| Mod Alt 7 / 8 / 9 | Toggle / code / quote |
| Mod K | Search notes and folders |

## Notes and storage

Use the plus button above the note list to start a note. Folders, nested pages, pinned notes,
search, and Trash help organize your workspace. Export downloads an unencrypted local JSON
copy. Keep exported files private.

Connected notebooks encrypt titles and content in the browser. Saves use SUI and WAL.
Walrus storage is time-limited; open **Storage details** in the editor to inspect and extend it.
Owners can share a whole notebook with another wallet, with read or write access.
Read-only notebooks hide editing tools. Shared writable notebooks require manual Save with a
wallet signature; autosave is disabled there.
