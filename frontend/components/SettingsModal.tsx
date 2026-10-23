import { useState } from 'react';
import { Check, Laptop, Moon, Palette, ShieldCheck, Sun } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';

interface SettingsModalProps { isOpen: boolean; onClose: () => void }

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { showSessionStatus, toggleSessionStatus } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const { isSessionValid, sessionExpiresAt, hotWalletAddress, revokeSession } = useSession();
  const [isRevoking, setIsRevoking] = useState(false);
  const [tab, setTab] = useState<'general' | 'appearance'>('appearance');
  const toast = useToast();
  return <Modal isOpen={isOpen} onClose={onClose} title="Settings" className="settings-dialog">
    <div className="settings-tabs" aria-label="Settings sections">
      <button aria-pressed={tab === 'appearance'} onClick={() => setTab('appearance')}><Palette size={15} />Appearance</button>
      <button aria-pressed={tab === 'general'} onClick={() => setTab('general')}><Laptop size={15} />General</button>
    </div>
    {tab === 'appearance' ? <section className="settings-section">
      <h3>Make yourself comfortable.</h3><p>Choose the space that helps you think. Your preference is saved on this device.</p>
      <div className="appearance-options">
        {(['light', 'dark'] as const).map(mode => <button key={mode} onClick={() => { if (theme !== mode) toggleTheme(); }} aria-pressed={theme === mode}>
          <span className={`appearance-swatch ${mode}`} aria-hidden="true"><span /><span /><span /></span>
          <span>{mode === 'light' ? <Sun size={15} /> : <Moon size={15} />}{mode === 'light' ? 'Light' : 'Dark'}{theme === mode && <Check size={14} className="ml-auto text-web3-accent" />}</span>
        </button>)}
      </div>
    </section> : <section className="settings-section">
      <h3>A workspace that works for you.</h3><p>Manage the details of this device and your writing session.</p>
      <div className="settings-row"><div><strong>Session status in the toolbar</strong><p>Show session expiry and SUI / WAL balances.</p></div><button role="switch" aria-checked={showSessionStatus} aria-label="Show session status" onClick={toggleSessionStatus} className="settings-switch"><span /></button></div>
      {isSessionValid ? <div className="device-session"><h4><ShieldCheck size={15} />This device has access</h4><dl><div><dt>Session expires</dt><dd>{sessionExpiresAt ? new Date(sessionExpiresAt).toLocaleString() : 'Unknown'}</dd></div>{hotWalletAddress && <div><dt>Device wallet</dt><dd className="font-mono">{hotWalletAddress.slice(0, 6)}…{hotWalletAddress.slice(-4)}</dd></div>}</dl><p>Revoke this device’s notebook access. Remaining tokens stay in its wallet.</p><button disabled={isRevoking} className="text-red-700 dark:text-red-300 text-xs mt-3 disabled:opacity-50" onClick={async () => { setIsRevoking(true); try { await revokeSession(); toast.success('Session revoked'); } catch { toast.error('Revocation failed', 'The session is still active. Try again.'); } finally { setIsRevoking(false); } }}>{isRevoking ? 'Revoking…' : 'Revoke device access'}</button></div> : <div className="settings-session-empty"><ShieldCheck size={18} /><p>No active writing session on this device. Connect and unlock your notebook to get started.</p></div>}
    </section>}
    <div className="settings-actions"><button className="primary-button" onClick={onClose}>Done</button></div>
  </Modal>;
}
