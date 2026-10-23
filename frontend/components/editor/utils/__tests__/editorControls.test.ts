import { describe, expect, it } from 'vitest';
import { getEditorShortcut } from '../shortcuts';
import { clampPopoverPosition } from '../../ui/usePopoverPosition';
import { normalizeLinkUrl } from '../linkUrl';
const event = { metaKey: true, ctrlKey: false, altKey: false, shiftKey: false, key: '', code: '', isComposing: false };
describe('editor keyboard controls', () => {
  it('uses physical digit codes even when the Alt key changes the produced character', () => {
    expect(getEditorShortcut({ ...event, altKey: true, key: '¢', code: 'Digit4' })).toEqual({ kind: 'block', type: 'check' });
    expect(getEditorShortcut({ ...event, metaKey: false, ctrlKey: true, altKey: true, code: 'Digit7' })).toEqual({ kind: 'block', type: 'toggle' });
  });
  it('leaves normal typing, IME composition, and global search alone', () => {
    expect(getEditorShortcut({ ...event, metaKey: false, key: 'e' })).toBeNull();
    expect(getEditorShortcut({ ...event, isComposing: true, key: 'e' })).toBeNull();
    expect(getEditorShortcut({ ...event, key: 'k' })).toBeNull();
    expect(getEditorShortcut({ ...event, shiftKey: true, key: 'k' })).toEqual({ kind: 'link' });
  });
  it('keeps a popover inside a phone viewport', () => {
    expect(clampPopoverPosition({ top: 820, left: 380 }, 304, 360, 390, 844)).toEqual({ top: 476, left: 78 });
    expect(clampPopoverPosition({ top: -10, left: -20 }, 304, 360, 390, 844)).toEqual({ top: 8, left: 8 });
  });
});
describe('link entry', () => {
  it('normalizes hostnames and preserves supported navigation schemes', () => {
    expect(normalizeLinkUrl(' example.com/notes ')).toBe('https://example.com/notes');
    expect(normalizeLinkUrl('mailto:writer@example.com')).toBe('mailto:writer@example.com');
    expect(normalizeLinkUrl('tel:+123456789')).toBe('tel:+123456789');
  });
  it.each(['', 'two words', 'https://', 'javascript:alert(1)', 'data:text/html,example'])('rejects an invalid link: %s', value => {
    expect(normalizeLinkUrl(value)).toBeNull();
  });
});
