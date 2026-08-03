"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import type { Problem, Result } from "@/lib/types";
import { ResultBadge } from "@/components/shared/ResultBadge";
import { useQueryClient } from "@tanstack/react-query";

const RESULT_OPTIONS: { value: Result; emoji: string; color: string }[] = [
  { value: "Independent", emoji: "🟢", color: "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20" },
  { value: "Struggled", emoji: "🟡", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" },
  { value: "Hint", emoji: "🟠", color: "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
  { value: "Solution", emoji: "🔴", color: "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20" },
];

interface ReattemptDialogProps {
  problem: Problem;
  onClose: () => void;
}

export function ReattemptDialog({ problem, onClose }: ReattemptDialogProps) {
  const qc = useQueryClient();
  const [result, setResult] = useState<Result | null>(null);
  const [timeSpent, setTimeSpent] = useState("");
  const [learningNote, setLearningNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [reattemptAgain, setReattemptAgain] = useState<number | null>(null);

  const latestAttempt = problem.attempts[problem.attempts.length - 1];

  const handleSubmit = async () => {
    if (!result) return;
    setLoading(true);

    // Record new attempt
    await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: problem.id,
        result,
        timeSpent: timeSpent || null,
        learningNote: learningNote || null,
      }),
    });

    // Update or remove reattempt
    if (result === "Independent" && !reattemptAgain) {
      await fetch("/api/reattempts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id }),
      });
    } else if (reattemptAgain) {
      await fetch("/api/reattempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          dueDate: format(addDays(new Date(), reattemptAgain), "yyyy-MM-dd"),
        }),
      });
    }

    qc.invalidateQueries({ queryKey: ["problems"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl animate-slide-up">
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Reattempt Problem</h2>
              <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[300px]">{problem.title}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Previous attempts */}
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wide">Attempt History</p>
            <div className="flex items-center gap-2 flex-wrap">
              {problem.attempts.map((a, i) => (
                <div key={a.id} className="flex items-center gap-1">
                  <ResultBadge result={a.result as Result} size="sm" />
                  {a.timeSpent && <span className="text-xs text-zinc-600 font-mono-num">{a.timeSpent}m</span>}
                </div>
              ))}
            </div>
          </div>

          {/* New result */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">New Result *</label>
            <div className="grid grid-cols-4 gap-2">
              {RESULT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setResult(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all",
                    result === opt.value ? opt.color + " ring-1" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Time Spent</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="25"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60"
                />
                <span className="text-xs text-zinc-500">min</span>
              </div>
            </div>
            {result !== "Independent" && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Reattempt Again?</label>
                <select
                  value={reattemptAgain ?? ""}
                  onChange={(e) => setReattemptAgain(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 appearance-none"
                >
                  <option value="">Don&apos;t reschedule</option>
                  <option value="1">+1 day</option>
                  <option value="3">+3 days</option>
                  <option value="7">+7 days</option>
                  <option value="14">+14 days</option>
                </select>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Note (optional)</label>
            <textarea
              value={learningNote}
              onChange={(e) => setLearningNote(e.target.value)}
              placeholder="What clicked this time?"
              rows={2}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !result}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              loading || !result ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-500"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Attempt
          </button>
        </div>
      </div>
    </div>
  );
}
