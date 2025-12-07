import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function calculateBidSuggestion(
  budget: { min: number; max: number },
  strategy: "competitive" | "premium" | "budget"
): number {
  const range = budget.max - budget.min;
  
  switch (strategy) {
    case "competitive":
      return Math.round(budget.min + range * 0.4);
    case "premium":
      return Math.round(budget.min + range * 0.75);
    case "budget":
      return Math.round(budget.min + range * 0.15);
    default:
      return Math.round(budget.min + range * 0.5);
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "text-mint-bright";
  if (confidence >= 0.6) return "text-amber-bright";
  return "text-coral-bright";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "open":
    case "submitted":
      return "badge-electric";
    case "accepted":
    case "awarded":
      return "badge-mint";
    case "rejected":
    case "closed":
      return "badge-coral";
    case "draft":
      return "badge-amber";
    default:
      return "badge-electric";
  }
}

