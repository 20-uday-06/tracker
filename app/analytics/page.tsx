"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { format, parseISO, subDays, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { calculateTopicMastery } from "@/lib/calculations";
import type { Problem } from "@/lib/types";
import { RESULT_COLORS, SOURCE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Range = "7" | "30" | "90" | "all";

const CHART_COLORS = {
  Independent: "#22c55e",
  Struggled: "#eab308",
  Hint: "#f97316",
  Solution: "#ef4444",
  primary: "#6366f1",
  muted: "#52525b",
};

const CustomTooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "#a1a1aa",
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30");

  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
  });

  const problems: Problem[] = data?.problems ?? [];
  const sessions = data?.sessions ?? [];

  const cutoff = range === "all" ? new Date(0) : subDays(new Date(), parseInt(range));

  const filteredAttempts = useMemo(() =>
    problems.flatMap((p) => p.attempts.map((a) => ({ ...a, problem: p })))
      .filter((a) => new Date(a.attemptedAt) >= cutoff)
      .sort((a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()),
    [problems, range, cutoff]
  );

  // Problems per day
  const perDayData = useMemo(() => {
    const end = new Date();
    const start = range === "all" ? (filteredAttempts[0] ? parseISO(filteredAttempts[0].attemptedAt) : subDays(end, 30)) : subDays(end, parseInt(range) - 1);
    const days = eachDayOfInterval({ start, end });
    return days.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const dayAttempts = filteredAttempts.filter((a) => format(parseISO(a.attemptedAt), "yyyy-MM-dd") === dateStr);
      const dayMinutes = sessions
        .filter((s: {date: string; duration: number}) => format(parseISO(s.date), "yyyy-MM-dd") === dateStr)
        .reduce((sum: number, s: {duration: number}) => sum + s.duration, 0);
      return {
        date: format(d, range === "7" ? "EEE" : "MMM d"),
        problems: dayAttempts.length,
        independent: dayAttempts.filter((a) => a.result === "Independent").length,
        focusHours: Math.round(dayMinutes / 6) / 10,
      };
    });
  }, [filteredAttempts, sessions, range]);

  // Weekly independent rate trend (Struggled now counts as independent)
  const weeklyRateData = useMemo(() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekAttempts = problems
        .flatMap((p) => p.attempts)
        .filter((a) => {
          const d = parseISO(a.attemptedAt);
          return d >= weekStart && d <= weekEnd;
        });
      if (weekAttempts.length === 0) continue;
      const rate = Math.round((weekAttempts.filter((a) => a.result === "Independent" || a.result === "Struggled").length / weekAttempts.length) * 100);
      weeks.push({ week: `W${format(weekStart, "w")}`, rate, count: weekAttempts.length });
    }
    return weeks;
  }, [problems]);

  // Result distribution
  const resultDist = useMemo(() => {
    const counts: Record<string, number> = { Independent: 0, Struggled: 0, Hint: 0, Solution: 0 };
    for (const a of filteredAttempts) counts[a.result] = (counts[a.result] || 0) + 1;
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    return Object.entries(counts).map(([name, value]) => ({
      name, value, pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [filteredAttempts]);

  // Source distribution
  const sourceDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of filteredAttempts) {
      const src = a.problem.source;
      counts[src] = (counts[src] || 0) + 1;
    }
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([src, count]) => ({ name: SOURCE_LABELS[src] || src, value: count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));
  }, [filteredAttempts]);

  // Difficulty distribution
  const diffDist = useMemo(() => {
    const counts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const a of filteredAttempts) {
      if (a.problem.difficulty) counts[a.problem.difficulty] = (counts[a.problem.difficulty] || 0) + 1;
    }
    return [
      { name: "Easy", value: counts.Easy, color: "#22c55e" },
      { name: "Medium", value: counts.Medium, color: "#eab308" },
      { name: "Hard", value: counts.Hard, color: "#ef4444" },
    ];
  }, [filteredAttempts]);

  // Topic mastery
  const topicMastery = useMemo(() => calculateTopicMastery(problems), [problems]);

  // Radar chart data — top 8 topics by mastery score
  const radarData = useMemo(() => {
    return topicMastery
      .slice(0, 8)
      .map((t) => ({
        topic: t.topic.length > 10 ? t.topic.slice(0, 10) + "…" : t.topic,
        fullTopic: t.topic,
        mastery: t.masteryScore,
        rate: t.independentRate,
      }));
  }, [topicMastery]);

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-800">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-zinc-800/30 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

        {/* Header + Range */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-100">Analytics</h1>
          <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {(["7", "30", "90", "all"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  range === r ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {r === "all" ? "All time" : `${r}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Problems per day */}
        <SectionCard title="Problems Per Day">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perDayData} barSize={range === "90" || range === "all" ? 3 : 16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} interval={range === "7" ? 0 : "preserveStartEnd"} />
              <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="problems" fill="#6366f1" radius={[2, 2, 0, 0]} name="Problems" />
              <Bar dataKey="independent" fill="#22c55e" radius={[2, 2, 0, 0]} name="Independent" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Focus Time */}
          <SectionCard title="Focus Hours">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={perDayData}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Area type="monotone" dataKey="focusHours" stroke="#6366f1" strokeWidth={2} fill="url(#focusGrad)" name="Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Independent Solve Rate Trend */}
          <SectionCard title="Independent Solve Rate (Weekly)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} width={30} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={CustomTooltipStyle} formatter={(v) => [`${v}%`, "Rate"]} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }} name="Independent %" />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Result Distribution */}
          <SectionCard title="Result Distribution">
            <div className="space-y-3">
              {resultDist.map((r) => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-num text-zinc-500">{r.value}</span>
                      <span className="text-xs font-mono-num font-medium text-zinc-200">{r.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.pct}%`, backgroundColor: RESULT_COLORS[r.name as keyof typeof RESULT_COLORS] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Source Distribution */}
          <SectionCard title="Source Distribution">
            <div className="space-y-3">
              {sourceDist.map((s, i) => {
                const colors = ["#6366f1", "#22c55e", "#eab308", "#f97316", "#3b82f6"];
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">{s.name}</span>
                      <span className="text-xs font-mono-num font-medium text-zinc-200">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, backgroundColor: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Difficulty Distribution */}
          <SectionCard title="Difficulty Distribution">
            <div className="space-y-3">
              {diffDist.map((d) => {
                const total = diffDist.reduce((s, v) => s + v.value, 0);
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-num text-zinc-500">{d.value}</span>
                        <span className="text-xs font-mono-num font-medium text-zinc-200">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

        </div>

        {/* Radar: Topic Mastery Visual */}
        {radarData.length >= 3 && (
          <SectionCard title="Topic Mastery Radar">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis
                    dataKey="topic"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#3f3f46", fontSize: 9 }} tickCount={4} />
                  <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Independence" dataKey="rate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                  <Tooltip
                    contentStyle={CustomTooltipStyle}
                    formatter={(v, name) => [`${v}%`, name]}
                    labelFormatter={(label) => radarData.find((d) => d.topic === label)?.fullTopic || label}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="lg:w-48 space-y-2 shrink-0">
                <p className="text-xs text-zinc-500 mb-3">Legend</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-indigo-500 rounded" />
                  <span className="text-xs text-zinc-400">Mastery Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 border-t-2 border-dashed border-green-500" />
                  <span className="text-xs text-zinc-400">Independence Rate</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  {radarData.filter((d) => d.mastery < 65).map((d) => (
                    <div key={d.fullTopic} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      <span className="text-[10px] text-orange-400 truncate">{d.fullTopic}</span>
                      <span className="text-[10px] text-zinc-600 ml-auto">{d.mastery}%</span>
                    </div>
                  ))}
                  {radarData.filter((d) => d.mastery < 65).length === 0 && (
                    <p className="text-[10px] text-green-400">All topics looking good! 🎯</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Topic Mastery */}
        <SectionCard title="Topic Mastery">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicMastery.map((t) => (
              <div key={t.topic} className={cn("p-3 rounded-lg border transition-colors", t.needsAttention ? "border-orange-500/20 bg-orange-500/5" : "border-zinc-800 bg-zinc-900/40")}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{t.topic}</p>
                    <p className="text-xs text-zinc-600">{t.attempted} problems</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-semibold font-mono-num", t.masteryScore >= 80 ? "text-green-400" : t.masteryScore >= 60 ? "text-yellow-400" : "text-orange-400")}>
                      {t.masteryScore}%
                    </p>
                    {t.needsAttention && <p className="text-[10px] text-orange-400">Needs attention</p>}
                  </div>
                </div>
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${t.masteryScore}%`,
                      backgroundColor: t.masteryScore >= 80 ? "#22c55e" : t.masteryScore >= 60 ? "#eab308" : "#f97316",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {topicMastery.length === 0 && (
            <p className="text-sm text-zinc-600 text-center py-6">Add problems with topics to see mastery scores.</p>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
