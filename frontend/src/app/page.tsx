'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, TrendingUp, BarChart3, ArrowRight, Check, Zap, Shield, Clock, Calendar, Phone, FileText, DollarSign } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';

export default function Home() {
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cursorVariant, setCursorVariant] = useState('default');

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const hasToken = hasAuthToken();
        if (hasToken) {
          const isValid = await verifyAuthToken();
          if (isValid) {
            router.replace('/dashboard');
          }
        }
      }
    };
    checkAuth();
    setTimeout(() => setIsAnimated(true), 100);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [router]);

  const features = [
    { icon: Users, title: 'Contact Management', description: 'Centralize customer data with smart organization.' },
    { icon: TrendingUp, title: 'Sales Pipeline', description: 'Visual pipeline tracking with real-time updates.' },
    { icon: BarChart3, title: 'Analytics', description: 'Data-driven insights for better decisions.' }
  ];

  const benefits = ['Setup in 5 minutes', 'No credit card required', 'Free 14-day trial', 'Cancel anytime'];

  const pagePreviewCards = [
    {
      id: 'contacts',
      title: 'Contacts',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      description: 'Manage all your customer relationships',
      features: ['Contact profiles', 'Company links', 'Activity history']
    },
    {
      id: 'deals',
      title: 'Deals',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      description: 'Track your sales pipeline',
      features: ['Visual pipeline', 'Deal stages', 'Revenue tracking']
    },
    {
      id: 'activities',
      title: 'Activities',
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      description: 'Schedule tasks and meetings',
      features: ['Task management', 'Calendar view', 'Reminders']
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      description: 'Data-driven insights',
      features: ['Sales reports', 'Performance metrics', 'Custom dashboards']
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gray-800 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{
            top: '10%',
            left: '5%',
            animationDuration: '4s'
          }}
        ></div>
        <div 
          className="absolute w-96 h-96 bg-gray-800 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{
            bottom: '10%',
            right: '5%',
            animationDuration: '6s',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full blur-3xl opacity-20"
          style={{
            top: `${mousePosition.y * 0.05}px`,
            left: `${mousePosition.x * 0.05}px`,
            transition: 'all 0.3s ease-out'
          }}
        ></div>
      </div>

      <Navbar />
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transform transition-all duration-700 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8 animate-fade-in-down">
              <Zap className="w-4 h-4 text-white animate-pulse" />
              <span className="text-sm font-semibold text-white">Trusted by 10,000+ teams</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in">
              Customer relationships,
              <span className="block mt-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent animate-gradient">simplified.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              The CRM that helps you close more deals, faster. No complexity, just results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/auth/register" 
                className="group relative w-full sm:w-auto px-8 py-4 bg-white text-black text-lg font-bold rounded-lg hover:bg-gray-100 hover:scale-105 hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden animate-glow-pulse"
              >
                <span className="relative z-10">Start free trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 animate-shimmer"></div>
              </Link>
              <Link 
                href="/features" 
                className="group w-full sm:w-auto px-8 py-4 bg-transparent text-white text-lg font-bold border-2 border-white rounded-lg transition-all duration-300 hover:bg-white hover:!text-black hover:scale-105"
              >
                View Features
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-2 animate-fade-in font-medium`}
                  style={{ animationDelay: `${index * 100 + 600}ms` }}
                >
                  <Check className="w-4 h-4 text-green-400 font-bold" strokeWidth={3} />
                  <span className="font-semibold">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className={`transform transition-all duration-700 delay-200 ${isAnimated ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
            <div 
              className="group relative rounded-2xl border-2 border-gray-700 overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 cursor-zoom-in"
              style={{
                boxShadow: 'inset 0 0 0 2px transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 0 0 2px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 0 0 2px transparent';
              }}
            >
              {/* Animated glowing border */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }}
              ></div>
              
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-gray-900 rounded px-3 py-1 text-xs text-gray-400 mx-4">
                  app.crmvision.com/dashboard
                </div>
              </div>
              <div className="p-8 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Deals', value: '$2.4M', change: '+12%', color: 'from-green-500 to-emerald-500' },
                    { label: 'Contacts', value: '23,567', change: '+8%', color: 'from-blue-500 to-cyan-500' },
                    { label: 'Conversion', value: '68%', change: '+5%', color: 'from-purple-500 to-pink-500' }
                  ].map((stat, i) => (
                    <div key={i} className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer animate-fade-in group/stat" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover/stat:opacity-10 rounded-lg transition-opacity duration-300`}></div>
                      <div className="relative">
                        <div className="text-sm font-semibold text-gray-400 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs font-bold text-green-400 mt-1">{stat.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Page Previews Grid - Shows all pages */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Contacts Preview */}
                  <div className="group/card relative bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-blue-500 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover/card:opacity-10 rounded-lg transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="w-4 h-4 text-blue-400" />
                        <div className="text-xs font-bold text-white">Contacts</div>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((_, i) => (
                          <div key={i} className="flex items-center space-x-2 animate-slide-in-left" style={{ animationDelay: `${i * 100 + 700}ms` }}>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-40"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 bg-gray-700 rounded w-20"></div>
                              <div className="h-1.5 bg-gray-800 rounded w-16"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deals Preview */}
                  <div className="group/card relative bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-green-500 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover/card:opacity-10 rounded-lg transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-2 mb-3">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <div className="text-xs font-bold text-white">Deals</div>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((_, i) => (
                          <div key={i} className="flex items-center space-x-2 animate-slide-in-right" style={{ animationDelay: `${i * 100 + 700}ms` }}>
                            <div className="w-2 h-6 rounded bg-gradient-to-b from-green-500 to-emerald-500 opacity-40"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 bg-gray-700 rounded w-24"></div>
                              <div className="h-1.5 bg-gray-800 rounded w-12"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Activities Preview */}
                  <div className="group/card relative bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-purple-500 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover/card:opacity-10 rounded-lg transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <div className="text-xs font-bold text-white">Activities</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {[...Array(7)].map((_, i) => (
                          <div key={i} className="h-1 bg-gray-700 rounded"></div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2].map((_, i) => (
                          <div key={i} className="h-2 bg-gray-700 rounded animate-fade-in" style={{ animationDelay: `${i * 100 + 800}ms` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Analytics Preview */}
                  <div className="group/card relative bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-orange-500 transition-all duration-300 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover/card:opacity-10 rounded-lg transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-orange-400" />
                        <div className="text-xs font-bold text-white">Analytics</div>
                      </div>
                      <div className="flex items-end space-x-1 h-12">
                        {[40, 70, 45, 85, 60, 90, 55].map((height, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-t opacity-40 animate-scale-in"
                            style={{ 
                              height: `${height}%`,
                              animationDelay: `${i * 50 + 900}ms`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page Preview Cards Section */}
      <section 
        className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative z-10"
        onMouseEnter={() => setCursorVariant('preview')}
        onMouseLeave={() => setCursorVariant('default')}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 animate-fade-in">
              Complete CRM Solution
            </h2>
            <p className="text-xl font-medium text-gray-400 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Everything you need to manage your business, all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pagePreviewCards.map((card, index) => (
              <div
                key={card.id}
                className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 cursor-pointer overflow-hidden animate-fade-in"
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  setHoveredCard(card.id);
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  setHoveredCard(null);
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Animated gradient overlay */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`}
                  style={{
                    backgroundSize: '200% 200%',
                    animation: hoveredCard === card.id ? 'gradient 3s ease infinite' : 'none'
                  }}
                ></div>

                {/* Subtle shimmer effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: hoveredCard === card.id ? 'shimmer 2s linear infinite' : 'none'
                  }}
                ></div>
                
                {/* Icon with smooth animation */}
                <div 
                  className={`relative mb-4 w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center transition-all duration-500 ease-out`}
                  style={{
                    transform: hoveredCard === card.id ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                    boxShadow: hoveredCard === card.id ? `0 8px 20px ${card.color.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : card.color.includes('green') ? 'rgba(34, 197, 94, 0.3)' : card.color.includes('purple') ? 'rgba(168, 85, 247, 0.3)' : 'rgba(249, 115, 22, 0.3)'}` : 'none'
                  }}
                >
                  <card.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content with smooth transitions */}
                <h3 className="relative text-xl font-bold text-white mb-2 transition-all duration-300" style={{
                  transform: hoveredCard === card.id ? 'translateX(4px)' : 'translateX(0)'
                }}>
                  {card.title}
                </h3>
                <p className="relative text-sm text-gray-400 mb-4 transition-colors duration-300 group-hover:text-gray-300">
                  {card.description}
                </p>

                {/* Features list with staggered animation */}
                <div className={`relative space-y-2 transition-all duration-500 ${hoveredCard === card.id ? 'opacity-100 max-h-40 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2'} overflow-hidden`}>
                  {card.features.map((feature, i) => (
                    <div 
                      key={i} 
                      className="flex items-center space-x-2 text-xs text-gray-400 transition-all duration-300"
                      style={{ 
                        transitionDelay: hoveredCard === card.id ? `${i * 80}ms` : '0ms',
                        transform: hoveredCard === card.id ? 'translateX(0)' : 'translateX(-8px)'
                      }}
                    >
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" strokeWidth={3} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Arrow indicator with smooth slide */}
                <div 
                  className={`relative mt-4 flex items-center text-sm font-semibold transition-all duration-400`}
                  style={{
                    color: hoveredCard === card.id ? '#ffffff' : '#4b5563',
                    transform: hoveredCard === card.id ? 'translateX(4px)' : 'translateX(0)'
                  }}
                >
                  <span>Explore</span>
                  <ArrowRight 
                    className="w-4 h-4 ml-1 transition-transform duration-400"
                    style={{
                      transform: hoveredCard === card.id ? 'translateX(4px)' : 'translateX(0)'
                    }}
                  />
                </div>

                {/* Mini preview mockup with entrance animation */}
                {hoveredCard === card.id && (
                  <div 
                    className="absolute -top-2 -right-2 w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-2 shadow-2xl"
                    style={{
                      animation: 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                      transformOrigin: 'top right'
                    }}
                  >
                    <div className="space-y-1">
                      <div className="h-1.5 bg-gray-700 rounded w-full animate-fade-in" style={{ animationDelay: '100ms' }}></div>
                      <div className="h-1.5 bg-gray-700 rounded w-3/4 animate-fade-in" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-1.5 bg-gray-700 rounded w-1/2 animate-fade-in" style={{ animationDelay: '200ms' }}></div>
                      <div className={`mt-2 h-8 bg-gradient-to-br ${card.color} rounded opacity-20 animate-fade-in`} style={{ animationDelay: '250ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 animate-fade-in">Everything you need</h2>
            <p className="text-xl font-medium text-gray-300 animate-fade-in" style={{ animationDelay: '100ms' }}>Simple, powerful tools to grow your business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group text-center transform transition-all duration-500 hover:scale-110 cursor-pointer ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} 
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 group-hover:bg-gray-100 group-hover:shadow-2xl group-hover:rotate-6 transition-all duration-300 animate-float" style={{ animationDelay: `${index * 200}ms` }}>
                  <feature.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gray-100 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { value: '50K+', label: 'Active Users', icon: Users },
              { value: '99.9%', label: 'Uptime', icon: Zap },
              { value: '150+', label: 'Countries', icon: TrendingUp },
              { value: '24/7', label: 'Support', icon: Clock }
            ].map((stat, index) => (
              <div 
                key={index} 
                className={`group transform transition-all duration-500 hover:scale-110 cursor-pointer ${isAnimated ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
                style={{ transitionDelay: `${600 + index * 100}ms` }}
              >
                <stat.icon className="w-8 h-8 text-gray-500 mx-auto mb-3 group-hover:text-white group-hover:scale-125 transition-all duration-300" />
                <div className="text-4xl font-bold text-white mb-2 transition-colors">{stat.value}</div>
                <div className="text-gray-400 font-semibold group-hover:text-white transition-colors">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-full mb-8 animate-bounce-subtle">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">Enterprise-grade security</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 animate-fade-in">Trusted by leading companies</h2>
          <p className="text-lg font-medium text-gray-300 mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>Join thousands of businesses that trust CRM Vision with their customer data</p>
          <div className="flex flex-wrap justify-center gap-12">
            {['Microsoft', 'Google', 'Amazon', 'Apple', 'Meta', 'Tesla'].map((company, index) => (
              <div 
                key={company} 
                className="text-2xl font-bold text-gray-500 hover:text-white transition-all duration-300 cursor-pointer hover:scale-125 animate-fade-in"
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-scale-in">
            Start growing today
          </h2>
          <p className="text-xl font-semibold text-gray-300 mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
            Free 14-day trial. No credit card required.
          </p>
          <Link 
            href="/auth/register" 
            className="inline-flex items-center space-x-2 px-10 py-5 bg-white text-black text-lg font-bold rounded-lg hover:bg-gray-100 hover:scale-110 hover:shadow-2xl transition-all duration-300 group animate-fade-in" 
            style={{ animationDelay: '400ms' }}
          >
            <span>Get started for free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
          <p className="mt-8 text-sm font-semibold text-gray-400 animate-fade-in" style={{ animationDelay: '600ms' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-white font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
