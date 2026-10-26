// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutosave, type SaveResult } from '../useAutosave';
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const advance = () => act(async () => { await vi.advanceTimersByTimeAsync(2000); });

describe('autosave reliability', () => {
    it('does not save initial or hydrated content', async () => {
        const save = vi.fn<() => Promise<SaveResult>>().mockResolvedValue('saved');
        const { rerender } = renderHook(({ content, ready }) => useAutosave({ noteId: 'a', title: 'A', content, ready, onSave: save }),
            { initialProps: { content: '', ready: false } });
        rerender({ content: 'downloaded', ready: true });
        await advance();
        expect(save).not.toHaveBeenCalled();
    });
    it('resumes a dirty draft when its editor is reopened', async () => {
        const save = vi.fn<() => Promise<SaveResult>>().mockResolvedValue('saved');
        const { result } = renderHook(() => useAutosave({ noteId: 'a', title: 'A', content: 'draft', initiallyDirty: true, onSave: save }));
        expect(result.current.isDirty).toBe(true);
        await advance();
        expect(save).toHaveBeenCalledTimes(1);
        expect(result.current.isDirty).toBe(false);
    });
    it('keeps newer edits dirty while an older draft is being saved', async () => {
        let complete!: (value: SaveResult) => void;
        const save = vi.fn<() => Promise<SaveResult>>().mockImplementationOnce(() => new Promise(resolve => { complete = resolve; })).mockResolvedValue('saved');
        const dirty = vi.fn();
        const { result, rerender } = renderHook(({ content }) => useAutosave({ noteId: 'a', title: 'A', content, onSave: save, onDirtyChange: dirty }), { initialProps: { content: 'initial' } });
        rerender({ content: 'first edit' });
        await advance();
        rerender({ content: 'second edit' });
        await act(async () => complete('saved'));
        expect(result.current.isDirty).toBe(true);
        expect(dirty).not.toHaveBeenCalledWith('a', false);
        await advance();
        expect(save).toHaveBeenCalledTimes(2);
        expect(result.current.isDirty).toBe(false);
    });
    it.each(['conflict', 'cancelled'] as const)('stops retries on %s', async outcome => {
        const save = vi.fn<() => Promise<SaveResult>>().mockResolvedValue(outcome);
        const { result, rerender } = renderHook(({ content }) => useAutosave({ noteId: 'a', title: '', content, onSave: save }), { initialProps: { content: '' } });
        rerender({ content: 'edit' });
        await advance();
        await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
        expect(save).toHaveBeenCalledTimes(1);
        expect(result.current.isDirty).toBe(true);
    });
    it('does not treat a StrictMode remount as an edit', async () => {
        const save = vi.fn<() => Promise<SaveResult>>().mockResolvedValue('saved');
        const { result, rerender } = renderHook(({ content }) => useAutosave({ noteId: 'a', title: 'A', content, onSave: save }),
            { initialProps: { content: 'saved text' }, wrapper: StrictMode });
        await advance();
        expect(save).not.toHaveBeenCalled();
        expect(result.current.isDirty).toBe(false);
        rerender({ content: 'edited text' });
        await advance();
        expect(save).toHaveBeenCalledTimes(1);
    });
    it('saves a recovered draft exactly once under StrictMode', async () => {
        const save = vi.fn<() => Promise<SaveResult>>().mockResolvedValue('saved');
        const { result } = renderHook(() => useAutosave({ noteId: 'a', title: 'A', content: 'draft', initiallyDirty: true, onSave: save }),
            { wrapper: StrictMode });
        await advance();
        await advance();
        expect(save).toHaveBeenCalledTimes(1);
        expect(result.current.isDirty).toBe(false);
    });
    it('does not automatically open wallet dialogs when autosave is disabled', async () => {
        const save = vi.fn<() => Promise<SaveResult>>().mockResolvedValue('saved');
        const { result, rerender, unmount } = renderHook(({ content }) => useAutosave({ noteId: 'a', title: '', content, onSave: save, enabled: false }), { initialProps: { content: '' } });
        rerender({ content: 'edit' });
        await advance();
        expect(result.current.isDirty).toBe(true);
        unmount();
        expect(save).not.toHaveBeenCalled();
    });
});
