'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { LayoutDashboard, Building2, Users, Briefcase, Calendar, User, LogOut, Download } from 'lucide-react';
import NotificationBell from '../NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Deals', href: '/deals', icon: Briefcase },
  { name: 'Activities', href: '/activities', icon: Calendar },
  { name: 'Export/Import', href: '/export', icon: Download },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-72 bg-white min-h-screen border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
        <div className="text-center flex-1">
          <h1 className="text-black text-2xl font-bold tracking-wide">CRM</h1>
          <p className="text-gray-600 text-xs font-medium tracking-wider">VISION</p>
        </div>
        <NotificationBell />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                isActive
                  ? 'bg-black text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 transition-colors ${
                isActive ? 'text-white !important' : 'text-gray-500 group-hover:text-black'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full group flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors" />
          Logout
        </button>
      </div>
    </div>
  );
}
