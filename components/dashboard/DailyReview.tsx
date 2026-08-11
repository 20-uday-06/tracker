"use client";

import { useState, useMemo } from "react";
import { Shuffle, ChevronDown, ChevronUp, ExternalLink, Brain, CheckCircle2, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { NotesRenderer } from "@/components/shared/NotesEditor";
import { ResultBadge, DifficultyBadge, PlatformBadge } from "@/components/shared/ResultBadge";
import { calculateTopicMastery } from "@/lib/calculations";
import type { Problem } from "@/lib/types";

interface DailyReviewProps {
  problems: Problem[];
}

/** Seeded pseudo-random using date string so cards don't change on re-render but Shuffle overrides */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = ((s * 1664525) + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ReviewCard({ problem, index }: { problem: Problem; index: number }) {
  const [open, setOpen] = useState(false);
  const [reviewed, setReviewed] = useState<"got" | "fuzzy" | null>(null);
  const latestAttempt = problem.attempts[problem.attempts.length - 1];
  const hasNotes = problem.attempts.some((a) => a.learningNote);
  const allNotes = problem.attempts
    .filter((a) => a.learningNote)
    .map((a, i) => ({ note: a.learningNote!, result: a.result, date: a.attemptedAt }));

  const gradients = [
    "from-indigo-500/10 to-violet-500/5 border-indigo-500/20",
    "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
    "from-orange-500/10 to-amber-500/5 border-orange-500/20",
  ];

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br transition-all duration-300",
      gradients[index % 3],
      reviewed === "got" ? "opacity-60" : "",
    )}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono text-zinc-600">#{index + 1}</span>
              {latestAttempt && <ResultBadge result={latestAttempt.result as any} />}
              <DifficultyBadge difficulty={problem.difficulty} cfRating={problem.cfRating} />
              <PlatformBadge platform={problem.platform} />
            </div>
            {problem.url ? (
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-zinc-100 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
              >
                {problem.title}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ) : (
              <p className="text-sm font-semibold text-zinc-100">{problem.title}</p>
            )}
            {problem.topics.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {problem.topics.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/50">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Got it / Fuzzy buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setReviewed(reviewed === "got" ? null : "got")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                reviewed === "got"
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : "bg-zinc-900/60 border-zinc-700 text-zinc-500 hover:border-green-500/30 hover:text-green-400"
              )}
            >
              <CheckCircle2 className="w-3 h-3" /> Got it
            </button>
            <button
              onClick={() => setReviewed(reviewed === "fuzzy" ? null : "fuzzy")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                reviewed === "fuzzy"
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-zinc-900/60 border-zinc-700 text-zinc-500 hover:border-red-500/30 hover:text-red-400"
              )}
            >
              <XCircle className="w-3 h-3" /> Fuzzy
            </button>
          </div>
        </div>

        {/* Expand notes toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all",
            open
              ? "bg-zinc-800/80 border-zinc-700 text-zinc-300"
              : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
          )}
        >
          <span className="flex items-center gap-1.5">
            {hasNotes ? "📝 Show my notes" : "⚠️ No notes — add them for better retention"}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Notes drawer */}
      {open && (
        <div className="border-t border-zinc-800/60 px-4 pb-4 pt-3 space-y-3 animate-slide-up">
          {allNotes.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No notes written yet for this problem. Add notes when you next attempt it!</p>
          ) : (
            allNotes.map((n, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ResultBadge result={n.result as any} />
                  <span className="text-[10px] text-zinc-600">{format(parseISO(n.date), "MMM d, yyyy")}</span>
                </div>
                <div className="border-l-2 border-zinc-700 pl-3">
                  <NotesRenderer text={n.note} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DailyReview({ problems }: DailyReviewProps) {
  const todaySeed = parseInt(format(new Date(), "yyyyMMdd"));
  const [shuffleSeed, setShuffleSeed] = useState(todaySeed);

  const reviewProblems = useMemo(() => {
    if (problems.length === 0) return [];

    // Priority: Hint/Solution results + problems with notes + weak topics
    const topicMastery = calculateTopicMastery(problems);
    const weakTopics = new Set(topicMastery.filter((t) => t.needsAttention).map((t) => t.topic));

    const scored = problems.map((p) => {
      const latest = p.attempts[p.attempts.length - 1];
      let score = 0;
      if (latest?.result === "Solution") score += 4;
      else if (latest?.result === "Hint") score += 3;
      else if (latest?.result === "Struggled") score += 1;
      if (p.topics.some((t) => weakTopics.has(t))) score += 2;
      if (p.attempts.some((a) => a.learningNote)) score += 1;
      return { p, score };
    });

    // High-score pool first, then shuffle within that
    const sorted = scored.sort((a, b) => b.score - a.score);
    const topPool = sorted.slice(0, Math.max(10, Math.floor(sorted.length * 0.4)));
    const shuffled = seededShuffle(topPool, shuffleSeed);
    return shuffled.slice(0, 3).map((x) => x.p);
  }, [problems, shuffleSeed]);

  if (problems.length < 3) return null;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Daily Review</h2>
            <p className="text-[10px] text-zinc-500">Revisit past problems — can you still solve them?</p>
          </div>
        </div>
        <button
          onClick={() => setShuffleSeed(Date.now())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all group"
        >
          <Shuffle className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviewProblems.map((p, i) => (
          <ReviewCard key={`${p.id}-${shuffleSeed}`} problem={p} index={i} />
        ))}
      </div>
    </section>
  );
}
