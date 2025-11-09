'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, TrendingUp, BarChart3, ArrowRight, Check, Zap, Shield, Clock } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';

export default function Home() {
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
                className="group relative w-full sm:w-auto px-8 py-4 bg-white text-black text-lg font-bold rounded-lg hover:bg-gray-100 hover:scale-105 hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden"
              >
                <span className="relative z-10">Start free trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
              <Link 
                href="/auth/login" 
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white text-lg font-bold border-2 border-white rounded-lg hover:bg-white hover:text-black hover:scale-105 transition-all duration-300"
              >
                Sign in
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
            <div className="relative rounded-2xl border-2 border-gray-700 overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500">
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
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Deals', value: '$2.4M', change: '+12%' },
                    { label: 'Contacts', value: '23,567', change: '+8%' },
                    { label: 'Conversion', value: '68%', change: '+5%' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                      <div className="text-sm font-semibold text-gray-400 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs font-bold text-green-400 mt-1">{stat.change}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="text-sm font-bold text-white mb-4">Recent Activity</div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 py-2 hover:bg-gray-700 rounded-lg transition-all duration-200 cursor-pointer animate-slide-in-left" style={{ animationDelay: `${i * 100 + 700}ms` }}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-700 rounded w-48 mb-2"></div>
                          <div className="h-2 bg-gray-800 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
