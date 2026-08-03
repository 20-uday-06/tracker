"use client";

import { format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatMinutes } from "@/lib/calculations";
import type { Problem } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeeklyRecapProps {
  problems: Problem[];
  sessions: { source: string; duration: number; date: string }[];
}

export function WeeklyRecap({ problems, sessions }: WeeklyRecapProps) {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  const isThisWeek = (d: Date) => d >= thisWeekStart && d <= today;
  const isLastWeek = (d: Date) => d >= lastWeekStart && d < thisWeekStart;

  const thisWeekAttempts = problems
    .flatMap((p) => p.attempts.map((a) => ({ ...a, problem: p })))
    .filter((a) => isThisWeek(parseISO(a.attemptedAt)));

  const lastWeekAttempts = problems
    .flatMap((p) => p.attempts.map((a) => ({ ...a, problem: p })))
    .filter((a) => isLastWeek(parseISO(a.attemptedAt)));

  const thisWeekMinutes = sessions
    .filter((s) => isThisWeek(parseISO(s.date)))
    .reduce((sum, s) => sum + s.duration, 0);

  const thisWeekRate = thisWeekAttempts.length > 0
    ? Math.round((thisWeekAttempts.filter((a) => a.result === "Independent").length / thisWeekAttempts.length) * 100)
    : 0;

  const lastWeekRate = lastWeekAttempts.length > 0
    ? Math.round((lastWeekAttempts.filter((a) => a.result === "Independent").length / lastWeekAttempts.length) * 100)
    : 0;

  const rateDiff = thisWeekRate - lastWeekRate;

  const bySource: Record<string, number> = {};
  for (const a of thisWeekAttempts) {
    bySource[a.problem.source] = (bySource[a.problem.source] || 0) + 1;
  }

  const topicCounts: Record<string, { total: number; independent: number }> = {};
  for (const a of thisWeekAttempts) {
    for (const topic of a.problem.topics) {
      if (!topicCounts[topic]) topicCounts[topic] = { total: 0, independent: 0 };
      topicCounts[topic].total++;
      if (a.result === "Independent") topicCounts[topic].independent++;
    }
  }

  const topicEntries = Object.entries(topicCounts)
    .filter(([, v]) => v.total >= 2)
    .map(([k, v]) => ({ topic: k, rate: v.total > 0 ? v.independent / v.total : 0, total: v.total }));

  const strongestTopic = topicEntries.sort((a, b) => b.rate - a.rate)[0];
  const weakestTopic = topicEntries.sort((a, b) => a.rate - b.rate)[0];

  if (thisWeekAttempts.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Weekly Recap</h2>
        <span className="text-xs text-zinc-600">{format(thisWeekStart, "MMM d")} — {format(today, "MMM d")}</span>
      </div>
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-5">
          <div>
            <p className="text-xs text-zinc-600 mb-1">Focus Time</p>
            <p className="text-lg font-semibold font-mono-num text-zinc-100">{formatMinutes(thisWeekMinutes)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-1">Problems</p>
            <p className="text-lg font-semibold font-mono-num text-zinc-100">{thisWeekAttempts.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-1">Independent Rate</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold font-mono-num text-zinc-100">{thisWeekRate}%</p>
              {lastWeekAttempts.length > 0 && (
                <span className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  rateDiff > 0 ? "text-green-400" : rateDiff < 0 ? "text-red-400" : "text-zinc-500"
                )}>
                  {rateDiff > 0 ? <TrendingUp className="w-3 h-3" /> : rateDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {rateDiff > 0 ? "+" : ""}{rateDiff}%
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-1">Sessions</p>
            <p className="text-lg font-semibold font-mono-num text-zinc-100">
              {sessions.filter((s) => isThisWeek(parseISO(s.date))).length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-zinc-800">
          {Object.entries(bySource).map(([src, count]) => (
            <div key={src} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{SOURCE_LABELS[src] || src}</span>
              <span className="text-xs font-mono-num font-medium text-zinc-300">{count}</span>
            </div>
          ))}
          {strongestTopic && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Strongest</span>
              <span className="text-xs font-medium text-green-400">{strongestTopic.topic}</span>
            </div>
          )}
          {weakestTopic && weakestTopic.topic !== strongestTopic?.topic && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Needs work</span>
              <span className="text-xs font-medium text-orange-400">{weakestTopic.topic}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
