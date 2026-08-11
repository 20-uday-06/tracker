"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Problem } from "@/lib/types";
import { ChevronRight, TrendingUp, Zap, Plus } from "lucide-react";
import { AddProblemDialog } from "@/components/problems/AddProblemDialog";

// ── NeetCode 150 ─────────────────────────────────────────────────────────────
const NEETCODE_CATEGORIES = [
  { name: "Arrays & Hashing", total: 9 },
  { name: "Two Pointers", total: 5 },
  { name: "Sliding Window", total: 6 },
  { name: "Stack", total: 7 },
  { name: "Binary Search", total: 7 },
  { name: "Linked List", total: 11 },
  { name: "Trees & BST", total: 15 },
  { name: "Heap / Priority Queue", total: 7 },
  { name: "Backtracking", total: 9 },
  { name: "Tries", total: 3 },
  { name: "Graph & BFS/DFS", total: 13 },
  { name: "Advanced Graphs", total: 6 },
  { name: "1-D Dynamic Programming", total: 12 },
  { name: "2-D Dynamic Programming", total: 11 },
  { name: "Greedy", total: 8 },
  { name: "Intervals", total: 6 },
  { name: "Math & Geometry", total: 8 },
  { name: "Bit Manipulation", total: 7 },
];

const TOPIC_TO_NEETCODE: Record<string, string> = {
  "Arrays": "Arrays & Hashing", "Hashing": "Arrays & Hashing", "Prefix Sum": "Arrays & Hashing",
  "Two Pointers": "Two Pointers", "Sliding Window": "Sliding Window", "Stack": "Stack",
  "Binary Search": "Binary Search", "Linked List": "Linked List",
  "Trees": "Trees & BST", "BST": "Trees & BST", "Queue": "Trees & BST",
  "Heap": "Heap / Priority Queue", "Backtracking": "Backtracking", "Trie": "Tries",
  "Graph": "Graph & BFS/DFS", "BFS/DFS": "Graph & BFS/DFS",
  "DP": "1-D Dynamic Programming", "Greedy": "Greedy",
  "Bit Manipulation": "Bit Manipulation", "Math": "Math & Geometry",
};

// ── Striver SDE ───────────────────────────────────────────────────────────────
const STRIVER_CATEGORIES = [
  { name: "Arrays", total: 24 },
  { name: "Matrix", total: 4 },
  { name: "String", total: 15 },
  { name: "Searching & Sorting", total: 7 },
  { name: "Linked List", total: 23 },
  { name: "Binary Trees", total: 17 },
  { name: "BST", total: 12 },
  { name: "Greedy", total: 7 },
  { name: "Backtracking", total: 9 },
  { name: "Stacks & Queues", total: 14 },
  { name: "Heap", total: 5 },
  { name: "Graph", total: 22 },
  { name: "DP", total: 17 },
  { name: "Trie", total: 3 },
  { name: "Bit Manipulation", total: 4 },
];

const TOPIC_TO_STRIVER: Record<string, string> = {
  "Arrays": "Arrays", "Two Pointers": "Arrays", "Prefix Sum": "Arrays", "Hashing": "Arrays", "Sliding Window": "Arrays",
  "Strings": "String", "Binary Search": "Searching & Sorting", "Math": "Searching & Sorting",
  "Linked List": "Linked List", "Trees": "Binary Trees", "BST": "BST",
  "Greedy": "Greedy", "Backtracking": "Backtracking",
  "Stack": "Stacks & Queues", "Queue": "Stacks & Queues",
  "Heap": "Heap", "Graph": "Graph", "BFS/DFS": "Graph",
  "DP": "DP", "Trie": "Trie", "Bit Manipulation": "Bit Manipulation",
};

// ── CP-31 ─────────────────────────────────────────────────────────────────────
const CP31_RATINGS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700];

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(done: number, total: number) {
  return total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0;
}

