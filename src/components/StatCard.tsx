"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "electric" | "mint" | "coral" | "amber" | "cyan";
  delay?: number;
}

const colorClasses = {
  electric: {
    bg: "bg-electric/10",
    border: "border-electric/20",
    text: "text-electric-bright",
    glow: "bg-electric",
  },
  mint: {
    bg: "bg-mint/10",
    border: "border-mint/20",
    text: "text-mint-bright",
    glow: "bg-mint",
  },
  coral: {
    bg: "bg-coral/10",
    border: "border-coral/20",
    text: "text-coral-bright",
    glow: "bg-coral",
  },
  amber: {
    bg: "bg-amber/10",
    border: "border-amber/20",
    text: "text-amber-bright",
    glow: "bg-amber",
  },
  cyan: {
    bg: "bg-cyan/10",
    border: "border-cyan/20",
    text: "text-cyan",
    glow: "bg-cyan",
  },
};

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color,
  delay = 0,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className="stat-card opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2",
          colors.glow
        )}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              colors.bg,
              "border",
              colors.border
            )}
          >
            <Icon className={cn("w-6 h-6", colors.text)} />
          </div>
          {change && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                changeType === "positive" && "bg-mint/10 text-mint-bright",
                changeType === "negative" && "bg-coral/10 text-coral-bright",
                changeType === "neutral" && "bg-slate text-silver"
              )}
            >
              {change}
            </span>
          )}
        </div>

        <h3 className="text-sm text-silver mb-1">{title}</h3>
        <p className={cn("text-3xl font-display font-bold", colors.text)}>
          {value}
        </p>
      </div>
    </div>
  );
}

