"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Flame, BookOpen, Clock, Target, Plus, TrendingUp, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  calculateStreak, getTodayStats, getHeatmapData,
  getGreeting, getMotivationalSuffix, formatMinutes,
  getStudyDayKey, getTodayStudyKey,
} from "@/lib/calculations";
import { useDayStartHour } from "@/hooks/useDayStartHour";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { AddProblemDialog } from "@/components/problems/AddProblemDialog";
import { ResultBadge, DifficultyBadge, PlatformBadge } from "@/components/shared/ResultBadge";
import { DailyGrind } from "@/components/dashboard/DailyGrind";
import { DayDetailPanel } from "@/components/dashboard/DayDetailPanel";
import { WeeklyRecap } from "@/components/dashboard/WeeklyRecap";
import type { DayActivity, Problem, StudySession } from "@/lib/types";
import { cn } from "@/lib/utils";

function MetricCard({ icon: Icon, label, value, sub, color = "text-zinc-400", onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-[#111113] border border-zinc-800 rounded-lg px-5 py-4 flex flex-col gap-2 transition-colors",
        onClick ? "cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/30" : "hover:border-zinc-700"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={cn("text-2xl font-semibold font-mono-num leading-none", color === "text-zinc-400" ? "text-zinc-100" : color)}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ data: DayActivity | null; date: string } | null>(null);
  const { hour: dayStartHour } = useDayStartHour();

  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
  });

  const { data: targets } = useQuery({
    queryKey: ["targets"],
    queryFn: () => fetch("/api/targets").then((r) => r.json()),
  });

  const problems: Problem[] = data?.problems ?? [];
  const sessions = data?.sessions ?? [];

  const streak = calculateStreak(problems, sessions, 1, 30, dayStartHour);
  const todayStats = getTodayStats(problems, sessions, dayStartHour);
  const heatmapData = getHeatmapData(problems, sessions, dayStartHour);

  // Separate Timer Focus vs Problem Focus for today
  const todayStr = getTodayStudyKey(dayStartHour);
  let timerFocus = 0;
  let problemFocus = 0;
  sessions.forEach((s: StudySession) => {
    if (getStudyDayKey(s.date, dayStartHour) === todayStr && s.source === "Timer") timerFocus += s.duration;
  });
  problems.forEach((p: Problem) => {
    p.attempts.forEach((a) => {
      if (getStudyDayKey(a.attemptedAt, dayStartHour) === todayStr && a.timeSpent) problemFocus += a.timeSpent;
    });
  });

  const greeting = getGreeting();
  const motivation = getMotivationalSuffix(streak.current);

  // Recent problems (last 8 attempts)
  const recentAttempts = problems
    .flatMap((p) => p.attempts.map((a) => ({ ...a, problem: p })))
    .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())
    .slice(0, 8);

  // Reattempts due
  const reattemptsDue = problems
    .filter((p) => p.reattempt)
    .filter((p) => {
      const due = p.reattempt?.dueDate;
      if (!due) return true;
      return new Date(due) <= new Date();
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{greeting}.</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {motivation} <span className="text-zinc-600">·</span>{" "}
              {format(new Date(), "EEEE, MMMM d")}
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Problem
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Flame}
            label="Current Streak"
            value={`${streak.current} days`}
            sub={`Longest: ${streak.longest} days`}
            color="text-orange-400"
          />
          <MetricCard
            icon={BookOpen}
            label="Problems Today"
            value={todayStats.problemsToday}
            sub={`${todayStats.totalProblems} total problems`}
            onClick={() => {
              const today = format(new Date(), "yyyy-MM-dd");
              setSelectedDay({ data: heatmapData.find(d => d.date === today) || null, date: today });
            }}
          />
          <MetricCard
            icon={Clock}
            label="Focus Today"
            value={formatMinutes(todayStats.focusMinutesToday)}
            sub={`Timer: ${formatMinutes(timerFocus)} · Problems: ${formatMinutes(problemFocus)}`}
          />
          <MetricCard
            icon={Target}
            label="Independent Rate"
            value={`${todayStats.independentRate}%`}
            sub="Across all attempts"
            color={todayStats.independentRate >= 60 ? "text-green-400" : todayStats.independentRate >= 40 ? "text-yellow-400" : "text-red-400"}
          />
        </div>

        {/* Daily Grind */}
        <DailyGrind problems={problems} sessions={sessions} targets={targets ?? []} dayStartHour={dayStartHour} />

        {/* Activity Heatmap */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Activity</h2>
            <span className="text-xs text-zinc-600">{streak.totalActiveDays} active days</span>
          </div>
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 overflow-x-auto">
            <ActivityHeatmap
              activityData={heatmapData}
              onDayClick={(data, date) => setSelectedDay({ data, date })}
            />
          </div>
        </section>

        {/* Bottom grid: Recent + Reattempts + Weekly */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Problems */}
          <div className="lg:col-span-2 bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Problems</h2>
              <a href="/problems" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</a>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {recentAttempts.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-zinc-500">Your grind starts here.</p>
                  <p className="text-xs text-zinc-600 mt-1">Add your first problem to begin building history.</p>
                  <button onClick={() => setAddOpen(true)} className="mt-4 px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">
                    Add Problem
                  </button>
                </div>
              )}
              {recentAttempts.map((attempt) => (
                <div key={attempt.id} className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm text-zinc-200 truncate">{attempt.problem.title}</p>
                      <DifficultyBadge difficulty={attempt.problem.difficulty} cfRating={attempt.problem.cfRating} />
                    </div>
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={attempt.problem.platform} />
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-600">{format(new Date(attempt.attemptedAt), "MMM d")}</span>
                      {attempt.timeSpent && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-600 font-mono-num">{attempt.timeSpent}m</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ResultBadge result={attempt.result as any} />
                </div>
              ))}
            </div>
          </div>

          {/* Reattempts Due */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Reattempt Due</h2>
              <a href="/reattempt" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</a>
            </div>
            {reattemptsDue.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <RefreshCw className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">No reattempts due</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {reattemptsDue.map((p) => {
                  const latestAttempt = p.attempts[p.attempts.length - 1];
                  return (
                    <div key={p.id} className="px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                      <p className="text-sm text-zinc-200 truncate mb-1">{p.title}</p>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={p.platform} />
                        <span className="text-zinc-700">·</span>
                        {latestAttempt && <ResultBadge result={latestAttempt.result as any} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Recap */}
        <WeeklyRecap problems={problems} sessions={sessions} />

      </div>

      <AddProblemDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Day Detail Panel */}
      {selectedDay && (
        <DayDetailPanel
          date={selectedDay.date}
          activity={selectedDay.data}
          problems={problems}
          onClose={() => setSelectedDay(null)}
          dayStartHour={dayStartHour}
        />
      )}
    </div>
  );
}
