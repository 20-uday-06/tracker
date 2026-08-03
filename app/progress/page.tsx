"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Problem } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

// NeetCode 150 categories with total counts
const NEETCODE_CATEGORIES = [
  { name: "Arrays & Hashing", total: 9 },
  { name: "Two Pointers", total: 5 },
  { name: "Sliding Window", total: 6 },
  { name: "Stack", total: 7 },
  { name: "Binary Search", total: 7 },
  { name: "Linked List", total: 11 },
  { name: "Trees", total: 15 },
  { name: "Heap / Priority Queue", total: 7 },
  { name: "Backtracking", total: 9 },
  { name: "Tries", total: 3 },
  { name: "Graphs", total: 13 },
  { name: "Advanced Graphs", total: 6 },
  { name: "1-D Dynamic Programming", total: 12 },
  { name: "2-D Dynamic Programming", total: 11 },
  { name: "Greedy", total: 8 },
  { name: "Intervals", total: 6 },
  { name: "Math & Geometry", total: 8 },
  { name: "Bit Manipulation", total: 7 },
];

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

const CP31_RATINGS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700];

// Topic → NeetCode category mapping
const TOPIC_TO_NEETCODE: Record<string, string> = {
  "Arrays": "Arrays & Hashing",
  "Hashing": "Arrays & Hashing",
  "Two Pointers": "Two Pointers",
  "Sliding Window": "Sliding Window",
  "Stack": "Stack",
  "Binary Search": "Binary Search",
  "Linked List": "Linked List",
  "Trees": "Trees",
  "BST": "Trees",
  "Queue": "Trees",
  "Heap": "Heap / Priority Queue",
  "Backtracking": "Backtracking",
  "Trie": "Tries",
  "Graph": "Graphs",
  "BFS/DFS": "Graphs",
  "DP": "1-D Dynamic Programming",
  "Greedy": "Greedy",
  "Bit Manipulation": "Bit Manipulation",
  "Math": "Math & Geometry",
  "Prefix Sum": "Arrays & Hashing",
};

// Topic → Striver category mapping
const TOPIC_TO_STRIVER: Record<string, string> = {
  "Arrays": "Arrays",
  "Two Pointers": "Arrays",
  "Prefix Sum": "Arrays",
  "Strings": "String",
  "Binary Search": "Searching & Sorting",
  "Linked List": "Linked List",
  "Trees": "Binary Trees",
  "BST": "BST",
  "Greedy": "Greedy",
  "Backtracking": "Backtracking",
  "Stack": "Stacks & Queues",
  "Queue": "Stacks & Queues",
  "Heap": "Heap",
  "Graph": "Graph",
  "BFS/DFS": "Graph",
  "DP": "DP",
  "Trie": "Trie",
  "Bit Manipulation": "Bit Manipulation",
  "Hashing": "Arrays",
  "Math": "Searching & Sorting",
  "Sliding Window": "Arrays",
};

