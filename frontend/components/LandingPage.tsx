import { ArrowDown, ArrowRight, ArrowUpRight, FileText, FolderTree, KeyRound, LockKeyhole } from 'lucide-react';
import { ConnectButton } from '../wallet';
import { NETWORK, STORAGE_EPOCHS } from '../config/network';
import { Brand, ThemeToggle } from './Brand';

export function LandingPage({ onExplore }: { onExplore: () => void }) {
  return <div className="landing-page">
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="landing-nav">
      <a href="#" aria-label="InkBlob home"><Brand /></a>
      <nav aria-label="Main navigation">
        <a href="#your-space">Your space</a>
        <a href="#privacy">Privacy, by design</a>
        <a href="https://github.com/SuLabsOrg/inkblob" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a>
      </nav>
      <ThemeToggle />
    </header>
    <main id="main">
      <section className="landing-hero">
        <div className="hero-intro"><span className="eyebrow"><LockKeyhole size={13} /> A little space. Entirely yours.</span>
          <h1>Room to think.<br /><span>Freedom to write.</span></h1>
        </div>
        <div className="hero-description">
          <p>A quiet home for your notes, ideas, and everything in between. Encrypted with keys only you hold.</p>
          <div className="hero-actions"><ConnectButton className="landing-wallet" />
            <button className="text-button" onClick={onExplore}>Take a look inside <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>
      <section className="product-showcase" id="your-space" aria-label="Explore the InkBlob notebook">
        <div className="showcase-top"><span><span className="status-dot" /> A calmer kind of notebook</span>
          <button onClick={onExplore}>Try the workspace <ArrowUpRight size={15} /></button></div>
        <button className="preview-image-button" onClick={onExplore} aria-label="Open the interactive workspace preview">
          <img className="workspace-preview" src="/workspace-preview.png" alt="InkBlob workspace with folders, a searchable note list, and a distraction-free writing area" width="1440" height="900" fetchPriority="high" />
        </button>
        <div className="showcase-bottom"><span><FileText size={14} /> Notes that feel like yours.</span><a href="#privacy">Built on a private foundation <ArrowDown size={14} /></a></div>
      </section>
      <section className="landing-features" id="privacy">
        <div className="feature-heading"><span className="eyebrow">Less noise. More possibility.</span><h2>Your thoughts belong<br />in your hands.</h2><p>A familiar place to write, with a different idea of ownership.</p></div>
        <div className="feature-list">
          <article><KeyRound size={21} /><div><h3>Private from the first word</h3><p>Titles and content are encrypted in your browser. Your wallet unlocks the keys.</p></div></article>
          <article><FolderTree size={21} /><div><h3>A place for every idea</h3><p>Bring order with folders, nested pages, and search. Or just open a note and start writing.</p></div></article>
          <article><LockKeyhole size={21} /><div><h3>Share on your terms</h3><p>Invite another wallet to your notebook with read or write access. You decide who gets in.</p></div></article>
        </div>
      </section>
      <aside className="storage-note"><span className="network-label">{NETWORK === 'testnet' ? 'Testnet preview' : NETWORK}</span><p>Connect a Sui wallet to save notes. Saves use SUI and WAL, with storage for {STORAGE_EPOCHS} Walrus epochs. You can extend storage from your notebook.</p></aside>
    </main>
    <footer className="landing-footer"><Brand /><span>A home for your thoughts.</span><a href="https://github.com/SuLabsOrg/inkblob" target="_blank" rel="noreferrer">Open source, by nature <ArrowUpRight size={14} /></a></footer>
  </div>;
}
