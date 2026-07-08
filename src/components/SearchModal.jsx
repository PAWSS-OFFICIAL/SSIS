import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import {
  Search,
  Command,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Settings,
  Trophy,
  Briefcase,
  Users,
  LogOut,
  ArrowRight,
  Loader2
} from "lucide-react";

const allNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", keywords: "home main" },
  { icon: BookOpen, label: "Courses", path: "/courses", keywords: "subjects classes" },
  { icon: GraduationCap, label: "Grades", path: "/grades", keywords: "marks scores results" },
  { icon: Calendar, label: "Attendance", path: "/attendance", keywords: "presence" },
  { icon: FileText, label: "Classwork", path: "/classwork", keywords: "assignments homework" },
  { icon: Calendar, label: "Timetable", path: "/timetable", keywords: "schedule classes" },
  { icon: Trophy, label: "Rewards", path: "/gamification", keywords: "badges points achievements" },
  { icon: Briefcase, label: "Jobs", path: "/jobs", keywords: "career placements" },
  { icon: Settings, label: "Settings", path: "/settings", keywords: "preferences" },
  { icon: LogOut, label: "Logout", path: "/logout", keywords: "sign out exit" },
];

const quickActions = [
  { label: "View Grades", action: () => {}, shortcut: "G" },
  { label: "Check Attendance", action: () => {}, shortcut: "A" },
  { label: "Submit Assignment", action: () => {}, shortcut: "S" },
];

export const SearchModal = ({ open, onOpenChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filter items based on role and query
  const filteredItems = allNavItems.filter(item => {
    const matchesRole = 
      user?.role === "Student" ? 
        ["/dashboard", "/courses", "/grades", "/attendance", "/classwork", "/timetable", "/gamification", "/jobs", "/settings", "/logout"].includes(item.path) :
      user?.role === "Teacher" ?
        ["/teacher", "/courses", "/grades", "/attendance", "/classwork", "/timetable", "/settings"].includes(item.path) :
      user?.role === "Admin" ?
        ["/admin", "/admin/users", "/courses", "/grades", "/attendance", "/settings"].includes(item.path) :
      true;
    
    const matchesQuery = 
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.keywords.toLowerCase().includes(query.toLowerCase());
    
    return matchesRole && matchesQuery;
  });

  const handleSelect = useCallback((item) => {
    if (item.path === "/logout") {
      logout();
      navigate("/login");
    } else {
      navigate(item.path);
    }
    onOpenChange(false);
    setQuery("");
  }, [navigate, logout, onOpenChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }

      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case "Escape":
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, handleSelect, onOpenChange]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search pages, actions, or type a command..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 focus-visible:ring-0 text-lg placeholder:text-slate-400"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
              <Command className="w-3 h-3" />
              K
            </kbd>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
            </div>
          ) : (
            <>
              {/* Navigation Items */}
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">
                  Navigation
                </p>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        selectedIndex === idx
                          ? "bg-slate-100 dark:bg-slate-800"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <item.icon className={cn(
                        "w-5 h-5",
                        selectedIndex === idx ? "text-[#1a365d] dark:text-blue-400" : "text-slate-400"
                      )} />
                      <span className={cn(
                        "flex-1",
                        selectedIndex === idx ? "text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {item.label}
                      </span>
                      <ArrowRight className={cn(
                        "w-4 h-4",
                        selectedIndex === idx ? "opacity-100" : "opacity-0"
                      )} />
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-500 text-center">
                    No results found for "{query}"
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              {!query && (
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">
                    Quick Actions
                  </p>
                  {quickActions.map((action, idx) => (
                    <button
                      key={action.label}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-slate-600 dark:text-slate-400">{action.label}</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                        {action.shortcut}
                      </kbd>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">↑↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">↵</kbd>
                to select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">esc</kbd>
              to close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
