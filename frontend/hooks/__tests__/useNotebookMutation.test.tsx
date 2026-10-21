// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotebookMutation } from '../useNotebookMutation';
const mocks = vi.hoisted(() => ({ confirm: vi.fn(), authorize: vi.fn(), info: vi.fn(), error: vi.fn(), execute: vi.fn(),
    account: { address: 'account-a' }, valid: false }));
vi.mock('../../wallet', () => ({ useCurrentAccount: () => mocks.account,
    useSignAndExecuteTransaction: () => ({ mutateAsync: mocks.execute }) }));
vi.mock('../../context/EncryptionContext', () => ({ useEncryption: () => ({ lastSignature: null, lastUserAddress: null }) }));
vi.mock('../../context/SessionContext', () => ({ useSession: () => ({ isSessionValid: mocks.valid,
    sessionCap: { objectId: 'cap', content: { fields: { notebook_id: 'book-a' } } }, ephemeralKeypair: {},
    authorizeSession: mocks.authorize, authorizeSessionWithSignature: mocks.authorize }) }));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ confirm: mocks.confirm, info: mocks.info, error: mocks.error }) }));
vi.mock('../useSuiService', () => ({ useSuiService: () => ({}) }));
beforeEach(() => { vi.resetAllMocks(); mocks.account = { address: 'account-a' }; mocks.valid = false; });

describe('wallet interaction boundaries', () => {
    it('never asks for authorization from a background autosave', async () => {
        const { result } = renderHook(() => useNotebookMutation());
        expect(await result.current.ensureSessionAuthorized('book-a', { interactive: false })).toBeNull();
        expect(mocks.confirm).not.toHaveBeenCalled();
        expect(mocks.authorize).not.toHaveBeenCalled();
    });
    it('reuses only sessions bound to the correct notebook', async () => {
        mocks.valid = true;
        const { result } = renderHook(() => useNotebookMutation());
        expect(await result.current.ensureSessionAuthorized('book-a', { interactive: false })).toMatchObject({ sessionCap: { objectId: 'cap' } });
        expect(await result.current.ensureSessionAuthorized('book-b', { interactive: false })).toBeNull();
    });
    it('does not repeat a failed enrollment prompt', async () => {
        mocks.confirm.mockResolvedValue(true);
        mocks.authorize.mockRejectedValue(new Error('No WAL'));
        const { result } = renderHook(() => useNotebookMutation());
        await result.current.ensureSessionAuthorized('book-a');
        await result.current.ensureSessionAuthorized('book-a');
        expect(mocks.confirm).toHaveBeenCalledTimes(1);
    });
    it('resets a declined enrollment decision when the wallet changes', async () => {
        mocks.confirm.mockResolvedValue(false);
        const { result, rerender } = renderHook(() => useNotebookMutation());
        await result.current.ensureSessionAuthorized('book-a');
        mocks.account = { address: 'account-b' };
        await act(async () => rerender());
        await result.current.ensureSessionAuthorized('book-b');
        expect(mocks.confirm).toHaveBeenCalledTimes(2);
    });
});
