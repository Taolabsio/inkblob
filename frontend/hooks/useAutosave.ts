import { useEffect, useRef, useState } from 'react';

export type SaveResult = 'saved' | 'skipped' | 'conflict' | 'cancelled';
interface UseAutosaveOptions {
    noteId: string;
    content: string;
    title: string;
    onSave: (id: string, options?: { silent?: boolean }) => Promise<SaveResult>;
    onDirtyChange?: (noteId: string, isDirty: boolean) => void;
    delayMs?: number;
    enabled?: boolean;
    ready?: boolean;
    initiallyDirty?: boolean;
}

/** Acknowledge only the submitted draft, never edits made during an in-flight save. */
export function useAutosave({ noteId, content, title, onSave, onDirtyChange,
    delayMs = 2000, enabled = true, ready = true, initiallyDirty = false }: UseAutosaveOptions) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const latest = useRef({ noteId, content, title, onSave, onDirtyChange, enabled, ready });
    latest.current = { noteId, content, title, onSave, onDirtyChange, enabled, ready };
    const mounted = useRef(false);
    const dirty = useRef(false);
    const saving = useRef(false);
    const initialized = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const retries = useRef(0);
    const runRef = useRef<(silent: boolean) => Promise<void>>(async () => {});
    const cancelTimer = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = undefined;
    };
    const markDirty = (value: boolean) => {
        dirty.current = value;
        if (mounted.current) setIsDirty(value);
        latest.current.onDirtyChange?.(latest.current.noteId, value);
    };
    const schedule = (delay: number) => {
        cancelTimer();
        timer.current = setTimeout(() => { timer.current = undefined; void runRef.current(true); }, delay);
    };
    runRef.current = async (silent) => {
        if (!latest.current.ready || saving.current) return;
        const submitted = latest.current;
        saving.current = true;
        if (mounted.current) setIsSaving(true);
        try {
            const result = await submitted.onSave(submitted.noteId, { silent });
            const unchanged = submitted.content === latest.current.content && submitted.title === latest.current.title;
            if (result === 'saved') {
                retries.current = 0;
                if (unchanged) { cancelTimer(); markDirty(false); }
                else if (mounted.current && latest.current.enabled) schedule(delayMs);
            } else if (result === 'conflict' || result === 'cancelled') {
                cancelTimer();
            } else if (mounted.current && latest.current.enabled && retries.current < 3) {
                schedule(1500 * 2 ** retries.current++);
            }
        } catch {
            if (mounted.current && latest.current.enabled && retries.current < 3) schedule(1500 * 2 ** retries.current++);
        } finally {
            saving.current = false;
            if (mounted.current) setIsSaving(false);
        }
    };
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            cancelTimer();
            if (dirty.current && latest.current.enabled && latest.current.ready && !saving.current) {
                void latest.current.onSave(latest.current.noteId, { silent: true }).catch(() => {});
            }
        };
    }, []);
    useEffect(() => {
        if (!ready) { initialized.current = false; return; }
        if (!initialized.current) {
            initialized.current = true;
            if (initiallyDirty) { markDirty(true); if (enabled) schedule(delayMs); }
            return;
        }
        retries.current = 0;
        markDirty(true);
        if (enabled) schedule(delayMs);
        return cancelTimer;
        // Callbacks read latest.current without restarting the debounce on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, title, delayMs, ready]);
    useEffect(() => { if (!enabled) cancelTimer(); }, [enabled]);
    return { isSaving, isDirty, saveNow: async () => { cancelTimer(); await runRef.current(false); } };
}
