"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Search, Filter, Plus, ExternalLink, Trash2, ChevronUp, ChevronDown, CalendarClock, BookOpenCheck, X, Pencil } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ResultBadge, DifficultyBadge, PlatformBadge, SourceBadge, CompanyBadge } from "@/components/shared/ResultBadge";
import { AddProblemDialog } from "@/components/problems/AddProblemDialog";
import { EditProblemDialog } from "@/components/problems/EditProblemDialog";
import { NotesRenderer } from "@/components/shared/NotesEditor";
import type { Problem, Result } from "@/lib/types";
import { TOPICS, SOURCE_LABELS } from "@/lib/types";

const PLATFORMS = ["LeetCode", "Codeforces", "CSES", "Other"];
const SOURCES = ["NeetCode150", "StriverSDE", "CP31", "CSES", "Custom"];
const RESULTS: Result[] = ["Independent", "Struggled", "Hint", "Solution"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUICK_DAYS = [1, 3, 5, 7];

// ── Reschedule Modal ──────────────────────────────────────────────────────────
function RescheduleModal({
  problem,
  onClose,
  onSave,
}: {
  problem: Problem;
  onClose: () => void;
  onSave: (days: number) => void;
}) {
  const [customDays, setCustomDays] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const handleSave = () => {
    const days = selected !== null ? selected : parseInt(customDays);
    if (!days || days < 1) return;
    onSave(days);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#111113] border border-zinc-800 rounded-xl p-6 w-[360px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-orange-400" /> Schedule Reattempt
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-5 truncate">{problem.title}</p>

        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3">Reattempt in:</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => { setSelected(d); setCustomDays(""); }}
              className={cn(
                "py-2.5 rounded-lg text-sm font-semibold border transition-colors",
                selected === d
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              )}
            >
              {d}d
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">or custom</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input
            type="number"
            min={1}
            max={30}
            value={customDays}
            onChange={(e) => { setCustomDays(e.target.value); setSelected(null); }}
            placeholder="e.g. 10"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
          />
          <span className="text-xs text-zinc-500">days from now</span>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selected === null && !customDays}
            className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Learning Notes Modal ──────────────────────────────────────────────────────
function NotesModal({ problem, onClose }: { problem: Problem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#111113] border border-zinc-800 rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-indigo-400" /> Learning Notes
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          {problem.title}{" "}
          {problem.url && (
            <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 ml-1 inline-flex items-center gap-1">
              Open <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </p>

        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">
          Attempt History ({problem.attempts.length})
        </p>
        <div className="space-y-2">
          {problem.attempts.length === 0 && (
            <p className="text-xs text-zinc-600 italic">No attempts logged yet.</p>
          )}
          {problem.attempts.map((a, i) => (
            <div key={a.id} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-500">#{i + 1}</span>
                <ResultBadge result={a.result as any} />
                {a.timeSpent && (
                  <span className="text-[10px] text-zinc-600 font-mono-num">{a.timeSpent}m</span>
                )}
                <span className="text-[10px] text-zinc-600 ml-auto">
                  {format(parseISO(a.attemptedAt), "MMM d, yyyy")}
                </span>
              </div>
              {a.learningNote ? (
                <div className="mt-2 border-l-2 border-zinc-700 pl-3">
                  <NotesRenderer text={a.learningNote} />
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic mt-1">No notes for this attempt.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
  const [rescheduleFor, setRescheduleFor] = useState<Problem | null>(null);
  const [notesFor, setNotesFor] = useState<Problem | null>(null);
  const [editFor, setEditFor] = useState<Problem | null>(null);

  const { data: problems = [], isLoading } = useQuery<Problem[]>({
    queryKey: ["problems"],
    queryFn: () => fetch("/api/problems").then((r) => r.json()),
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ problemId, days }: { problemId: string; days: number }) =>
      fetch("/api/reattempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          dueDate: addDays(new Date(), days).toISOString(),
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problems"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setRescheduleFor(null);
    },
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
              const hasNotes = p.attempts.some((a) => a.learningNote);
              return (
                <div key={p.id} className="group grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-zinc-800/25 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Title — opens URL if available */}
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-200 hover:text-indigo-300 truncate transition-colors flex items-center gap-1">
                            {p.title}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>
                        ) : (
                          <button
                            onClick={() => setNotesFor(p)}
                            className="text-sm text-zinc-200 hover:text-indigo-300 truncate transition-colors text-left"
                          >
                            {p.title}
                          </button>
                        )}
                        {/* Notes icon — always shown beside title when URL exists */}
                        {p.url && (
                          <button
                            onClick={() => setNotesFor(p)}
                            title="View learning notes"
                            className={cn(
                              "shrink-0 p-0.5 rounded transition-all",
                              hasNotes
                                ? "text-indigo-400 opacity-70 hover:opacity-100"
                                : "text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-zinc-400"
                            )}
                          >
                            <BookOpenCheck className="w-3.5 h-3.5" />
                          </button>
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
                  {p.company && <CompanyBadge company={p.company} />}
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
                      {/* Edit button */}
                      <button
                        onClick={() => setEditFor(p)}
                        className="p-1 rounded text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Edit problem"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* Reschedule / reattempt button */}
                      <button
                        onClick={() => setRescheduleFor(p)}
                        className="p-1 rounded text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                        title="Schedule reattempt"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                      </button>
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

      {rescheduleFor && (
        <RescheduleModal
          problem={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          onSave={(days) => scheduleMutation.mutate({ problemId: rescheduleFor.id, days })}
        />
      )}

      {notesFor && (
        <NotesModal problem={notesFor} onClose={() => setNotesFor(null)} />
      )}

      {editFor && (
        <EditProblemDialog
          problem={editFor}
          open={!!editFor}
          onOpenChange={(open) => { if (!open) setEditFor(null); }}
        />
      )}
    </div>
  );
}
