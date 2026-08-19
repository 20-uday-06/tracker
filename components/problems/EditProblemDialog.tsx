"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, Link as LinkIcon, Tag, ChevronDown, Pencil, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { Platform, Source, Difficulty, Result } from "@/lib/types";
import { TOPICS, SOURCE_LABELS } from "@/lib/types";
import { NotesEditor } from "@/components/shared/NotesEditor";
import type { Problem } from "@/lib/types";

const PLATFORMS: Platform[] = ["LeetCode", "Codeforces", "CSES", "Other"];
const SOURCES: Source[] = ["NeetCode150", "StriverSDE", "CP31", "CSES", "Custom"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const CF_RATINGS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700];

const RESULT_OPTIONS: { value: Result; label: string; emoji: string; color: string }[] = [
  { value: "Independent", label: "Independent", emoji: "🟢", color: "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20" },
  { value: "Struggled",   label: "Struggled",   emoji: "🟡", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" },
  { value: "Hint",        label: "Hint",        emoji: "🟠", color: "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
  { value: "Solution",    label: "Solution",    emoji: "🔴", color: "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20" },
];

interface EditProblemDialogProps {
  problem: Problem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProblemDialog({ problem, open, onOpenChange }: EditProblemDialogProps) {
  const qc = useQueryClient();
  const titleRef = useRef<HTMLInputElement>(null);

  // Problem fields
  const [title, setTitle]               = useState("");
  const [platform, setPlatform]         = useState<Platform>("LeetCode");
  const [source, setSource]             = useState<Source>("NeetCode150");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty]     = useState<Difficulty | "">("");
  const [cfRating, setCfRating]         = useState<number | "">("");
  const [url, setUrl]                   = useState("");
  const [topicsOpen, setTopicsOpen]     = useState(false);

  // Latest attempt fields
  const [attemptResult, setAttemptResult]   = useState<Result | null>(null);
  const [attemptTime, setAttemptTime]       = useState("");
  const [attemptNote, setAttemptNote]       = useState("");
  const [hasAttempt, setHasAttempt]         = useState(false);
  const [attemptId, setAttemptId]           = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);

  // Pre-fill when dialog opens
  useEffect(() => {
    if (open && problem) {
      setTitle(problem.title);
      setPlatform(problem.platform as Platform);
      setSource(problem.source as Source);
      setSelectedTopics(problem.topics ?? []);
      setDifficulty((problem.difficulty as Difficulty) || "");
      setCfRating(problem.cfRating || "");
      setUrl(problem.url || "");
      setTopicsOpen(false);
      setError("");
      setSaved(false);

      const latest = problem.attempts[problem.attempts.length - 1] ?? null;
      if (latest) {
        setHasAttempt(true);
        setAttemptId(latest.id);
        setAttemptResult(latest.result as Result);
        setAttemptTime(latest.timeSpent ? String(latest.timeSpent) : "");
        setAttemptNote(latest.learningNote ?? "");
      } else {
        setHasAttempt(false);
        setAttemptId(null);
        setAttemptResult(null);
        setAttemptTime("");
        setAttemptNote("");
      }

      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, problem]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Problem title is required."); return; }
    setLoading(true);
    setError("");

    try {
      // 1. Update problem metadata
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          platform,
          source,
          topics: selectedTopics,
          difficulty: difficulty || null,
          cfRating: cfRating || null,
          url,
        }),
      });
      if (!res.ok) throw new Error("Failed to update problem");

      // 2. Update latest attempt if it exists
      if (hasAttempt && attemptId && attemptResult) {
        const aRes = await fetch("/api/attempts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: attemptId,
            result: attemptResult,
            timeSpent: attemptTime ? parseInt(attemptTime) : null,
            learningNote: attemptNote,
          }),
        });
        if (!aRes.ok) throw new Error("Failed to update attempt");
      }

      qc.invalidateQueries({ queryKey: ["problems"] });
      qc.invalidateQueries({ queryKey: ["stats"] });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onOpenChange(false);
      }, 800);
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-10 w-full max-w-xl bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl"
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-indigo-400" /> Edit Problem
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">⌘ + Enter to save</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[72vh] overflow-y-auto">

          {/* ── Problem Details ── */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Problem Details</p>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              />
            </div>

            {/* Platform + Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Platform</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PLATFORMS.map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn("px-2.5 py-1.5 rounded-md text-xs border transition-all",
                        platform === p ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400" : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                      )}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Source</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SOURCES.map((s) => (
                    <button key={s} type="button" onClick={() => setSource(s)}
                      className={cn("px-2.5 py-1.5 rounded-md text-xs border transition-all",
                        source === s ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400" : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                      )}>{SOURCE_LABELS[s] || s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                <Tag className="w-3 h-3 inline mr-1" />Topics
              </label>
              <button type="button" onClick={() => setTopicsOpen(!topicsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-left hover:border-zinc-600 transition-colors"
              >
                <span className={selectedTopics.length > 0 ? "text-zinc-200" : "text-zinc-600"}>
                  {selectedTopics.length > 0 ? selectedTopics.join(", ") : "Select topics..."}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", topicsOpen && "rotate-180")} />
              </button>
              {topicsOpen && (
                <div className="mt-1 bg-zinc-900 border border-zinc-700 rounded-md p-3 max-h-44 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {TOPICS.map((topic) => (
                      <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                        className={cn("px-2 py-1 rounded text-[11px] border transition-all",
                          selectedTopics.includes(topic) ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400" : "border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600"
                        )}>{topic}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty + URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Difficulty</label>
                {platform === "Codeforces" ? (
                  <select value={cfRating} onChange={(e) => setCfRating(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60">
                    <option value="">Rating...</option>
                    {CF_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <div className="flex gap-1.5">
                    {DIFFICULTIES.map((d) => (
                      <button key={d} type="button" onClick={() => setDifficulty(difficulty === d ? "" : d)}
                        className={cn("flex-1 py-2 rounded-md text-xs font-medium border transition-all",
                          difficulty === d
                            ? d === "Easy" ? "border-green-500/40 bg-green-500/10 text-green-400"
                              : d === "Medium" ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                              : "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                        )}>{d}</button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  <LinkIcon className="w-3 h-3 inline mr-1" />URL
                </label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors" />
              </div>
            </div>
          </div>

          {/* ── Latest Attempt ── */}
          {hasAttempt && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Latest Attempt</p>

              {/* Result */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Result</label>
                <div className="grid grid-cols-4 gap-2">
                  {RESULT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAttemptResult(opt.value)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-1",
                        attemptResult === opt.value ? opt.color : "border-zinc-700 bg-zinc-900 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
                      )}
                    >
                      <span className="text-base leading-none">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time spent + notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    <Clock className="w-3 h-3 inline mr-1" />Time Spent (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={attemptTime}
                    onChange={(e) => setAttemptTime(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Learning / Mistake Notes
                </label>
                <NotesEditor value={attemptNote} onChange={setAttemptNote} rows={3} />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              loading || !title.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : saved ? "bg-green-600 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
