"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Check, Plus, Loader2, Link as LinkIcon, Clock, Tag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { Result, Platform, Source, Difficulty } from "@/lib/types";
import { TOPICS, SOURCE_LABELS } from "@/lib/types";
import { addDays, format } from "date-fns";

const PLATFORMS: Platform[] = ["LeetCode", "Codeforces", "CSES", "Other"];
const SOURCES: Source[] = ["NeetCode150", "StriverSDE", "CP31", "CSES", "Custom"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const CF_RATINGS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700];

const RESULT_OPTIONS: { value: Result; label: string; emoji: string; color: string }[] = [
  { value: "Independent", label: "Independent", emoji: "🟢", color: "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20" },
  { value: "Struggled", label: "Struggled", emoji: "🟡", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" },
  { value: "Hint", label: "Hint", emoji: "🟠", color: "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
  { value: "Solution", label: "Solution", emoji: "🔴", color: "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20" },
];

const REATTEMPT_PRESETS = [
  { label: "+1 day", days: 1 },
  { label: "+3 days", days: 3 },
  { label: "+7 days", days: 7 },
  { label: "+14 days", days: 14 },
];

interface AddProblemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LAST_SOURCE_KEY = "dsa_last_source";
const LAST_PLATFORM_KEY = "dsa_last_platform";

export function AddProblemDialog({ open, onOpenChange }: AddProblemDialogProps) {
  const qc = useQueryClient();
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("LeetCode");
  const [source, setSource] = useState<Source>("NeetCode150");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [cfRating, setCfRating] = useState<number | "">("");
  const [result, setResult] = useState<Result | null>(null);
  const [timeSpent, setTimeSpent] = useState("");
  const [url, setUrl] = useState("");
  const [learningNote, setLearningNote] = useState("");
  const [reattemptDays, setReattemptDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore last used source/platform
  useEffect(() => {
    if (open) {
      const lastSource = localStorage.getItem(LAST_SOURCE_KEY) as Source | null;
      const lastPlatform = localStorage.getItem(LAST_PLATFORM_KEY) as Platform | null;
      if (lastSource) setSource(lastSource);
      if (lastPlatform) setPlatform(lastPlatform);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset form when closed
  const resetForm = useCallback(() => {
    setTitle("");
    setSelectedTopics([]);
    setDifficulty("");
    setCfRating("");
    setResult(null);
    setTimeSpent("");
    setUrl("");
    setLearningNote("");
    setReattemptDays(null);
    setError("");
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  // Keyboard shortcut to close
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

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Problem title is required."); return; }
    if (!result) { setError("Please select a result."); return; }

    setLoading(true);
    setError("");

    const dueDate =
      reattemptDays !== null
        ? format(addDays(new Date(), reattemptDays), "yyyy-MM-dd")
        : null;

    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          platform,
          source,
          topics: selectedTopics,
          difficulty: difficulty || null,
          cfRating: cfRating || null,
          url,
          result,
          timeSpent,
          learningNote,
          addToReattempt: result === "Hint" || result === "Solution",
          reattemptDueDate: dueDate,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      // Remember last used
      localStorage.setItem(LAST_SOURCE_KEY, source);
      localStorage.setItem(LAST_PLATFORM_KEY, platform);

      // Invalidate queries
      qc.invalidateQueries({ queryKey: ["problems"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["reattempts"] });

      onOpenChange(false);
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-xl bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl animate-slide-up"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Add Problem</h2>
            <p className="text-xs text-zinc-500 mt-0.5">⌘ + Enter to save quickly</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
              Problem Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Minimum Window Substring"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
          </div>

          {/* Platform + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 appearance-none cursor-pointer"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Source / Sheet</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as Source)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 appearance-none cursor-pointer"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Result — most important, large buttons */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
              Result <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {RESULT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResult(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all duration-150",
                    result === opt.value
                      ? opt.color + " ring-1 ring-offset-0 scale-[0.98]"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/60"
                  )}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Topics</label>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs border transition-all duration-100",
                    selectedTopics.includes(topic)
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                      : "border-zinc-700/60 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Difficulty
              </label>
              {platform === "Codeforces" ? (
                <select
                  value={cfRating}
                  onChange={(e) => setCfRating(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 appearance-none"
                >
                  <option value="">CF Rating</option>
                  {CF_RATINGS.map((r) => (
                    <option key={r} value={r}>{r}{r === 1700 ? "+" : ""}</option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(difficulty === d ? "" : d)}
                      className={cn(
                        "flex-1 py-2 rounded-md text-xs font-medium border transition-all",
                        difficulty === d
                          ? d === "Easy"
                            ? "border-green-500/40 bg-green-500/10 text-green-400"
                            : d === "Medium"
                            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                            : "border-red-500/40 bg-red-500/10 text-red-400"
                          : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                <Clock className="w-3 h-3 inline mr-1" />Time Spent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="37"
                  min={1}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
                <span className="text-xs text-zinc-500 shrink-0">min</span>
              </div>
            </div>
          </div>

          {/* Reattempt scheduling — shown if result is Hint or Solution */}
          {(result === "Hint" || result === "Solution") && (
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3">
              <p className="text-xs text-zinc-400 mb-2">
                <span className="text-orange-400 font-medium">Reattempt scheduled</span> — when should you retry?
              </p>
              <div className="flex gap-2 flex-wrap">
                {REATTEMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setReattemptDays(reattemptDays === preset.days ? null : preset.days)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs border transition-all",
                      reattemptDays === preset.days
                        ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional fields (URL & Learning Note) */}
          <div className="space-y-3">
            {/* URL */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  <LinkIcon className="w-3 h-3 inline mr-1" />Problem URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              {/* Learning note */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Learning / Mistake
                </label>
                <textarea
                  value={learningNote}
                  onChange={(e) => setLearningNote(e.target.value)}
                  placeholder="What did you miss?"
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none"
                />
              </div>
            </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !result}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150",
              loading || !title.trim() || !result
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Problem
          </button>
        </div>
      </div>
    </div>
  );
}
