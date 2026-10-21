import { describe, expect, it } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { EditorNodes } from '../../nodes';
import { turnBlockInto, wrapBlockAsToggle } from '../blockTransforms';

const flush = () => Promise.resolve();
function setup() {
  const errors: Error[] = [];
  const editor = createEditor({ nodes: EditorNodes, onError: error => { errors.push(error); } });
  let second = '';
  editor.update(() => {
    const first = $createParagraphNode().append($createTextNode('Keep this paragraph'));
    const target = $createParagraphNode().append($createTextNode('Turn only this block'));
    $getRoot().append(first, target);
    second = target.getKey();
    first.selectEnd();
  }, { discrete: true });
  return { editor, errors, second };
}
describe('targeted block transformations', () => {
  it('converts the requested block while preserving its siblings and text', async () => {
    const { editor, errors, second } = setup();
    turnBlockInto(editor, second, () => $createHeadingNode('h2'));
    await flush();
    expect(errors).toEqual([]);
    expect(editor.getEditorState().read(() => $getRoot().getChildren().map(node => [node.getType(), node.getTextContent()]))).toEqual([
      ['paragraph', 'Keep this paragraph'], ['heading', 'Turn only this block'],
    ]);
  });
  it('wraps the requested block as a toggle without replacing the document root', async () => {
    const { editor, errors, second } = setup();
    wrapBlockAsToggle(editor, second);
    await flush();
    expect(errors).toEqual([]);
    expect(editor.getEditorState().read(() => $getRoot().getChildren().map(node => [node.getType(), node.getTextContent().trim()]))).toEqual([
      ['paragraph', 'Keep this paragraph'], ['collapsible-container', 'Turn only this block'],
    ]);
  });
});
