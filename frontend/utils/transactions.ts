/** Both wallet and session paths must reject an executed-but-aborted transaction. */
export function requireSuccessfulTransaction<T>(result: T): T {
    const value = result as T & {
        FailedTransaction?: { status?: { error?: { message?: string } } };
        Transaction?: { status?: { success?: boolean; error?: { message?: string } } };
        effects?: { status?: { status?: string; error?: string } };
    };
    if (value.FailedTransaction) throw new Error(value.FailedTransaction.status?.error?.message || 'Transaction failed');
    if (value.Transaction?.status?.success === false) throw new Error(value.Transaction.status.error?.message || 'Transaction failed');
    if (value.effects?.status?.status === 'failure') throw new Error(value.effects.status.error || 'Transaction failed');
    return result;
}
