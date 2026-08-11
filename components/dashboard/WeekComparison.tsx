"use client";

import { useState, useMemo } from "react";
import { format, parseISO, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudyDayKey } from "@/lib/calculations";
import type { Problem, StudySession } from "@/lib/types";

interface WeekComparisonProps {
  problems: Problem[];
  sessions: StudySession[];
  dayStartHour?: number;
}

function Delta({ current, prev, suffix = "", invert = false }: { current: number; prev: number; suffix?: string; invert?: boolean }) {
  const diff = current - prev;
  const isPositive = invert ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;
  const label = diff > 0 ? `+${diff}${suffix}` : diff < 0 ? `${diff}${suffix}` : `0${suffix}`;

  return (
    <span className={cn(
      "flex items-center gap-0.5 text-xs font-medium",
      isNeutral ? "text-zinc-600" : isPositive ? "text-green-400" : "text-red-400"
    )}>
      {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {label}
    </span>
  );
}

export function WeekComparison({ problems, sessions, dayStartHour = 0 }: WeekComparisonProps) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const stats = useMemo(() => {
    const allAttempts = problems.flatMap((p) => p.attempts.map((a) => ({ ...a, problem: p })));

    const inRange = (dateStr: string, start: Date, end: Date) => {
      const d = parseISO(dateStr);
      return d >= start && d <= end;
    };

    const thisWeekAttempts = allAttempts.filter((a) => inRange(a.attemptedAt, thisWeekStart, thisWeekEnd));
    const lastWeekAttempts = allAttempts.filter((a) => inRange(a.attemptedAt, lastWeekStart, lastWeekEnd));

    const thisWeekSessions = sessions.filter((s) => inRange(s.date, thisWeekStart, thisWeekEnd));
    const lastWeekSessions = sessions.filter((s) => inRange(s.date, lastWeekStart, lastWeekEnd));

    const indRate = (attempts: typeof thisWeekAttempts) =>
      attempts.length > 0
        ? Math.round(((attempts.filter((a) => a.result === "Independent" || a.result === "Struggled").length) / attempts.length) * 100)
        : 0;

    return {
      this: {
        problems: thisWeekAttempts.length,
        focusMins: thisWeekSessions.reduce((s, x) => s + x.duration, 0),
        indRate: indRate(thisWeekAttempts),
      },
      last: {
        problems: lastWeekAttempts.length,
        focusMins: lastWeekSessions.reduce((s, x) => s + x.duration, 0),
        indRate: indRate(lastWeekAttempts),
      },
    };
  }, [problems, sessions]);

  const fmtMins = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  };

  const metrics = [
    {
      label: "Problems",
      this: stats.this.problems,
      last: stats.last.problems,
      thisDisplay: `${stats.this.problems}`,
      suffix: "",
    },
    {
      label: "Focus Time",
      this: stats.this.focusMins,
      last: stats.last.focusMins,
      thisDisplay: fmtMins(stats.this.focusMins),
      suffix: "m",
    },
    {
      label: "Independence",
      this: stats.this.indRate,
      last: stats.last.indRate,
      thisDisplay: `${stats.this.indRate}%`,
      suffix: "%",
    },
  ];

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">This Week vs Last</h2>
          <p className="text-[10px] text-zinc-600 mt-0.5">{format(thisWeekStart, "MMM d")} – {format(thisWeekEnd, "MMM d")}</p>
        </div>
        <span className="text-[10px] text-zinc-700 border border-zinc-800 rounded px-2 py-0.5">
          Last: {format(lastWeekStart, "MMM d")} – {format(lastWeekEnd, "MMM d")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-semibold font-mono-num text-zinc-100">{m.thisDisplay}</p>
            <div className="flex items-center gap-2">
              <Delta current={m.this} prev={m.last} suffix={m.suffix} />
              <span className="text-[10px] text-zinc-700">vs {m.label === "Focus Time" ? fmtMins(m.last) : m.label === "Independence" ? `${m.last}%` : m.last}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
