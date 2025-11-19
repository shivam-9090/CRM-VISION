'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Building2, DollarSign, Calendar, BarChart3, Search, Bell, FileText, 
  MessageSquare, Lock, Shield, Database, Mail, Zap, RefreshCw, TrendingUp, 
  Clock, CheckCircle2, ArrowRight, Smartphone, Download, Upload, 
  AlertTriangle, Settings, Eye, Filter, Share2, Save
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface Category {
  id: string;
  name: string;
  icon: any;
}

interface Feature {
  category: string;
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  usage: string;
  gradient: string;
  stats: { label: string; value: string };
}

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const categories: Category[] = [
    { id: 'all', name: 'All Features', icon: Zap },
    { id: 'core', name: 'Core CRM', icon: Users },
    { id: 'automation', name: 'Automation', icon: RefreshCw },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  const features: Feature[] = [
    {
      category: 'core',
      icon: Users,
      title: 'Contact Management',
      description: 'Centralized customer database with unlimited storage, advanced search, and bulk operations',
      benefits: [
        'Store unlimited contacts with custom fields',
        'Link contacts to companies and deals',
        'Track interaction history automatically',
        'Advanced search and filtering',
        'Bulk import/export via CSV'
      ],
      usage: 'Navigate to Contacts → Add Contact. Fill in details like name, email, phone. Link to a company, add custom notes. Use search to find contacts instantly.',
      gradient: 'from-blue-500 to-cyan-500',
      stats: { label: 'Contacts Managed', value: '23,567+' }
    },
    {
      category: 'core',
      icon: Building2,
      title: 'Company Management',
      description: 'Organize customer companies with team collaboration and relationship tracking',
      benefits: [
        'Multi-tenant company architecture',
        'Company-level data isolation',
        'Team member management',
        'Company profiles and notes',
        'Collaborative workspaces'
      ],
      usage: 'Go to Companies → Create Company. Add company name, details, and team members. All contacts and deals are automatically scoped to your company.',
      gradient: 'from-purple-500 to-pink-500',
      stats: { label: 'Companies', value: '10,000+' }
    },
    {
      category: 'core',
      icon: DollarSign,
      title: 'Deal Pipeline',
      description: 'Visual sales pipeline with drag-and-drop stages, deal scoring, and revenue forecasting',
      benefits: [
        'Visual pipeline with 5 stages (Lead → Qualified → Proposal → Negotiation → Won/Lost)',
        'Real-time revenue tracking',
        'Deal assignment to team members',
        'Lead scoring and prioritization',
        'Custom deal fields'
      ],
      usage: 'Navigate to Deals → Create Deal. Set deal value, stage, and owner. Drag deals between stages. Track progress with visual dashboard.',
      gradient: 'from-green-500 to-emerald-500',
      stats: { label: 'Deal Value', value: '$2.4M+' }
    },
    {
      category: 'core',
      icon: Calendar,
      title: 'Activity Tracking',
      description: 'Schedule and track tasks, calls, meetings, and notes with automated reminders',
      benefits: [
        '4 activity types: Task, Call, Meeting, Note',
        'Automatic reminder notifications',
        'Completion tracking',
        'Team activity dashboard',
        'Calendar view integration'
      ],
      usage: 'Go to Activities → Create Activity. Choose type (Task/Call/Meeting/Note), set date, link to contact/deal. Get reminders automatically.',
      gradient: 'from-orange-500 to-red-500',
      stats: { label: 'Activities', value: '150K+' }
    },
    {
      category: 'analytics',
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics with pipeline insights, revenue forecasts, and team performance metrics',
      benefits: [
        'Pipeline analysis by stage',
        'Revenue forecasting',
        'Activity metrics and trends',
        'Team performance tracking',
        'Custom date range reports'
      ],
      usage: 'Dashboard → Analytics. View real-time metrics, pipeline health, revenue trends. Export reports as PDF/CSV. Set custom date ranges.',
      gradient: 'from-indigo-500 to-purple-500',
      stats: { label: 'Reports Generated', value: '50K+' }
    },
    {
      category: 'core',
      icon: Search,
      title: 'Global Search',
      description: 'Fast, cross-module search with advanced filters and saved queries',
      benefits: [
        'Search across contacts, companies, deals, activities',
        'Real-time search results',
        'Advanced filters (date, status, owner)',
        'Save frequently used queries',
        'Export search results'
      ],
      usage: 'Use the search bar at the top. Type any keyword to search across all modules. Apply filters for precise results. Save queries for reuse.',
      gradient: 'from-cyan-500 to-blue-500',
      stats: { label: 'Searches/Day', value: '100K+' }
    },
    {
      category: 'automation',
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Multi-channel notification system with WebSocket, email, and push notifications',
      benefits: [
        'Real-time WebSocket notifications',
        'Email notification fallback',
        'Push notifications for mobile',
        'Customizable notification preferences',
        'Quiet hours and do-not-disturb mode'
      ],
      usage: 'Notifications appear in real-time in the bell icon. Configure preferences in Profile → Notifications. Choose channels and quiet hours.',
      gradient: 'from-yellow-500 to-orange-500',
      stats: { label: 'Notifications/Day', value: '250K+' }
    },
    {
      category: 'core',
      icon: FileText,
      title: 'File Attachments',
      description: 'Attach documents, images, and files to contacts, deals, and activities',
      benefits: [
        'Upload multiple file types',
        'Link files to any entity',
        'Secure file storage',
        'Version tracking',
        'Quick preview and download'
      ],
      usage: 'Open any contact/deal/activity → Attachments tab → Upload files. Files are automatically organized and accessible to your team.',
      gradient: 'from-teal-500 to-cyan-500',
      stats: { label: 'Files Stored', value: '1M+' }
    },
    {
      category: 'core',
      icon: MessageSquare,
      title: 'Comments & Collaboration',
      description: 'Threaded discussions with @mentions for team collaboration on deals and activities',
      benefits: [
        'Threaded comment conversations',
        '@mention team members',
        'Real-time updates',
        'Comment history tracking',
        'Notification on mentions'
      ],
      usage: 'On any deal or activity, scroll to Comments section. Type your message, use @username to mention teammates. They receive instant notifications.',
      gradient: 'from-violet-500 to-purple-500',
      stats: { label: 'Comments', value: '500K+' }
    },
    {
      category: 'security',
      icon: Lock,
      title: 'Authentication & Authorization',
      description: 'Enterprise-grade security with JWT tokens, 2FA, and role-based access control',
      benefits: [
        'JWT with refresh token rotation',
        'Two-factor authentication (2FA)',
        'Role-based access (Admin, Manager, Employee)',
        'Granular permission system',
        'Account lockout after failed attempts'
      ],
      usage: 'Login securely with email/password. Enable 2FA in Profile → Security. Admins can set team member roles and permissions.',
      gradient: 'from-red-500 to-orange-500',
      stats: { label: 'Secure Logins', value: '1M+' }
    },
    {
      category: 'security',
      icon: Shield,
      title: 'Audit Logging',
      description: 'Track every system change for compliance and security monitoring',
      benefits: [
        'Automatic logging of all actions',
        'User activity tracking',
        '1-year default retention (7 years sensitive)',
        'Audit trail analytics',
        'Export audit logs for compliance'
      ],
      usage: 'All user actions are automatically logged. Admins can view audit logs in Settings → Audit Logs. Filter by user, date, action type.',
      gradient: 'from-gray-700 to-gray-900',
      stats: { label: 'Events Logged', value: '10M+' }
    },
    {
      category: 'security',
      icon: Database,
      title: 'Data Isolation',
      description: 'Complete company-level data isolation with automatic filtering',
      benefits: [
        'Multi-tenant architecture',
        'Row-level security',
        'Automatic company scoping',
        'Zero cross-company data leaks',
        'Compliance-ready architecture'
      ],
      usage: 'All queries automatically filter by your company ID. You only see your data. Complete isolation ensures privacy and security.',
      gradient: 'from-slate-600 to-slate-800',
      stats: { label: 'Protected Records', value: '50M+' }
    },
    {
      category: 'automation',
      icon: Mail,
      title: 'Email Integration',
      description: 'Automated email notifications with customizable templates and bulk sending',
      benefits: [
        'Beautiful HTML email templates',
        'Password reset emails',
        'Welcome emails for new users',
        'Activity reminders',
        'Bulk email campaigns'
      ],
      usage: 'Emails are sent automatically for password resets, invitations, and reminders. Configure SMTP in admin settings.',
      gradient: 'from-blue-600 to-indigo-600',
      stats: { label: 'Emails Sent', value: '5M+' }
    },
    {
      category: 'analytics',
      icon: Download,
      title: 'Data Export',
      description: 'Export data in multiple formats with custom templates and scheduled exports',
      benefits: [
        'Export to CSV, Excel, JSON, XML',
        'Custom export templates',
        'Scheduled automated exports',
        'Batch export processing',
        'Email export notifications'
      ],
      usage: 'Navigate to any data page → Export button. Choose format, select fields, download. Schedule recurring exports in Settings.',
      gradient: 'from-green-600 to-teal-600',
      stats: { label: 'Exports', value: '100K+' }
    },
    {
      category: 'automation',
      icon: RefreshCw,
      title: 'Redis Caching',
      description: 'Lightning-fast performance with intelligent Redis caching layer',
      benefits: [
        'Sub-millisecond response times',
        'Automatic cache invalidation',
        'Configurable TTL per entity',
        'Cache hit ratio monitoring',
        'Graceful cache fallback'
      ],
      usage: 'Caching is automatic and transparent. System caches frequently accessed data. Monitor cache performance in Admin → Performance.',
      gradient: 'from-red-600 to-pink-600',
      stats: { label: 'Cache Hit Rate', value: '95%+' }
    },
    {
      category: 'security',
      icon: AlertTriangle,
      title: 'Rate Limiting',
      description: 'Redis-backed rate limiting to prevent abuse and ensure fair usage',
      benefits: [
        'Sliding window rate limiting',
        'Per-endpoint rate limits',
        'IP-based throttling',
        'Abuse prevention',
        'Custom rate limit configuration'
      ],
      usage: 'Rate limits are enforced automatically (100 requests per 15 minutes). If exceeded, you receive a 429 error. Contact support for custom limits.',
      gradient: 'from-orange-600 to-red-600',
      stats: { label: 'Requests Handled', value: '1B+' }
    },
    {
      category: 'automation',
      icon: Smartphone,
      title: 'Mobile API Support',
      description: 'Optimized mobile APIs with offline sync and batch operations',
      benefits: [
        'Offline data synchronization',
        'Incremental sync updates',
        'Batch operation support',
        'Conflict resolution',
        'Device registration and management'
      ],
      usage: 'Use mobile app or integrate with /api/v1/mobile endpoints. Enable offline mode in app settings. Data syncs automatically when online.',
      gradient: 'from-pink-500 to-rose-500',
      stats: { label: 'Mobile Devices', value: '25K+' }
    },
    {
      category: 'analytics',
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Powerful filtering system with multi-field criteria and saved presets',
      benefits: [
        'Multi-field filter combinations',
        'Date range filtering',
        'Status and priority filters',
        'Team and owner filters',
        'Save filter presets'
      ],
      usage: 'Click Filter button on any data page. Select fields, set criteria, apply. Save frequently used filters for quick access.',
      gradient: 'from-lime-500 to-green-500',
      stats: { label: 'Active Filters', value: '50K+' }
    }
  ];

  const filteredFeatures = activeCategory === 'all' 
    ? features 
    : features.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ top: '10%', left: '10%', animationDuration: '4s' }}
          ></div>
          <div 
            className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ bottom: '10%', right: '10%', animationDuration: '6s', animationDelay: '2s' }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">Complete CRM Solution</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Powerful Features for
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Modern Teams
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Everything you need to manage customer relationships, close deals faster, and grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter - Sticky */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8 sticky top-20 z-20 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`group relative px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  {activeCategory === category.id && (
                    <CheckCircle2 className="w-4 h-4 animate-scale-in" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features List - Detailed Layout WITHOUT Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-24">
          {filteredFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative animate-fade-in`}
              style={{ animationDelay: `${index * 150}ms` }}
              onMouseEnter={() => setHoveredFeature(feature.title)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Feature Header with Icon and Title */}
              <div className="flex items-start space-x-6 mb-8">
                {/* Icon Box - Glassmorphism Style */}
                <div className="relative flex-shrink-0 w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-white/[0.07] group-hover:border-white/20 overflow-hidden">
                  {/* Subtle color blob on hover */}
                  {hoveredFeature === feature.title && (
                    <div 
                      className="absolute w-24 h-24 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                      style={{
                        background: feature.gradient.includes('blue') ? 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)' : 
                                   feature.gradient.includes('green') ? 'radial-gradient(circle, rgba(34, 197, 94, 0.5) 0%, transparent 70%)' : 
                                   feature.gradient.includes('purple') ? 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)' : 
                                   'radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, transparent 70%)',
                        pointerEvents: 'none'
                      }}
                    ></div>
                  )}
                  <feature.icon className="w-10 h-10 text-white relative z-10" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white group-hover:translate-x-2 transition-transform duration-300">
                      {feature.title}
                    </h2>
                    <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-white">{feature.stats.value}</span>
                      <span className="text-xs text-gray-400">{feature.stats.label}</span>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Benefits Grid */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {feature.benefits.map((benefit, i) => (
                      <div 
                        key={i}
                        className="flex items-start space-x-3 text-gray-300 transition-all duration-300 group-hover:translate-x-2"
                        style={{ transitionDelay: `${i * 60}ms` }}
                      >
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors duration-300 ${hoveredFeature === feature.title ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className="text-sm leading-relaxed">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Usage Section - Glassmorphism Style */}
                  <div className="relative p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden transition-all duration-500 hover:bg-white/[0.07] hover:border-white/20">
                    {/* Subtle color blob on hover */}
                    {hoveredFeature === feature.title && (
                      <div 
                        className="absolute w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-700"
                        style={{
                          background: feature.gradient.includes('blue') ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' : 
                                     feature.gradient.includes('green') ? 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)' : 
                                     feature.gradient.includes('purple') ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)' : 
                                     'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none'
                        }}
                      ></div>
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex items-center space-x-2 mb-3">
                        <Eye className="w-5 h-5 text-gray-300 transition-colors duration-300 group-hover:text-white" />
                        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide group-hover:text-white transition-colors duration-300">How to Use</span>
                      </div>
                      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{feature.usage}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              {index < filteredFeatures.length - 1 && (
                <div className="mt-16 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of teams already using CRM Vision
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300"
            >
              Start Free Trial
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-transparent text-white font-bold border-2 border-white rounded-lg transition-all duration-300 hover:bg-white hover:!text-black"
            >
              Learn More
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
