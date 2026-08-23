"use client";

import { cn } from "@/lib/utils";
import type { Result } from "@/lib/types";

interface ResultBadgeProps {
  result: Result;
  size?: "sm" | "md";
  showEmoji?: boolean;
}

const RESULT_CONFIG: Record<Result, { emoji: string; label: string; classes: string }> = {
  Independent: {
    emoji: "🟢",
    label: "Independent",
    classes: "bg-green-500/10 text-green-400 border border-green-500/20",
  },
  Struggled: {
    emoji: "🟡",
    label: "Struggled",
    classes: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  },
  Hint: {
    emoji: "🟠",
    label: "Hint",
    classes: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  },
  Solution: {
    emoji: "🔴",
    label: "Solution",
    classes: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

export function ResultBadge({ result, size = "sm", showEmoji = true }: ResultBadgeProps) {
  const config = RESULT_CONFIG[result];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        config.classes
      )}
    >
      {showEmoji && <span className="text-[10px]">{config.emoji}</span>}
      {config.label}
    </span>
  );
}

export function DifficultyBadge({
  difficulty,
  cfRating,
}: {
  difficulty?: string | null;
  cfRating?: number | null;
}) {
  if (cfRating) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        {cfRating}
      </span>
    );
  }
  if (!difficulty) return null;
  const classes: Record<string, string> = {
    Easy: "bg-green-500/10 text-green-400 border border-green-500/20",
    Medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    Hard: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", classes[difficulty] || "bg-zinc-800 text-zinc-400")}>
      {difficulty}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  const classes: Record<string, string> = {
    LeetCode:    "text-orange-400",
    Codeforces:  "text-blue-400",
    CSES:        "text-emerald-400",
    GFG:         "text-green-500",
    Code360:     "text-purple-400",
    InterviewBit:"text-cyan-400",
    Other:       "text-zinc-400",
  };
  return (
    <span className={cn("text-xs font-medium", classes[platform] || "text-zinc-400")}>
      {platform}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    NeetCode150: "NeetCode",
    StriverSDE:  "Striver",
    CP31:        "CP-31",
    CSES:        "CSES",
    CompanyPYQ:  "PYQ",
    Custom:      "Custom",
  };
  return (
    <span className="text-xs text-zinc-500">{labels[source] || source}</span>
  );
}

export function CompanyBadge({ company }: { company?: string | null }) {
  if (!company) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      {company}
    </span>
  );
}
