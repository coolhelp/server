"use client";

import Link from "next/link";
import { Search, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { sidebarOpen } = useAppStore();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-midnight/80 backdrop-blur-xl border-b border-graphite transition-all duration-300",
        sidebarOpen ? "left-64" : "left-20"
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Title */}
        <div>
          <h2 className="font-display font-semibold text-xl text-snow">{title}</h2>
          {subtitle && <p className="text-sm text-silver">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-64 pl-10 pr-4 py-2 bg-obsidian border border-graphite rounded-lg text-sm text-cloud placeholder:text-silver focus:outline-none focus:border-electric transition-colors"
            />
          </div>

          {/* Profile */}
          <Link
            href="/settings?tab=profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate/50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric to-cyan flex items-center justify-center">
              <User className="w-4 h-4 text-midnight" />
            </div>
            <span className="text-sm text-cloud hidden sm:block">Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
