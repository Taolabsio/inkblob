import { describe, it, expect } from 'vitest';
import { requireSuccessfulTransaction } from '../transactions';
import { mergeRemoteNotes } from '../noteState';
import type { Note } from '../../types';
const note = (content: string, revision = '1'): Note => ({ id: 'a', title: 'A', content, blobId: 'blob', folderId: 'notes', updatedAt: new Date(0), revision, contentLoaded: true });
describe('data integrity', () => {
    it('rejects native gRPC and legacy executed-but-aborted results', () => {
        expect(() => requireSuccessfulTransaction({ FailedTransaction: { status: { error: { message: 'MoveAbort(24)' } } } })).toThrow('MoveAbort');
        expect(() => requireSuccessfulTransaction({ effects: { status: { status: 'failure', error: 'abort' } } })).toThrow('abort');
    });
    it('preserves dirty drafts and their confirmed base revision during background refresh', () => {
        expect(mergeRemoteNotes([note('draft')], [note('', '2')], new Set(['a']))[0]).toMatchObject({ content: 'draft', revision: '1' });
    });
    it('retains downloaded content when metadata references the same blob', () => {
        expect(mergeRemoteNotes([note('loaded')], [{ ...note(''), contentLoaded: false }], new Set())[0].content).toBe('loaded');
    });
    it('restores a local encrypted draft over unhydrated metadata', () => {
        expect(mergeRemoteNotes([{ ...note(''), contentLoaded: false }], [{ ...note('recovered'), hasDraft: true }], new Set(['a']))[0].content).toBe('recovered');
    });
    it('applies an empty remote list while preserving only unsaved local work', () => {
        expect(mergeRemoteNotes([note('')], [], new Set())).toEqual([]);
        expect(mergeRemoteNotes([note('draft')], [], new Set(['a']))).toHaveLength(1);
    });
});

import { noteText } from '../noteText';
describe('visible note text', () => {
    it('extracts block content without counting or showing editor serialization', () => {
        const state = JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Hello' }] }, { type: 'paragraph', children: [{ text: '世界' }] }] } });
        expect(noteText(state)).toBe('Hello\n世界');
        expect(noteText(state)).not.toContain('paragraph');
    });
    it('preserves plain notes and JSON that is not an editor state', () => {
        expect(noteText('plain')).toBe('plain');
        expect(noteText('{"a":1}')).toBe('{"a":1}');
    });
});
