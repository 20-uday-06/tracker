"use client";

import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/types";
import { formatMinutes } from "@/lib/calculations";
import type { DailyTarget, Problem, StudySession } from "@/lib/types";

const SOURCE_ORDER = ["NeetCode150", "StriverSDE", "CP31", "Reattempt"];

interface DailyGrindProps {
  problems: Problem[];
  sessions: StudySession[];
  targets: DailyTarget[];
}

export function DailyGrind({ problems, sessions, targets }: DailyGrindProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Today's problems by source
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

  // Today's sessions by source
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
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        Today&apos;s Grind
      </h2>
      <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
        <div className="divide-y divide-zinc-800/60">
          {activeSources.map((src) => {
            const data = bySource[src] || { problems: 0, minutes: 0 };
            const target = targetMap[src];
            const pct = target ? Math.min((data.minutes / target) * 100, 100) : null;

            return (
              <div key={src} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <p className="text-sm text-zinc-200 font-medium">{SOURCE_LABELS[src] || src}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {data.problems > 0 ? `${data.problems} problem${data.problems !== 1 ? "s" : ""}` : "—"}
                  </p>
                </div>

                <div className="flex-1">
                  {pct !== null ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono-num text-zinc-400">
                          {formatMinutes(data.minutes)}{" "}
                          <span className="text-zinc-600">/ {formatMinutes(target!)}</span>
                        </span>
                        <span className={cn(
                          "text-xs font-mono-num",
                          pct >= 100 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-zinc-500"
                        )}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
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
                    <p className="text-xs text-zinc-600">
                      {data.minutes > 0 ? formatMinutes(data.minutes) : "No target set"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
