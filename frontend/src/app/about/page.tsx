import Link from 'next/link';
import { ArrowRight, Compass, Eye, Focus, HeartHandshake, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { Eyebrow, MarketingPage } from '@/components/marketing/MarketingShell';

const principles = [
  { icon: Focus, title: 'Clarity before complexity', text: 'A CRM should make the next decision easier, not create another layer of administration.' },
  { icon: HeartHandshake, title: 'Relationships stay human', text: 'Customer data matters because it gives teams better context for better conversations.' },
  { icon: ShieldCheck, title: 'Trust is infrastructure', text: 'Security, permissions and reliability are product features—not technical footnotes.' },
  { icon: Sparkles, title: 'Calm tools perform better', text: 'Thoughtful hierarchy and fewer distractions help teams keep attention on meaningful work.' },
];

export const metadata = {
  title: 'About',
  description: 'Learn why CRM Vision was built and the product principles behind its focused revenue workspace.',
};

export default function AboutPage() {
  return (
    <MarketingPage>
      <section className="subpage-hero about-hero">
        <div className="marketing-container about-hero-grid">
          <div className="subpage-heading">
            <Eyebrow>Why CRM Vision exists</Eyebrow>
            <h1>Customer work should feel<span> connected, not chaotic.</span></h1>
          </div>
          <p>We are building a calmer revenue workspace for growing teams—one that respects the complexity of relationships without passing that complexity on to the user.</p>
        </div>
      </section>

      <section className="marketing-section story-section">
        <div className="marketing-container story-grid">
          <div className="story-index"><span>Our point of view</span><strong>01</strong></div>
          <div className="story-copy">
            <h2>Most teams do not need more customer data. They need a clearer picture.</h2>
            <p>Important context is often spread across spreadsheets, inboxes, calendars, notes and individual memory. CRM Vision brings that context together around the objects teams already understand: people, companies, opportunities and activity.</p>
            <p>The goal is not to make teams “use a CRM.” The goal is to help them see revenue movement, protect relationship history and act at the right time.</p>
          </div>
        </div>
      </section>

      <section className="marketing-section vision-section">
        <div className="marketing-container vision-grid">
          <div className="vision-card dark">
            <span><Eye /></span><small>Our vision</small>
            <h2>A workspace where every team can understand the state of revenue in minutes.</h2>
          </div>
          <div className="vision-card light">
            <span><Compass /></span><small>Our mission</small>
            <h2>Turn scattered customer context into clear, secure and useful action.</h2>
          </div>
        </div>
      </section>

      <section className="marketing-section principles-section">
        <div className="marketing-container">
          <div className="section-heading split-heading">
            <div><Eyebrow>Product principles</Eyebrow><h2>How we decide what belongs.</h2></div>
            <p>Every capability should reduce ambiguity, protect context or help someone move work forward.</p>
          </div>
          <div className="principles-grid">
            {principles.map(({icon:Icon,title,text},index)=><article key={title}><div><span>0{index+1}</span><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="marketing-section builder-section">
        <div className="marketing-container builder-card">
          <div className="builder-mark"><UsersRound /></div>
          <div><Eyebrow>Built by InfoVision Digital</Eyebrow><h2>Product thinking and engineering, working as one.</h2><p>CRM Vision is developed by InfoVision Digital with a focus on practical systems, reliable infrastructure and interfaces that feel considered at every scale.</p></div>
          <a href="https://infovision.digital" target="_blank" rel="noreferrer" className="button button-secondary button-large">Visit InfoVision <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="marketing-section compact-cta">
        <div className="marketing-container compact-cta-panel">
          <div><Eyebrow>Ready for a clearer view?</Eyebrow><h2>Build your revenue workspace.</h2></div>
          <Link href="/auth/register" className="button button-light button-large">Start free <ArrowRight size={17} /></Link>
        </div>
      </section>
    </MarketingPage>
  );
}
