"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { RefreshCw, AlertCircle, Clock, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResultBadge, PlatformBadge, SourceBadge } from "@/components/shared/ResultBadge";
import type { Problem, Result } from "@/lib/types";
import { formatMinutes } from "@/lib/calculations";
import { AddProblemDialog } from "@/components/problems/AddProblemDialog";
import { ReattemptDialog } from "@/components/reattempt/ReattemptDialog";

type ReattemptSection = "overdue" | "today" | "upcoming";

interface ProblemWithReattempt extends Problem {
  section: ReattemptSection;
}

export default function ReattemptPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [reattemptTarget, setReattemptTarget] = useState<Problem | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "Solution" | "Hint" | "Struggled">("all");

  const { data: problems = [], isLoading } = useQuery<Problem[]>({
    queryKey: ["problems"],
    queryFn: () => fetch("/api/problems").then((r) => r.json()),
  });

  const today = startOfDay(new Date());

  const withReattempt: ProblemWithReattempt[] = problems
    .filter((p) => !!p.reattempt)
    .map((p) => {
      const dueDate = p.reattempt?.dueDate ? startOfDay(parseISO(p.reattempt.dueDate)) : null;
      let section: ReattemptSection = "upcoming";
      if (!dueDate || isBefore(dueDate, today)) section = "overdue";
      else if (isToday(dueDate)) section = "today";
      return { ...p, section };
    })
    .filter((p) => {
      if (activeFilter === "all") return true;
      const latest = p.attempts[p.attempts.length - 1];
      return latest?.result === activeFilter;
    });

  const overdue = withReattempt.filter((p) => p.section === "overdue");
  const dueToday = withReattempt.filter((p) => p.section === "today");
  const upcoming = withReattempt.filter((p) => p.section === "upcoming");

  // Weakness vault — all problems needing attention (even without reattempt)
  const weaknessVault = problems.filter((p) => {
    const latest = p.attempts[p.attempts.length - 1];
    return latest?.result === "Solution" || latest?.result === "Hint";
  });

  const handleRemoveReattempt = async (problemId: string) => {
    await fetch("/api/reattempts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId }),
    });
    qc.invalidateQueries({ queryKey: ["problems"] });
  };

  const SectionHeader = ({ title, count, color }: { title: string; count: number; color?: string }) => (
    <div className="flex items-center gap-3 mb-3">
      <h2 className={cn("text-xs font-medium uppercase tracking-wider", color || "text-zinc-500")}>{title}</h2>
      <span className={cn("px-2 py-0.5 rounded text-xs font-mono-num font-medium", color ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400")}>
        {count}
      </span>
    </div>
  );

  const ReattemptCard = ({ p }: { p: ProblemWithReattempt }) => {
    const latestAttempt = p.attempts[p.attempts.length - 1];
    const daysAgo = latestAttempt
      ? Math.floor((Date.now() - new Date(latestAttempt.attemptedAt).getTime()) / 86400000)
      : null;

    return (
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{p.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <PlatformBadge platform={p.platform} />
              <span className="text-zinc-700">·</span>
              <SourceBadge source={p.source} />
              {p.topics.length > 0 && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-600">{p.topics.slice(0, 2).join(", ")}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setReattemptTarget(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reattempt
            </button>
            <button
              onClick={() => handleRemoveReattempt(p.id)}
              className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove from queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {latestAttempt && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wide">Previously</span>
              <ResultBadge result={latestAttempt.result as Result} />
            </div>
          )}
          {daysAgo !== null && (
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Clock className="w-3 h-3" />
              {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
            </div>
          )}
          {p.attempts.length > 1 && (
            <span className="text-xs text-zinc-600">{p.attempts.length} attempts</span>
          )}
        </div>

        {/* Attempt history mini-timeline */}
        {p.attempts.length > 1 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center gap-2">
            {p.attempts.map((a, i) => (
              <div key={a.id} className="flex items-center gap-1">
                <ResultBadge result={a.result as Result} size="sm" showEmoji={false} />
                {i < p.attempts.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-700" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Reattempt</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {withReattempt.length} in queue · {weaknessVault.length} in weakness vault
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Problem
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-fit">
          {(["all", "Solution", "Hint", "Struggled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeFilter === f
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-800/30 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <section>
            <SectionHeader title="Overdue" count={overdue.length} color="text-red-400" />
            <div className="space-y-3">
              {overdue.map((p) => <ReattemptCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {/* Due Today */}
        {dueToday.length > 0 && (
          <section>
            <SectionHeader title="Due Today" count={dueToday.length} color="text-orange-400" />
            <div className="space-y-3">
              {dueToday.map((p) => <ReattemptCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <SectionHeader title="Upcoming" count={upcoming.length} />
            <div className="space-y-3">
              {upcoming.map((p) => <ReattemptCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {withReattempt.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No reattempts in queue.</p>
            <p className="text-xs text-zinc-600 mt-1">Problems marked Hint or Solution are auto-queued when you add them.</p>
          </div>
        )}

        {/* Weakness Vault */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Weakness Vault</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono-num font-medium bg-zinc-800 text-zinc-400">{weaknessVault.length}</span>
            </div>
            <p className="text-xs text-zinc-600">All problems needing attention</p>
          </div>

          {weaknessVault.length === 0 ? (
            <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 text-center">
              <p className="text-sm text-zinc-500">Vault is empty — great work!</p>
            </div>
          ) : (
            <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
              <div className="divide-y divide-zinc-800/50">
                {weaknessVault.map((p) => {
                  const latest = p.attempts[p.attempts.length - 1];
                  return (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/25 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <PlatformBadge platform={p.platform} />
                          <span className="text-zinc-700">·</span>
                          <SourceBadge source={p.source} />
                          {p.topics.length > 0 && (
                            <>
                              <span className="text-zinc-700">·</span>
                              <span className="text-xs text-zinc-600">{p.topics.slice(0, 2).join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {latest && <ResultBadge result={latest.result as Result} />}
                        {!p.reattempt && (
                          <button
                            onClick={() => setReattemptTarget(p)}
                            className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-indigo-400 border border-zinc-700 hover:border-indigo-500/40 transition-colors"
                          >
                            + Queue
                          </button>
                        )}
                        {p.reattempt && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">QUEUED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <AddProblemDialog open={addOpen} onOpenChange={setAddOpen} />
      {reattemptTarget && (
        <ReattemptDialog
          problem={reattemptTarget}
          onClose={() => { setReattemptTarget(null); qc.invalidateQueries({ queryKey: ["problems"] }); }}
        />
      )}
    </div>
  );
}
