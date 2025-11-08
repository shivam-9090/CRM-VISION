'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { LayoutDashboard, Users, Briefcase, Calendar, User, LogOut, Download, UserCog } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { getStoredUser } from '@/lib/auth-utils';
import { useEffect, useState } from 'react';

// Base navigation items available to all users
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Deals', href: '/deals', icon: Briefcase },
  { name: 'Activities', href: '/activities', icon: Calendar },
  { name: 'Export/Import', href: '/export', icon: Download },
  { name: 'Profile', href: '/profile', icon: User },
];

// Manager/Admin-only navigation items
const managerNavigation = [
  { name: 'Employees', href: '/employees', icon: UserCog, roles: ['MANAGER', 'ADMIN'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState(baseNavigation);

  // Check user role and add manager-only items
  useEffect(() => {
    const user = getStoredUser();
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      // Insert Employees link before Profile (after Export/Import)
      const navWithEmployees = [
        ...baseNavigation.slice(0, -1), // All items except Profile
        ...managerNavigation, // Add Employees
        baseNavigation[baseNavigation.length - 1] // Add Profile at the end
      ];
      setNavigation(navWithEmployees);
    } else {
      setNavigation(baseNavigation);
    }
  }, []);

  return (
    <aside 
      className="flex flex-col w-72 bg-white min-h-screen border-r border-gray-200 shadow-sm"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
        <div className="text-center flex-1">
          <h1 className="text-black text-2xl font-bold tracking-wide">CRM</h1>
          <p className="text-gray-600 text-xs font-medium tracking-wider">VISION</p>
        </div>
        <NotificationBell />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2" aria-label="Primary navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={`${item.name} ${isActive ? '(current page)' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive
                  ? 'bg-black text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              <Icon 
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-black'
                }`}
                style={isActive ? { color: 'white' } : undefined}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          aria-label="Logout from application"
          className="w-full group flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}
