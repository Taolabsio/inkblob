import { ReactNode } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Brand, ThemeToggle } from './Brand';

export function WorkspaceState({ title, description, busy = false, children }: { title: string; description?: string; busy?: boolean; children?: ReactNode }) {
  return <div className="auth-page"><header className="auth-nav"><Brand /><ThemeToggle /></header><main className="auth-content" role={busy ? 'status' : 'alert'}>
    <div className="auth-icon">{busy ? <LoaderCircle size={23} className="animate-spin" /> : <AlertCircle size={23} />}</div><h1>{title}</h1>{description && <p className="break-words">{description}</p>}<div className="flex flex-wrap items-center gap-4">{children}</div>
  </main><footer className="auth-footnote">A home for your thoughts.</footer></div>;
}