function MiniBar({ value, max, color = "#6366f1" }: { value: number; max: number; color?: string }) {
  const p = pct(value, max);
  return (
    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${p}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ResultDots({ solved, independent }: { solved: number; independent: number }) {
  if (solved === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="h-1 rounded-full bg-indigo-500/40 overflow-hidden" style={{ width: 48 }}>
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct(independent, solved)}%` }} />
      </div>
      <span className="text-[10px] text-zinc-600 font-mono-num">{independent}/{solved}</span>
    </div>
  );
}

// ── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({
  name, done, independent, total, accent,
}: {
  name: string; done: number; independent: number; total: number; accent: string;
}) {
  const [open, setOpen] = useState(false);
  const p = pct(done, total);
  const isComplete = p === 100;

  return (
    <div
      className={cn(
        "border-b border-zinc-800/50 last:border-0 transition-colors",
        open ? "bg-zinc-900/30" : "hover:bg-zinc-800/10"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <ChevronRight className={cn("w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform duration-200", open && "rotate-90")} />
        <span className={cn("text-sm flex-1 text-left", isComplete ? "text-green-400" : "text-zinc-300")}>
          {name}
          {isComplete && <span className="ml-2 text-[10px] text-green-500">✓ Done</span>}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <ResultDots solved={done} independent={independent} />
          <div className="w-28 hidden sm:block">
            <MiniBar value={done} max={total} color={isComplete ? "#22c55e" : accent} />
          </div>
          <span className={cn("text-xs font-mono-num w-8 text-right", isComplete ? "text-green-400" : p >= 50 ? "text-zinc-300" : "text-zinc-500")}>
            {p}%
          </span>
        </div>
      </button>

      {open && (
        <div className="px-12 pb-3">
          <p className="text-xs text-zinc-500">
            {done} solved · {independent} independent · {total - done} remaining
          </p>
          {done === 0 && (
            <p className="text-[11px] text-zinc-700 mt-1 italic">No problems logged yet for this category.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sheet Panel ───────────────────────────────────────────────────────────────
function SheetPanel({
  categories, counts, indCounts, total, color, accent, label, sublabel,
}: {
  categories: { name: string; total: number }[];
  counts: Record<string, number>;
  indCounts: Record<string, number>;
  total: number;
  color: string;
  accent: string;
  label: string;
  sublabel: string;
}) {
  const done = Math.min(Object.values(counts).reduce((s, v) => s + v, 0), total);
  const p = pct(done, total);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{label}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-3xl font-bold font-mono-num", p === 100 ? "text-green-400" : p >= 50 ? "text-indigo-400" : "text-zinc-100")}>{p}%</p>
          <p className="text-xs text-zinc-600 mt-0.5">{done} of {total} solved</p>
        </div>
      </div>

      {/* Master progress bar */}
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${p}%`, backgroundColor: p === 100 ? "#22c55e" : accent }}
        />
      </div>

      {/* Category list */}
      <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
        {categories.map((cat) => {
          const catDone = Math.min(counts[cat.name] || 0, cat.total);
          const catInd = Math.min(indCounts[cat.name] || 0, catDone);
          return (
            <CategoryRow
              key={cat.name}
              name={cat.name}
              done={catDone}
              independent={catInd}
              total={cat.total}
              accent={accent}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── CP-31 Panel ───────────────────────────────────────────────────────────────
function CP31Panel({ problems }: { problems: Problem[] }) {
  const byRating: Record<number, Problem[]> = {};
  for (const p of problems) {
    if (p.cfRating) {
      const bucket = p.cfRating >= 1700 ? 1700 : Math.floor(p.cfRating / 100) * 100;
      if (!byRating[bucket]) byRating[bucket] = [];
      byRating[bucket].push(p);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">CP-31 Journey</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{problems.length} Codeforces problems logged</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Independent</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Struggled</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Hint</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Solution</span>
        </div>
      </div>

      <div className="space-y-2">
        {CP31_RATINGS.map((rating) => {
          const rp = byRating[rating] || [];
          const ind = rp.filter((p) => ["Independent", "Struggled"].includes(p.attempts[p.attempts.length - 1]?.result)).length;
          const hint = rp.filter((p) => p.attempts[p.attempts.length - 1]?.result === "Hint").length;
          const sol = rp.filter((p) => p.attempts[p.attempts.length - 1]?.result === "Solution").length;
          const struggled = rp.filter((p) => p.attempts[p.attempts.length - 1]?.result === "Struggled").length;
          const pure_ind = rp.filter((p) => p.attempts[p.attempts.length - 1]?.result === "Independent").length;
          const indRate = rp.length > 0 ? Math.round((ind / rp.length) * 100) : 0;

          return (
            <div
              key={rating}
              className={cn(
                "bg-[#111113] border rounded-lg px-5 py-3.5 transition-colors",
                rp.length === 0 ? "border-zinc-800/30 opacity-40" : "border-zinc-800 hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="w-16 shrink-0 text-sm font-mono font-semibold text-zinc-300">
                  {rating}{rating === 1700 ? "+" : ""}
                </span>

                {rp.length === 0 ? (
                  <span className="text-xs text-zinc-700 flex-1">Not started</span>
                ) : (
                  <>
                    {/* Segmented bar */}
                    <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden flex gap-px">
                      {pure_ind > 0 && <div className="bg-green-500 h-full" style={{ width: `${(pure_ind / rp.length) * 100}%` }} />}
                      {struggled > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${(struggled / rp.length) * 100}%` }} />}
                      {hint > 0 && <div className="bg-orange-500 h-full" style={{ width: `${(hint / rp.length) * 100}%` }} />}
                      {sol > 0 && <div className="bg-red-500 h-full" style={{ width: `${(sol / rp.length) * 100}%` }} />}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-500">
                      <span className="font-mono-num text-zinc-400">{rp.length} solved</span>
                      <span className={cn("font-mono-num", indRate >= 70 ? "text-green-400" : indRate >= 40 ? "text-yellow-400" : "text-orange-400")}>
                        {indRate}% ind.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = "neetcode" | "striver" | "cp31";

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("neetcode");
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: () => fetch("/api/problems").then((r) => r.json()) as Promise<Problem[]>,
  });

  const problems: Problem[] = data ?? [];
  const ncProblems = problems.filter((p) => p.source === "NeetCode150");
  const striverProblems = problems.filter((p) => p.source === "StriverSDE");
  const cp31Problems = problems.filter((p) => p.source === "CP31");

  // NeetCode counts
  const neetcodeCounts: Record<string, number> = {};
  const neetcodeIndCounts: Record<string, number> = {};
  for (const p of ncProblems) {
    const latest = p.attempts[p.attempts.length - 1];
    const isInd = latest?.result === "Independent" || latest?.result === "Struggled";
    for (const topic of p.topics) {
      const cat = TOPIC_TO_NEETCODE[topic];
      if (cat) {
        neetcodeCounts[cat] = (neetcodeCounts[cat] || 0) + 1;
        if (isInd) neetcodeIndCounts[cat] = (neetcodeIndCounts[cat] || 0) + 1;
      }
    }
  }

  // Striver counts
  const striverCounts: Record<string, number> = {};
  const striverIndCounts: Record<string, number> = {};
  for (const p of striverProblems) {
    const latest = p.attempts[p.attempts.length - 1];
    const isInd = latest?.result === "Independent" || latest?.result === "Struggled";
    for (const topic of p.topics) {
      const cat = TOPIC_TO_STRIVER[topic];
      if (cat) {
        striverCounts[cat] = (striverCounts[cat] || 0) + 1;
        if (isInd) striverIndCounts[cat] = (striverIndCounts[cat] || 0) + 1;
      }
    }
  }

  const tabs = [
    { id: "neetcode" as Tab, label: "NeetCode 150", count: ncProblems.length, total: 150, color: "text-indigo-400", pctVal: pct(ncProblems.length, 150) },
    { id: "striver" as Tab, label: "Striver SDE Sheet", count: striverProblems.length, total: 191, color: "text-emerald-400", pctVal: pct(striverProblems.length, 191) },
    { id: "cp31" as Tab, label: "CP-31 Journey", count: cp31Problems.length, total: null, color: "text-amber-400", pctVal: null },
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-zinc-800/30 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Structured Sheet Progress</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Track completion & independent solve rate across NeetCode 150, Striver SDE, and CP-31</p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Log Problem
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-[#1c1c1f] border border-zinc-700 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <span>{t.label}</span>
              {t.pctVal !== null ? (
                <span className={cn(
                  "text-[10px] font-mono-num px-1.5 py-0.5 rounded border",
                  tab === t.id ? `${t.color} border-current bg-current/10` : "text-zinc-600 border-zinc-700"
                )}>
                  {t.count}/{t.total} ({t.pctVal}%)
                </span>
              ) : (
                <span className={cn(
                  "text-[10px] font-mono-num px-1.5 py-0.5 rounded border",
                  tab === t.id ? `${t.color} border-current bg-current/10` : "text-zinc-600 border-zinc-700"
                )}>
                  {t.count} solved
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab === "neetcode" && (
            <SheetPanel
              categories={NEETCODE_CATEGORIES}
              counts={neetcodeCounts}
              indCounts={neetcodeIndCounts}
              total={150}
              color="text-indigo-400"
              accent="#6366f1"
              label="NeetCode 150 Progress"
              sublabel="Curated patterns for coding interviews"
            />
          )}
          {tab === "striver" && (
            <SheetPanel
              categories={STRIVER_CATEGORIES}
              counts={striverCounts}
              indCounts={striverIndCounts}
              total={191}
              color="text-emerald-400"
              accent="#10b981"
              label="Striver SDE Sheet Progress"
              sublabel="Industry standard problem sheet"
            />
          )}
          {tab === "cp31" && (
            <CP31Panel problems={cp31Problems} />
          )}
        </div>

      </div>
      <AddProblemDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
