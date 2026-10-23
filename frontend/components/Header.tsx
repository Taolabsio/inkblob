import { ConnectButton } from '../wallet';
import { PanelLeft, Coins, ChevronRight, LockKeyhole, ArrowLeft } from 'lucide-react';
import { SessionStatus } from './SessionStatus';
import { ThemeToggle } from './Brand';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  folderName?: string;
  onCreateNote: () => void;
  walPaymentActive?: boolean | null;
  isSharedMode?: boolean;
  preview?: boolean;
  onExitPreview?: () => void;
}

export function Header({ sidebarOpen, setSidebarOpen, folderName = 'Notes', walPaymentActive,
  isSharedMode = false, preview = false, onExitPreview }: HeaderProps) {
  return <header className="workspace-header">
    <div className="header-location">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="icon-button"
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={sidebarOpen}><PanelLeft size={18} /></button>
      <span className="header-workspace">{isSharedMode ? 'Shared notebook' : 'My workspace'}</span><ChevronRight size={12} /><span className="header-folder">{folderName}</span>
    </div>
    <div className="header-controls">
      {preview ? <button className="preview-exit" onClick={onExitPreview}><ArrowLeft size={13} /> Back to home</button>
        : <>
          {!isSharedMode && <SessionStatus className="hidden xl:flex" />}
          {walPaymentActive != null && <span className="hidden xl:flex items-center gap-1 text-xs text-web3-textMuted" title="Storage-fee status for the last save"><Coins size={12} />{walPaymentActive ? 'Storage fee paid' : 'Storage fee skipped'}</span>}
          <span className="header-encrypted hidden lg:flex"><LockKeyhole size={12} /> Encrypted</span>
          <ConnectButton className="workspace-wallet" />
        </>}
      <ThemeToggle />
    </div>
  </header>;
}
