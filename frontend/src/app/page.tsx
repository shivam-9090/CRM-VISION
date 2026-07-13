import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, CalendarCheck2, ContactRound, Gauge, Layers3, ShieldCheck, Workflow } from 'lucide-react';
import { CheckList, Eyebrow, MarketingPage, ProductPreview } from '@/components/marketing/MarketingShell';

const capabilities = [
  { icon: Layers3, number: '01', title: 'A pipeline your whole team can read', text: 'Move opportunities from lead to close with stages, value, ownership and next action visible at a glance.' },
  { icon: ContactRound, number: '02', title: 'Every relationship in context', text: 'Connect contacts, companies, deals and activity so every conversation starts with the full history.' },
  { icon: Gauge, number: '03', title: 'Decisions backed by live signals', text: 'See pipeline value, deal velocity and team activity without rebuilding another spreadsheet.' },
];

export default function HomePage() {
  return (
    <MarketingPage>
      <section className="hero-section">
        <div className="hero-grid-lines" aria-hidden="true" />
        <div className="marketing-container hero-grid">
          <div className="hero-copy">
            <Eyebrow>Revenue clarity for focused teams</Eyebrow>
            <h1>Your customer relationships,<span> finally moving as one.</span></h1>
            <p className="hero-lead">CRM Vision brings deals, contacts, companies and every customer touchpoint into one calm operating system—so your team always knows what changed and what to do next.</p>
            <div className="hero-actions">
              <Link href="/auth/register" className="button button-primary button-large">Create your workspace <ArrowRight size={17} /></Link>
              <Link href="/features" className="button button-secondary button-large">Explore the product</Link>
            </div>
            <CheckList items={['No credit card required', 'Fast team setup', 'Secure role-based access']} />
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <ProductPreview />
            <div className="floating-note floating-note-top"><span className="note-icon"><CalendarCheck2 size={17} /></span><div><strong>Follow-up due</strong><small>Northstar · 2:30 PM</small></div></div>
            <div className="floating-note floating-note-bottom"><span className="note-icon success"><BarChart3 size={17} /></span><div><strong>Pipeline is up 18%</strong><small>Compared with last month</small></div></div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="marketing-container stat-strip">
          <div><strong>One workspace</strong><span>Contacts, companies, deals and activity</span></div>
          <div><strong>Fewer blind spots</strong><span>Clear ownership and next actions</span></div>
          <div><strong>Production ready</strong><span>RBAC, monitoring and secure authentication</span></div>
        </div>
      </section>

      <section className="marketing-section capability-section">
        <div className="marketing-container">
          <div className="section-heading split-heading">
            <div><Eyebrow>Built around momentum</Eyebrow><h2>Less CRM administration.<br />More confident action.</h2></div>
            <p>CRM Vision is structured around the way revenue work actually happens: relationships evolve, deals move, and every next action needs an owner.</p>
          </div>
          <div className="capability-grid">
            {capabilities.map(({ icon: Icon, number, title, text }) => (
              <article className="capability-card" key={number}>
                <div className="capability-meta"><span>{number}</span><Icon size={22} /></div>
                <h3>{title}</h3><p>{text}</p>
                <Link href="/features">See how it works <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section workflow-section">
        <div className="marketing-container workflow-grid">
          <div className="workflow-copy">
            <Eyebrow>One connected record</Eyebrow>
            <h2>From first conversation to signed agreement.</h2>
            <p>Replace scattered notes and fragile handoffs with a timeline that keeps people, organizations, opportunities and activities connected.</p>
            <div className="workflow-points">
              <div><ContactRound /><span><strong>Capture context</strong><small>Keep people and company details complete.</small></span></div>
              <div><Workflow /><span><strong>Move work forward</strong><small>Give every deal a stage, owner and next step.</small></span></div>
              <div><ShieldCheck /><span><strong>Protect access</strong><small>Control workspace permissions by role.</small></span></div>
            </div>
          </div>
          <div className="relationship-map">
            <div className="map-core"><span><Building2 /></span><strong>Northstar Labs</strong><small>Company record</small></div>
            <div className="map-node node-contact"><ContactRound /><span><strong>Maya Shah</strong><small>Decision maker</small></span></div>
            <div className="map-node node-deal"><Layers3 /><span><strong>Expansion</strong><small>₹4.2L · Proposal</small></span></div>
            <div className="map-node node-activity"><CalendarCheck2 /><span><strong>Demo follow-up</strong><small>Today · 2:30 PM</small></span></div>
            <i className="connector connector-one" /><i className="connector connector-two" /><i className="connector connector-three" />
          </div>
        </div>
      </section>

      <section className="marketing-section security-section">
        <div className="marketing-container security-card">
          <div><Eyebrow>Serious infrastructure, quiet experience</Eyebrow><h2>Built for real customer data.</h2><p>Secure authentication, role-based permissions, production monitoring, rate limiting and resilient infrastructure work behind the scenes.</p></div>
          <div className="security-grid">
            <span><ShieldCheck /> Role-based access</span><span><Gauge /> Health monitoring</span>
            <span><Workflow /> Activity history</span><span><Building2 /> Structured customer data</span>
          </div>
        </div>
      </section>

      <section className="marketing-section final-cta">
        <div className="marketing-container cta-panel">
          <Eyebrow>Start with a clearer pipeline</Eyebrow><h2>Give every opportunity a next move.</h2>
          <p>Create your CRM Vision workspace and bring your revenue work into focus.</p>
          <div><Link href="/auth/register" className="button button-light button-large">Start free <ArrowRight size={17} /></Link><Link href="/about" className="button button-dark-ghost button-large">Why we built it</Link></div>
        </div>
      </section>
    </MarketingPage>
  );
}
