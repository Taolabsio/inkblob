import React, { useState } from 'react';
import { useSignPersonalMessage, useSignAndExecuteTransaction, useCurrentAccount } from '../wallet';
import { useEncryption } from '../context/EncryptionContext';
import { useSuiService } from '../hooks/useSuiService';
import { KEY_DERIVATION_MESSAGE } from '../crypto/keyDerivation';
import { ArrowRight, ShieldCheck, Loader2, Lock, Plus } from 'lucide-react';
import { Brand, ThemeToggle } from './Brand';
import { useToast } from '../context/ToastContext';
import { sanitizeWeb3Error } from '../utils/toastUtils';

interface OnboardingProps {
    mode: 'unlock' | 'initialize';
    onComplete?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ mode, onComplete }) => {
    const { deriveKey } = useEncryption();
      const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const suiService = useSuiService();
    const currentAccount = useCurrentAccount();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlock = async () => {
        if (!currentAccount) {
            console.warn('[Onboarding] Unlock called but no current account');
            return;
        }

        console.log('[Onboarding] Starting unlock process...', {
            account: currentAccount.address,
        });
        setIsLoading(true);
        try {
            console.log('[Onboarding] Requesting signature for key derivation...');
            const message = new TextEncoder().encode(KEY_DERIVATION_MESSAGE);
            const { signature } = await signPersonalMessage({ message });

            console.log('[Onboarding] Signature received, deriving encryption key...');
            await deriveKey(signature, currentAccount.address);

            console.log('[Onboarding] Unlock successful!');
            toast.success('Notebook Unlocked', 'Your encryption key has been derived successfully!');

            // NOTE: Session restoration is now deferred until needed
            // This prevents duplicate signature requests for first-time users

            onComplete?.();
        } catch (error) {
            console.error('[Onboarding] Unlock failed:', error);
            const errorInfo = sanitizeWeb3Error(error);
            toast.error('Unlock Failed', 'Could not unlock notebook. ' + errorInfo.description + ' Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!currentAccount) {
            console.warn('[Onboarding] Initialize called but no current account');
            return;
        }

        console.log('[Onboarding] Starting notebook initialization...', {
            account: currentAccount.address,
        });

        setIsLoading(true);
        try {
            const notebookName = `My Notebook - ${new Date().toLocaleDateString()}`;

            console.log('[Onboarding] Creating notebook transaction with name:', notebookName);
            const tx = suiService.createNotebookTx(notebookName);

            console.log('[Onboarding] Signing and executing transaction...');
            await signAndExecuteTransaction({
                transaction: tx,
            });

            console.log('[Onboarding] Notebook creation successful, calling onComplete...');
            toast.success('Notebook Created', `Your notebook has been created successfully!`);
            onComplete?.();
        } catch (error) {
            console.error('[Onboarding] Initialization failed:', error);
            const errorInfo = sanitizeWeb3Error(error);
            toast.error('Creation Failed', 'Could not create notebook. ' + errorInfo.description + ' Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isUnlock = mode === 'unlock';
    return <div className="auth-page">
        <header className="auth-nav"><Brand /><ThemeToggle /></header>
        <main className="auth-content">
            <div className="auth-icon">{isUnlock ? <Lock size={23} strokeWidth={1.5} /> : <Plus size={23} />}</div>
            <h1>{isUnlock ? 'Your space is waiting.' : 'Start with a blank page.'}</h1>
            <p>{isUnlock ? 'Welcome back. Unlock your notebook to pick up where your thoughts left off.' : 'Create your personal notebook on Sui. A private home for the things you want to remember.'}</p>
            <div className="auth-detail"><ShieldCheck size={17} /><span>{isUnlock ? 'Sign a message to derive your encryption key.' : 'Your wallet will ask you to approve a transaction.'}</span></div>
            <button onClick={isUnlock ? handleUnlock : handleInitialize} disabled={isLoading} className="primary-button">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLoading ? (isUnlock ? 'Unlocking your notebook…' : 'Creating your notebook…') : (isUnlock ? 'Unlock notebook' : 'Create notebook')}
                {!isLoading && <ArrowRight size={15} />}
            </button>
            {isUnlock && <p className="mt-5 text-xs text-web3-textMuted leading-relaxed">Your signature creates your key locally. Your notes stay encrypted until you unlock them.</p>}
        </main>
        <footer className="auth-footnote">Your words, your keys. Always.</footer>
    </div>;
};
