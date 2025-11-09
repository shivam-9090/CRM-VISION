'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Award, 
  Lightbulb,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsAnimated(true), 100);
  }, []);

  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do, ensuring their success is our success.',
      color: 'from-gray-900 to-gray-700'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Constantly evolving and improving our platform with cutting-edge features and technologies.',
      color: 'from-gray-800 to-gray-600'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Enterprise-grade security and privacy protection for your sensitive business data.',
      color: 'from-gray-900 to-gray-700'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Building tools that bring teams together and enhance productivity across your organization.',
      color: 'from-gray-800 to-gray-600'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '150+', label: 'Countries' },
    { value: '24/7', label: 'Support' }
  ];

  const milestones = [
    { year: '2020', title: 'Company Founded', description: 'Started with a vision to transform CRM' },
    { year: '2021', title: 'First 1K Users', description: 'Reached our first major milestone' },
    { year: '2023', title: 'Series A Funding', description: 'Raised $10M to accelerate growth' },
    { year: '2025', title: 'Global Expansion', description: 'Now serving 150+ countries worldwide' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About
              <span className="block mt-2">
                CRM Vision
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;re on a mission to help businesses build better customer relationships 
              through innovative technology and exceptional service.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 p-4">
                  <Target className="w-full h-full text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                To empower businesses of all sizes with an intuitive, powerful CRM platform 
                that simplifies customer relationship management and drives growth. We believe 
                every business deserves access to world-class tools that help them succeed.
              </p>
            </div>

            <div className={`transform transition-all duration-1000 delay-300 ${isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 p-4">
                  <Eye className="w-full h-full text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                To become the world&apos;s most trusted CRM platform, known for exceptional 
                user experience, continuous innovation, and unwavering commitment to 
                customer success. We envision a future where every business interaction 
                is meaningful and productive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-1000 delay-${index * 100} ${
                  isAnimated ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                }`}
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-300 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className={`p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-500 transform ${
                  isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.color} p-3 mb-6`}>
                  <value.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600">
              Key milestones in our growth story
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 transform transition-all duration-1000 delay-${index * 200} ${
                  isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                }`}
              >
                <div className="flex-shrink-0 w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {milestone.year}
                </div>
                <div className="flex-grow p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Join Us on This Journey
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Be part of the CRM revolution and transform how you manage customer relationships
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-all duration-300 space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
