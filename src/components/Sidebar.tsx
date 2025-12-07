"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderSearch,
  MessageSquareText,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderSearch,
  },
  {
    href: "/qa-generator",
    label: "Q&A Generator",
    icon: MessageSquareText,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-obsidian border-r border-graphite transition-all duration-300 ease-smooth",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-graphite">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric via-cyan to-mint flex items-center justify-center">
              <Zap className="w-5 h-5 text-midnight" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-electric via-cyan to-mint rounded-xl opacity-30 blur-sm -z-10" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="font-display font-bold text-lg text-snow tracking-tight">
                BidFlow
              </h1>
              <p className="text-xs text-silver -mt-0.5">Freelancer Q&A</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-electric/10 text-electric-bright border border-electric/20"
                  : "text-silver hover:text-snow hover:bg-slate/50",
                !sidebarOpen && "justify-center"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-electric")} />
              {sidebarOpen && (
                <span className="font-medium animate-fade-in">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate border border-graphite flex items-center justify-center text-silver hover:text-snow hover:bg-steel transition-all duration-200"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Footer */}
      {sidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-graphite">
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              <span className="text-xs text-silver">System Status</span>
            </div>
            <p className="text-xs text-cloud">
              AI Ready • API Connected
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

