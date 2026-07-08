import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Users,
  Settings,
  Trophy,
  Briefcase,
} from "lucide-react";
import { cn } from "../lib/utils";

const navItems = {
  Admin: [
    { icon: LayoutDashboard, label: "Home", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: BookOpen, label: "Courses", path: "/courses" },
    { icon: Settings, label: "More", path: "/settings" },
  ],
  Teacher: [
    { icon: LayoutDashboard, label: "Home", path: "/teacher" },
    { icon: BookOpen, label: "Courses", path: "/courses" },
    { icon: GraduationCap, label: "Grades", path: "/grades" },
    { icon: Settings, label: "More", path: "/settings" },
  ],
  Student: [
    { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
    { icon: BookOpen, label: "Courses", path: "/courses" },
    { icon: Trophy, label: "Rewards", path: "/gamification" },
    { icon: Briefcase, label: "Jobs", path: "/jobs" },
    { icon: Settings, label: "More", path: "/settings" },
  ],
  Parent: [
    { icon: LayoutDashboard, label: "Home", path: "/parent" },
    { icon: GraduationCap, label: "Grades", path: "/grades" },
    { icon: Calendar, label: "Attendance", path: "/attendance" },
    { icon: Settings, label: "More", path: "/settings" },
  ],
};

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const items = navItems[user?.role] || navItems.Student;

  // Don't show on login pages
  if (!user || location.pathname === "/login" || location.pathname === "/forgot-password") {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-0",
                "transition-colors duration-200",
                isActive
                  ? "text-[#1a365d] dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium truncate max-w-full px-1">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-[#1a365d] dark:bg-blue-400 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
