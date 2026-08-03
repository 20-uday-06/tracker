"use client";

import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/types";
import { formatMinutes } from "@/lib/calculations";
import type { DailyTarget, Problem, StudySession } from "@/lib/types";
import Link from "next/link";
import { Edit3 } from "lucide-react";

const SOURCE_ORDER = ["NeetCode150", "StriverSDE", "CP31", "Reattempt"];

interface DailyGrindProps {
  problems: Problem[];
  sessions: StudySession[];
  targets: DailyTarget[];
}

export function DailyGrind({ problems, sessions, targets }: DailyGrindProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const bySource: Record<string, { problems: number; minutes: number }> = {};
  for (const p of problems) {
    for (const a of p.attempts) {
      if (format(parseISO(a.attemptedAt), "yyyy-MM-dd") !== todayStr) continue;
      const src = p.source;
      if (!bySource[src]) bySource[src] = { problems: 0, minutes: 0 };
      bySource[src].problems++;
      bySource[src].minutes += a.timeSpent ?? 0;
    }
  }

  for (const s of sessions) {
    if (format(parseISO(s.date), "yyyy-MM-dd") !== todayStr) continue;
    const src = s.source;
    if (!bySource[src]) bySource[src] = { problems: 0, minutes: 0 };
    bySource[src].minutes += s.duration;
  }

  const targetMap: Record<string, number> = {};
  for (const t of targets) {
    targetMap[t.source] = t.minutes;
  }

  const activeSources = Array.from(
    new Set([...SOURCE_ORDER, ...Object.keys(bySource)])
  ).filter((src) => bySource[src] || targetMap[src]);

  if (activeSources.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Today&apos;s Grind & Targets
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Personal daily focus distribution across active sheets</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-md transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Targets
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeSources.map((src) => {
          const data = bySource[src] || { problems: 0, minutes: 0 };
          const target = targetMap[src];
          const pct = target ? Math.min((data.minutes / target) * 100, 100) : null;

          return (
            <div key={src} className="bg-[#111113] border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <p className="text-sm text-zinc-100 font-medium">{SOURCE_LABELS[src] || src}</p>
                <p className="text-xs text-zinc-500 font-mono-num">{data.problems} logged</p>
              </div>

              {pct !== null ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-mono-num font-medium",
                      pct >= 100 ? "text-green-400" : pct >= 50 ? "text-indigo-400" : "text-zinc-300"
                    )}>
                      {formatMinutes(data.minutes)}
                    </span>
                    <span className="text-xs font-mono-num text-zinc-500">
                      / {formatMinutes(target!)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-indigo-500" : "bg-zinc-600"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-auto">
                  <p className="text-xs text-zinc-500">
                    {data.minutes > 0 ? formatMinutes(data.minutes) : "No target set"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
