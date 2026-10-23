import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand">
    <img src="/logo.png" alt="" width="30" height="30" />
    {!compact && <span>InkBlob<span className="brand-period">.</span></span>}
  </span>;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return <button className="icon-button" onClick={toggleTheme}
    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title="Change appearance">
    {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
  </button>;
}