function ProgressBar({ value, max, color = "bg-indigo-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: () => fetch("/api/problems").then((r) => r.json()) as Promise<Problem[]>,
  });

  const problems: Problem[] = data ?? [];
  const ncProblems = problems.filter((p) => p.source === "NeetCode150");
  const striverProblems = problems.filter((p) => p.source === "StriverSDE");
  const cp31Problems = problems.filter((p) => p.source === "CP31");

  // NeetCode category counts
  const neetcodeCounts: Record<string, number> = {};
  for (const p of ncProblems) {
    for (const topic of p.topics) {
      const cat = TOPIC_TO_NEETCODE[topic];
      if (cat) neetcodeCounts[cat] = (neetcodeCounts[cat] || 0) + 1;
    }
  }

  // Striver category counts
  const striverCounts: Record<string, number> = {};
  for (const p of striverProblems) {
    for (const topic of p.topics) {
      const cat = TOPIC_TO_STRIVER[topic];
      if (cat) striverCounts[cat] = (striverCounts[cat] || 0) + 1;
    }
  }

  // CP-31 by rating
  const cp31ByRating: Record<number, Problem[]> = {};
  for (const p of cp31Problems) {
    if (p.cfRating) {
      const bucket = p.cfRating >= 1700 ? 1700 : Math.floor(p.cfRating / 100) * 100;
      if (!cp31ByRating[bucket]) cp31ByRating[bucket] = [];
      cp31ByRating[bucket].push(p);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-zinc-800/30 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-8">
        <h1 className="text-xl font-semibold text-zinc-100">Progress</h1>

        {/* NeetCode 150 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">NeetCode 150</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{ncProblems.length} / 150 problems logged</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold font-mono-num text-zinc-100">{Math.round((ncProblems.length / 150) * 100)}%</p>
            </div>
          </div>
          <div className="mb-5">
            <ProgressBar value={ncProblems.length} max={150} />
          </div>
          <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-zinc-800/50">
              {NEETCODE_CATEGORIES.map((cat) => {
                const done = Math.min(neetcodeCounts[cat.name] || 0, cat.total);
                const pct = Math.round((done / cat.total) * 100);
                return (
                  <div key={cat.name} className="px-5 py-3 grid grid-cols-[1fr_80px_60px] gap-4 items-center hover:bg-zinc-800/20 transition-colors">
                    <div>
                      <p className="text-sm text-zinc-300">{cat.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={done} max={cat.total} color={pct === 100 ? "bg-green-500" : "bg-indigo-500"} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono-num text-zinc-400">{done}<span className="text-zinc-700">/{cat.total}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Striver SDE */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Striver SDE Sheet</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{striverProblems.length} / 191 problems logged</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold font-mono-num text-zinc-100">{Math.round((striverProblems.length / 191) * 100)}%</p>
            </div>
          </div>
          <div className="mb-5">
            <ProgressBar value={striverProblems.length} max={191} color="bg-emerald-500" />
          </div>
          <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-zinc-800/50">
              {STRIVER_CATEGORIES.map((cat) => {
                const done = Math.min(striverCounts[cat.name] || 0, cat.total);
                const pct = Math.round((done / cat.total) * 100);
                return (
                  <div key={cat.name} className="px-5 py-3 grid grid-cols-[1fr_80px_60px] gap-4 items-center hover:bg-zinc-800/20 transition-colors">
                    <p className="text-sm text-zinc-300">{cat.name}</p>
                    <ProgressBar value={done} max={cat.total} color={pct === 100 ? "bg-green-500" : "bg-emerald-500"} />
                    <span className="text-xs font-mono-num text-zinc-400 text-right">{done}<span className="text-zinc-700">/{cat.total}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CP-31 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">CP-31 Journey</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{cp31Problems.length} Codeforces problems logged</p>
            </div>
          </div>
          <div className="space-y-3">
            {CP31_RATINGS.map((rating) => {
              const ratingProblems = cp31ByRating[rating] || [];
              const independent = ratingProblems.filter((p) => {
                const latest = p.attempts[p.attempts.length - 1];
                return latest?.result === "Independent";
              }).length;
              const struggled = ratingProblems.filter((p) => {
                const latest = p.attempts[p.attempts.length - 1];
                return latest?.result === "Struggled";
              }).length;
              const hint = ratingProblems.filter((p) => {
                const latest = p.attempts[p.attempts.length - 1];
                return latest?.result === "Hint";
              }).length;
              const solution = ratingProblems.filter((p) => {
                const latest = p.attempts[p.attempts.length - 1];
                return latest?.result === "Solution";
              }).length;
              const indRate = ratingProblems.length > 0 ? Math.round((independent / ratingProblems.length) * 100) : 0;
              const avgTime = ratingProblems.length > 0
                ? Math.round(ratingProblems.flatMap((p) => p.attempts.map((a) => a.timeSpent || 0)).reduce((s, v) => s + v, 0) / ratingProblems.length)
                : 0;

              return (
                <div key={rating} className={cn(
                  "bg-[#111113] border rounded-lg p-4",
                  ratingProblems.length === 0 ? "border-zinc-800/40 opacity-50" : "border-zinc-800 hover:border-zinc-700 transition-colors"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-semibold text-zinc-200">{rating}{rating === 1700 ? "+" : ""}</span>
                      {ratingProblems.length === 0 && <span className="text-xs text-zinc-600">Not started</span>}
                    </div>
                    {ratingProblems.length > 0 && (
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="font-mono-num">{ratingProblems.length} attempted</span>
                        <span className="text-green-400 font-mono-num">{indRate}% independent</span>
                        {avgTime > 0 && <span className="font-mono-num">avg {avgTime}m</span>}
                      </div>
                    )}
                  </div>
                  {ratingProblems.length > 0 && (
                    <>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex gap-0.5 mb-2">
                        {independent > 0 && <div className="bg-green-500 h-full" style={{ width: `${(independent / ratingProblems.length) * 100}%` }} />}
                        {struggled > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${(struggled / ratingProblems.length) * 100}%` }} />}
                        {hint > 0 && <div className="bg-orange-500 h-full" style={{ width: `${(hint / ratingProblems.length) * 100}%` }} />}
                        {solution > 0 && <div className="bg-red-500 h-full" style={{ width: `${(solution / ratingProblems.length) * 100}%` }} />}
                      </div>
                      <div className="flex items-center gap-4 text-[10px]">
                        {independent > 0 && <span className="text-green-400 font-mono-num">🟢 {independent}</span>}
                        {struggled > 0 && <span className="text-yellow-400 font-mono-num">🟡 {struggled}</span>}
                        {hint > 0 && <span className="text-orange-400 font-mono-num">🟠 {hint}</span>}
                        {solution > 0 && <span className="text-red-400 font-mono-num">🔴 {solution}</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
