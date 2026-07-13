import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, CalendarClock, ContactRound, KeyRound, Layers3, ShieldCheck, Sparkles, UsersRound, Workflow } from 'lucide-react';
import { Eyebrow, MarketingPage } from '@/components/marketing/MarketingShell';

const featureGroups = [
  { icon: Layers3, tag: 'Pipeline', title: 'See every opportunity and its next move.', text: 'Track value, stage, owner, probability and activity without losing the human context behind the deal.', points: ['Customizable deal stages', 'Clear values and ownership', 'Won/lost conversion tracking'], visual: 'pipeline' },
  { icon: ContactRound, tag: 'Relationships', title: 'One reliable history for every customer.', text: 'Give your team a connected view across contacts, companies, deals and activity—ready before every conversation.', points: ['Contact and company records', 'Linked deals and stakeholders', 'Complete activity timeline'], visual: 'relationships' },
  { icon: CalendarClock, tag: 'Activity', title: 'Turn follow-up into a team habit.', text: 'Log calls, meetings, emails and tasks so commitments stay visible and nothing important goes quiet.', points: ['Calls, meetings, emails and tasks', 'Chronological account context', 'Visible next actions'], visual: 'activity' },
  { icon: BarChart3, tag: 'Insights', title: 'Know what is moving revenue.', text: 'Use live pipeline and performance signals to focus coaching, forecasting and weekly decisions.', points: ['Pipeline value and velocity', 'Conversion visibility', 'Team activity signals'], visual: 'insights' },
];

const essentials = [
  { icon: ShieldCheck, title: 'Production security', text: 'JWT authentication, rate limiting and secure password handling.' },
  { icon: KeyRound, title: 'Role-based control', text: 'Give each teammate access aligned with their responsibility.' },
  { icon: UsersRound, title: 'Team invitations', text: 'Bring people into the right workspace and working context.' },
  { icon: Workflow, title: 'Connected workflows', text: 'Keep relationships and revenue movement in one operating model.' },
  { icon: Building2, title: 'Company intelligence', text: 'Understand every organization through its people and opportunities.' },
  { icon: Sparkles, title: 'Focused experience', text: 'A calm interface designed to reduce CRM administration.' },
];

function FeatureVisual({ type }: { type: string }) {
  if (type === 'pipeline') return <div className="feature-visual pipeline-visual"><div className="visual-toolbar"><span>Sales pipeline</span><small>₹24.8L open</small></div>{['Qualified','Proposal','Negotiation'].map((stage,i)=><div className="stage-column" key={stage}><strong>{stage}</strong><span>{[5,3,2][i]} deals</span><i style={{width:`${[74,52,36][i]}%`}} /></div>)}</div>;
  if (type === 'relationships') return <div className="feature-visual relation-visual"><div className="profile-chip"><ContactRound /><span><strong>Maya Shah</strong><small>VP, Operations</small></span></div><div className="relation-links"><span><Building2 />Northstar Labs</span><span><Layers3 />Expansion · ₹4.2L</span><span><CalendarClock />Demo follow-up today</span></div></div>;
  if (type === 'activity') return <div className="feature-visual activity-visual">{['Discovery call completed','Proposal shared','Follow-up scheduled'].map((item,i)=><div key={item}><i /><span><strong>{item}</strong><small>{['Today, 10:30 AM','Yesterday, 4:15 PM','Monday, 2:30 PM'][i]}</small></span></div>)}</div>;
  return <div className="feature-visual insights-visual"><div><span>Win rate</span><strong>32.6%</strong><small>+4.2% this month</small></div><div className="mini-chart">{[30,46,38,58,52,70,64,84,76,92].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div>;
}

export const metadata = {
  title: 'Features',
  description: 'Explore CRM Vision features for pipeline, contacts, companies, activities, analytics and secure team collaboration.',
};

export default function FeaturesPage() {
  return (
    <MarketingPage>
      <section className="subpage-hero">
        <div className="marketing-container subpage-heading">
          <Eyebrow>Product capabilities</Eyebrow>
          <h1>Everything your team needs.<span> Nothing it does not.</span></h1>
          <p>A connected revenue workspace built to make pipeline, relationships and next actions easier to understand.</p>
        </div>
      </section>

      <section className="feature-showcase marketing-section">
        <div className="marketing-container feature-stack">
          {featureGroups.map(({icon:Icon,tag,title,text,points,visual},index)=>(
            <article className={index%2 ? 'feature-row reverse' : 'feature-row'} key={tag}>
              <div className="feature-copy">
                <span className="feature-icon"><Icon /></span><small>{tag}</small>
                <h2>{title}</h2><p>{text}</p>
                <ul>{points.map(point=><li key={point}><span>✓</span>{point}</li>)}</ul>
              </div>
              <FeatureVisual type={visual} />
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section essentials-section">
        <div className="marketing-container">
          <div className="section-heading centered-heading"><Eyebrow>Strong foundations</Eyebrow><h2>Ready for the way real teams operate.</h2></div>
          <div className="essentials-grid">
            {essentials.map(({icon:Icon,title,text})=><article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="marketing-section compact-cta">
        <div className="marketing-container compact-cta-panel">
          <div><Eyebrow>Bring your pipeline into focus</Eyebrow><h2>Start with one clear workspace.</h2></div>
          <Link href="/auth/register" className="button button-light button-large">Create workspace <ArrowRight size={17} /></Link>
        </div>
      </section>
    </MarketingPage>
  );
}
