'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github,
  Twitter,
  MessageCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);

  const coreValues = [
    {
      id: 'innovation',
      icon: Sparkles,
      title: 'Innovation',
      description: 'Constantly pushing boundaries to deliver cutting-edge CRM solutions that transform how businesses operate.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'simplicity',
      icon: Zap,
      title: 'Simplicity',
      description: 'Making powerful tools accessible through intuitive design that anyone can master in minutes.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'reliability',
      icon: Shield,
      title: 'Reliability',
      description: '99.9% uptime with enterprise-grade security ensuring your data is always safe and accessible.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'growth',
      icon: TrendingUp,
      title: 'Growth',
      description: 'Empowering businesses to scale efficiently with tools that grow alongside your success.',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const contactMethods = [
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      value: 'visionakl08@gmail.com',
      href: 'mailto:visionakl08@gmail.com',
      color: 'blue'
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Phone',
      value: '+91 8780546982',
      href: 'tel:+918780546982',
      color: 'green'
    },
    {
      id: 'location',
      icon: MapPin,
      label: 'Location',
      value: 'Mota Varachha, Surat, Gujarat, India',
      href: 'https://maps.google.com/?q=Mota+Varachha+Surat+Gujarat+India',
      color: 'purple'
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Live Chat',
      value: 'Available 24/7',
      href: '#',
      color: 'orange'
    }
  ];

  const socialLinks = [
    {
      id: 'website',
      icon: Globe,
      label: 'Official Website',
      value: 'crmvision.com',
      href: 'https://crmvision.com',
      color: 'blue'
    },
    {
      id: 'linkedin',
      icon: Linkedin,
      label: 'LinkedIn',
      value: '@crmvision',
      href: 'https://linkedin.com/company/crmvision',
      color: 'blue'
    },
    {
      id: 'github',
      icon: Github,
      label: 'GitHub',
      value: '@crmvision',
      href: 'https://github.com/crmvision',
      color: 'gray'
    },
    {
      id: 'twitter',
      icon: Twitter,
      label: 'Twitter',
      value: '@crmvision',
      href: 'https://twitter.com/crmvision',
      color: 'cyan'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '150+', label: 'Countries' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ];

  const teamMembers = [
    {
      id: 'ceo',
      name: 'Vision Team',
      role: 'Founders & Leadership',
      description: 'Leading innovation in CRM technology',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'eng',
      name: 'Engineering Team',
      role: 'Product Development',
      description: 'Building scalable and reliable solutions',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'support',
      name: 'Support Team',
      role: 'Customer Success',
      description: 'Ensuring your success every step',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'design',
      name: 'Design Team',
      role: 'User Experience',
      description: 'Crafting intuitive interfaces',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const getColorGradient = (color: string) => {
    const gradients: { [key: string]: string } = {
      blue: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
      green: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
      purple: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
      orange: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
      cyan: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
      gray: 'radial-gradient(circle, rgba(107, 114, 128, 0.4) 0%, transparent 70%)'
    };
    return gradients[color] || gradients.blue;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-900/20 rounded-full blur-3xl top-0 left-0 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-purple-900/20 rounded-full blur-3xl bottom-0 right-0 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-8 animate-fade-in">
            <Heart className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">Built with passion for businesses like yours</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            About <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">CRM Vision</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
            We're on a mission to simplify customer relationship management for businesses of all sizes.
          </p>

          <div className="flex flex-wrap justify-center gap-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Vision */}
            <div 
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500"
              onMouseEnter={() => setHoveredValue('vision')}
              onMouseLeave={() => setHoveredValue(null)}
            >
              <div className="relative">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative w-16 h-16 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/[0.07] group-hover:border-white/20 transition-all duration-500 overflow-hidden">
                    {hoveredValue === 'vision' && (
                      <div 
                        className="absolute w-24 h-24 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                        style={{
                          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                          pointerEvents: 'none'
                        }}
                      ></div>
                    )}
                    <Eye className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Our Vision</h2>
                </div>
                <p className="text-lg text-gray-300 leading-relaxed">
                  To become the world's most trusted and intuitive CRM platform, empowering businesses to build 
                  meaningful customer relationships through innovative technology and exceptional user experience.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div 
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500"
              onMouseEnter={() => setHoveredValue('mission')}
              onMouseLeave={() => setHoveredValue(null)}
            >
              <div className="relative">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative w-16 h-16 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/[0.07] group-hover:border-white/20 transition-all duration-500 overflow-hidden">
                    {hoveredValue === 'mission' && (
                      <div 
                        className="absolute w-24 h-24 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                        style={{
                          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
                          pointerEvents: 'none'
                        }}
                      ></div>
                    )}
                    <Target className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Our Mission</h2>
                </div>
                <p className="text-lg text-gray-300 leading-relaxed">
                  To simplify customer relationship management by delivering powerful, easy-to-use tools that help 
                  businesses grow, scale, and succeed in today's competitive marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-400">The principles that guide everything we do</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value) => (
              <div
                key={value.id}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500"
                onMouseEnter={() => setHoveredValue(value.id)}
                onMouseLeave={() => setHoveredValue(null)}
              >
                <div className="relative">
                  <div className="relative w-14 h-14 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/[0.07] group-hover:border-white/20 group-hover:scale-110 transition-all duration-500 overflow-hidden">
                    {hoveredValue === value.id && (
                      <div 
                        className="absolute w-20 h-20 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                        style={{
                          background: value.id === 'innovation' 
                            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
                            : value.id === 'simplicity'
                            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
                            : value.id === 'reliability'
                            ? 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
                          pointerEvents: 'none'
                        }}
                      ></div>
                    )}
                    <value.icon className="w-7 h-7 text-white relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-400">Passionate experts dedicated to your success</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500"
                onMouseEnter={() => setHoveredTeam(member.id)}
                onMouseLeave={() => setHoveredTeam(null)}
              >
                <div className="relative">
                  <div className="relative w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-white/[0.07] group-hover:border-white/20 group-hover:scale-110 transition-all duration-500 overflow-hidden">
                    {hoveredTeam === member.id && (
                      <div 
                        className="absolute w-28 h-28 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                        style={{
                          background: member.id === 'ceo' 
                            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
                            : member.id === 'eng'
                            ? 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)'
                            : member.id === 'support'
                            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
                          pointerEvents: 'none'
                        }}
                      ></div>
                    )}
                    <Users className="w-10 h-10 text-white relative z-10" />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center mb-1">{member.name}</h3>
                  <p className="text-sm text-gray-400 text-center mb-2">{member.role}</p>
                  <p className="text-xs text-gray-500 text-center">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-400">We'd love to hear from you</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method) => (
              <a
                key={method.id}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 hover:scale-105 transition-all duration-500"
                onMouseEnter={() => setHoveredContact(method.id)}
                onMouseLeave={() => setHoveredContact(null)}
              >
                <div className="relative">
                  <div className="relative w-12 h-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-4 transition-all duration-500 overflow-hidden">
                    {hoveredContact === method.id && (
                      <div 
                        className="absolute w-16 h-16 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                        style={{
                          background: getColorGradient(method.color),
                          pointerEvents: 'none'
                        }}
                      ></div>
                    )}
                    <method.icon className="w-6 h-6 text-white relative z-10" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">{method.label}</h3>
                  <p className="text-white font-medium text-sm break-words">{method.value}</p>
                  <ArrowRight className="w-4 h-4 text-white absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </a>
            ))}
          </div>

          {/* Official Links & Social Media */}
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Connect With Us</h3>
              <p className="text-gray-400">Follow our journey and stay updated</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 hover:scale-105 transition-all duration-500"
                  onMouseEnter={() => setHoveredContact(social.id)}
                  onMouseLeave={() => setHoveredContact(null)}
                >
                  <div className="relative">
                    <div className="relative w-12 h-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-4 transition-all duration-500 overflow-hidden">
                      {hoveredContact === social.id && (
                        <div 
                          className="absolute w-16 h-16 rounded-full blur-3xl opacity-30 transition-opacity duration-700"
                          style={{
                            background: getColorGradient(social.color),
                            pointerEvents: 'none'
                          }}
                        ></div>
                      )}
                      <social.icon className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">{social.label}</h3>
                    <p className="text-white font-medium text-sm">{social.value}</p>
                    <ArrowRight className="w-4 h-4 text-white absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of companies already using CRM Vision
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="group px-8 py-4 bg-white text-black text-lg font-bold rounded-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/features"
              className="group px-8 py-4 bg-transparent text-white text-lg font-bold border-2 border-white rounded-lg transition-all duration-300 hover:bg-white hover:!text-black"
            >
              Explore Features
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
