"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  User,
  LogOut,
  Download,
  UserCog,
  Menu,
  X,
  Activity,
} from "lucide-react";
import NotificationBell from "../NotificationBell";
import { getStoredUser } from "@/lib/auth-utils";
import { useEffect, useState } from "react";

// Base navigation items available to all users
const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Deals", href: "/deals", icon: Briefcase },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Activities", href: "/activities", icon: Activity },
  { name: "Export/Import", href: "/export", icon: Download },
  { name: "Profile", href: "/profile", icon: User },
];

// Manager/Admin-only navigation items
const managerNavigation = [
  {
    name: "Employees",
    href: "/employees",
    icon: UserCog,
    roles: ["MANAGER", "ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState(baseNavigation);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check user role and add manager-only items
  useEffect(() => {
    const user = getStoredUser();
    if (user && (user.role === "MANAGER" || user.role === "ADMIN")) {
      // Insert Employees link before Profile (after Export/Import)
      const navWithEmployees = [
        ...baseNavigation.slice(0, -1), // All items except Profile
        ...managerNavigation, // Add Employees
        baseNavigation[baseNavigation.length - 1], // Add Profile at the end
      ];
      setNavigation(navWithEmployees);
    } else {
      setNavigation(baseNavigation);
    }
  }, []);

  return (
    <aside
      className={`flex flex-col bg-white min-h-screen border-r border-gray-200 shadow-sm transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="text-center flex-1">
            <h1 className="text-black text-xl font-bold tracking-wide">CRM</h1>
            <p className="text-gray-600 text-xs font-medium tracking-wider">
              VISION
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          {!isCollapsed && <NotificationBell />}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-3 py-6 space-y-1"
        aria-label="Primary navigation"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={`${item.name} ${isActive ? "(current page)" : ""}`}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center ${
                isCollapsed ? "justify-center px-2" : "px-3"
              } py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive
                  ? "bg-black text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isCollapsed ? "" : "mr-3"
                } ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-black"
                }`}
                stroke={isActive ? "white" : undefined}
                fill={isActive ? "white" : undefined}
                aria-hidden="true"
              />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          aria-label="Logout from application"
          className={`w-full group flex items-center ${
            isCollapsed ? "justify-center px-2" : "px-3"
          } py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut
            className={`h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors ${
              isCollapsed ? "" : "mr-3"
            }`}
            aria-hidden="true"
          />
          {!isCollapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
