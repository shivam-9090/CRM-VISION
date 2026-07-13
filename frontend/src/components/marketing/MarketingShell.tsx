'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  CircleDot,
  ContactRound,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/about', label: 'About' },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="marketing-header">
      <div className="marketing-container nav-shell">
        <Link href="/" className="brand-lockup" aria-label="CRM Vision home">
          <span className="brand-mark" aria-hidden="true">
            <CircleDot size={20} strokeWidth={2.4} />
          </span>
          <span>
            <strong>CRM Vision</strong>
            <small>Revenue workspace</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="desktop-actions">
          <Link href="/auth/login" className="button button-ghost">
            Sign in
          </Link>
          <Link href="/auth/register" className="button button-primary">
            Start free <ArrowUpRight size={16} />
          </Link>
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="mobile-menu">
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/auth/login" onClick={() => setOpen(false)}>Sign in</Link>
            <Link className="button button-primary" href="/auth/register" onClick={() => setOpen(false)}>
              Start free <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container footer-grid">
        <div className="footer-intro">
          <Link href="/" className="brand-lockup">
            <span className="brand-mark"><CircleDot size={20} /></span>
            <span><strong>CRM Vision</strong><small>Revenue workspace</small></span>
          </Link>
          <p>
            A focused customer and deal workspace for teams that want a clear
            view of revenue, relationships and next actions.
          </p>
        </div>
        <div>
          <span className="footer-label">Product</span>
          <Link href="/features">Features</Link>
          <Link href="/auth/register">Create workspace</Link>
          <Link href="/auth/login">Sign in</Link>
        </div>
        <div>
          <span className="footer-label">Company</span>
          <Link href="/about">About</Link>
          <a href="mailto:support@infovision.digital">Support</a>
          <a href="https://infovision.digital" target="_blank" rel="noreferrer">InfoVision Digital</a>
        </div>
        <div>
          <span className="footer-label">Built for</span>
          <span>Sales teams</span>
          <span>Agencies</span>
          <span>Growing businesses</span>
        </div>
      </div>
      <div className="marketing-container footer-bottom">
        <span>© {new Date().getFullYear()} CRM Vision</span>
        <span>Private by design · Built for focused teams</span>
      </div>
    </footer>
  );
}

export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow"><Sparkles size={14} />{children}</div>;
}

export function ProductPreview() {
  return (
    <div className="product-preview" aria-label="CRM Vision product preview">
      <div className="preview-topbar">
        <div className="preview-dots"><i /><i /><i /></div>
        <span>Revenue command center</span>
        <span className="live-pill"><i /> Live pipeline</span>
      </div>
      <div className="preview-layout">
        <aside className="preview-sidebar">
          <span className="mini-logo"><CircleDot size={16} /></span>
          {[BarChart3, ContactRound, Building2].map((Icon, index) => (
            <span key={index} className={index === 0 ? 'selected' : ''}><Icon size={16} /></span>
          ))}
        </aside>
        <div className="preview-content">
          <div className="metric-row">
            <PreviewMetric label="Open pipeline" value="₹24.8L" delta="+18.4%" />
            <PreviewMetric label="Qualified leads" value="128" delta="+12 this week" />
            <PreviewMetric label="Win rate" value="32.6%" delta="+4.2%" />
          </div>
          <div className="pipeline-card">
            <div className="card-heading">
              <div><strong>Pipeline movement</strong><span>Updated just now</span></div>
              <span>Last 30 days</span>
            </div>
            <div className="chart-bars" aria-hidden="true">
              {[38, 48, 42, 64, 56, 74, 68, 88, 76, 96, 82, 100].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="deal-row">
            <strong>Deals needing attention</strong>
            {['Acme expansion', 'Northstar renewal', 'Aperture onboarding'].map((deal, index) => (
              <div key={deal}>
                <span><i className={`priority priority-${index}`} />{deal}</span>
                <span>{['₹4.2L', '₹2.8L', '₹1.6L'][index]}</span>
                <span className="deal-stage">{['Proposal', 'Negotiation', 'Qualified'][index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="check-list">
      {items.map((item) => <li key={item}><Check size={16} />{item}</li>)}
    </ul>
  );
}
