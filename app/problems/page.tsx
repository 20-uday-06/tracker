"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Plus, ExternalLink, Trash2, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ResultBadge, DifficultyBadge, PlatformBadge, SourceBadge } from "@/components/shared/ResultBadge";
import { AddProblemDialog } from "@/components/problems/AddProblemDialog";
import type { Problem, Result } from "@/lib/types";
import { TOPICS, SOURCE_LABELS } from "@/lib/types";

const PLATFORMS = ["LeetCode", "Codeforces", "CSES", "Other"];
const SOURCES = ["NeetCode150", "StriverSDE", "CP31", "CSES", "Custom"];
const RESULTS: Result[] = ["Independent", "Struggled", "Hint", "Solution"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function ProblemsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterReattempt, setFilterReattempt] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "title" | "result">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: problems = [], isLoading } = useQuery<Problem[]>({
    queryKey: ["problems"],
    queryFn: () => fetch("/api/problems").then((r) => r.json()),
  });

  const filtered = useMemo(() => {
    let list = [...problems];
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    if (filterPlatform) list = list.filter((p) => p.platform === filterPlatform);
    if (filterSource) list = list.filter((p) => p.source === filterSource);
    if (filterTopic) list = list.filter((p) => p.topics.includes(filterTopic));
    if (filterDifficulty) list = list.filter((p) => p.difficulty === filterDifficulty);
    if (filterReattempt) list = list.filter((p) => !!p.reattempt);
    if (filterResult) {
      list = list.filter((p) => {
        const latest = p.attempts[p.attempts.length - 1];
        return latest?.result === filterResult;
      });
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "title") cmp = a.title.localeCompare(b.title);
      if (sortBy === "result") {
        const order: Result[] = ["Independent", "Struggled", "Hint", "Solution"];
        const aR = a.attempts[a.attempts.length - 1]?.result as Result;
        const bR = b.attempts[b.attempts.length - 1]?.result as Result;
        cmp = (order.indexOf(aR) || 0) - (order.indexOf(bR) || 0);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [problems, search, filterPlatform, filterSource, filterResult, filterTopic, filterDifficulty, filterReattempt, sortBy, sortDir]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem and all its attempts? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/problems/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["problems"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    setDeletingId(null);
  };

  const handleAddReattempt = async (problemId: string) => {
    await fetch("/api/reattempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, dueDate: new Date(Date.now() + 86400000 * 3).toISOString() }),
    });
    qc.invalidateQueries({ queryKey: ["problems"] });
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const activeFilterCount = [filterPlatform, filterSource, filterResult, filterTopic, filterDifficulty, filterReattempt ? "r" : ""].filter(Boolean).length;

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Problems</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} of {problems.length} problems</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Problem
          </button>
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
              showFilters || activeFilterCount > 0
                ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-mono">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterPlatform(""); setFilterSource(""); setFilterResult(""); setFilterTopic(""); setFilterDifficulty(""); setFilterReattempt(false); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter drawer */}
        {showFilters && (
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/60 appearance-none">
              <option value="">All Platforms</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/60 appearance-none">
              <option value="">All Sources</option>
              {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </select>
            <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/60 appearance-none">
              <option value="">All Results</option>
              {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/60 appearance-none">
              <option value="">All Topics</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/60 appearance-none">
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-colors">
              <input type="checkbox" checked={filterReattempt} onChange={(e) => setFilterReattempt(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 accent-indigo-500" />
              <span className="text-xs text-zinc-400">Reattempt only</span>
            </label>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-zinc-800 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            <button className="flex items-center gap-1 text-left hover:text-zinc-400 transition-colors" onClick={() => toggleSort("title")}>
              Problem <SortIcon col="title" />
            </button>
            <span>Platform</span>
            <span>Source</span>
            <span>Topics</span>
            <span>Difficulty</span>
            <button className="flex items-center gap-1 hover:text-zinc-400 transition-colors" onClick={() => toggleSort("result")}>
              Result <SortIcon col="result" />
            </button>
            <button className="flex items-center gap-1 hover:text-zinc-400 transition-colors" onClick={() => toggleSort("date")}>
              Date <SortIcon col="date" />
            </button>
          </div>

          {isLoading && (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="px-4 py-3.5 border-b border-zinc-800/50 flex gap-4 items-center">
                  <div className="flex-1 h-4 bg-zinc-800/50 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-zinc-800/50 rounded animate-pulse" />
                  <div className="w-20 h-4 bg-zinc-800/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">No problems match your filters.</p>
              {problems.length === 0 && (
                <button onClick={() => setAddOpen(true)} className="mt-4 px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">
                  Add your first problem
                </button>
              )}
            </div>
          )}

          <div className="divide-y divide-zinc-800/40">
            {filtered.map((p) => {
              const latestAttempt = p.attempts[p.attempts.length - 1];
              return (
                <div key={p.id} className="group grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-zinc-800/25 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-200 hover:text-indigo-300 truncate transition-colors flex items-center gap-1">
                            {p.title}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-zinc-200 truncate">{p.title}</span>
                        )}
                      </div>
                      {p.topics.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.topics.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] text-zinc-600">{t}</span>
                          ))}
                          {p.topics.length > 2 && <span className="text-[10px] text-zinc-700">+{p.topics.length - 2}</span>}
                        </div>
                      )}
                    </div>
                    {p.reattempt && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        RETRY
                      </span>
                    )}
                  </div>
                  <PlatformBadge platform={p.platform} />
                  <SourceBadge source={p.source} />
                  <span className="text-xs text-zinc-600 hidden lg:block">
                    {p.topics.slice(0, 2).join(", ")}
                  </span>
                  <DifficultyBadge difficulty={p.difficulty} cfRating={p.cfRating} />
                  <div className="flex items-center gap-2">
                    {latestAttempt && <ResultBadge result={latestAttempt.result as any} />}
                    {latestAttempt?.timeSpent && (
                      <span className="text-xs font-mono-num text-zinc-600">{latestAttempt.timeSpent}m</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 font-mono-num">
                      {format(parseISO(p.createdAt), "MMM d")}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!p.reattempt && latestAttempt && (latestAttempt.result === "Hint" || latestAttempt.result === "Solution") && (
                        <button
                          onClick={() => handleAddReattempt(p.id)}
                          className="p-1 rounded text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                          title="Add to reattempt"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AddProblemDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
