"use client";

import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { ResultBadge, DifficultyBadge, PlatformBadge, SourceBadge } from "@/components/shared/ResultBadge";
import { formatMinutes, getStudyDayKey } from "@/lib/calculations";
import type { DayActivity, Problem } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

interface DayDetailPanelProps {
  date: string;
  activity: DayActivity | null;
  problems: Problem[];
  onClose: () => void;
  dayStartHour?: number;
}

export function DayDetailPanel({ date, activity, problems, onClose, dayStartHour = 0 }: DayDetailPanelProps) {
  const dayProblems = problems.filter((p) =>
    p.attempts.some((a) => getStudyDayKey(a.attemptedAt, dayStartHour) === date)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[#0f0f11] border-l border-zinc-800 h-full overflow-y-auto animate-slide-in-right">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              {format(parseISO(date), "MMMM d, yyyy")}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activity ? `${activity.problems} problems · ${formatMinutes(activity.focusMinutes)} focused` : "No activity"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {activity && (
          <div className="px-5 py-4 border-b border-zinc-800">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(activity.results).filter(([, v]) => v > 0).map(([result, count]) => (
                <div key={result} className="flex items-center gap-2">
                  <ResultBadge result={result as any} />
                  <span className="text-sm font-mono-num text-zinc-400">{count}</span>
                </div>
              ))}
            </div>
            {Object.keys(activity.sources).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {Object.entries(activity.sources).map(([src, count]) => (
                  <div key={src} className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">{SOURCE_LABELS[src] || src}</span>
                    <span className="text-xs font-mono-num text-zinc-300">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="divide-y divide-zinc-800/50">
          {dayProblems.length === 0 ? (
            <p className="px-5 py-8 text-sm text-zinc-600 text-center">No problems on this day.</p>
          ) : (
            dayProblems.map((p) => {
              const dayAttempt = p.attempts.find((a) => getStudyDayKey(a.attemptedAt, dayStartHour) === date);
              return (
                <div key={p.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">{p.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <PlatformBadge platform={p.platform} />
                        <SourceBadge source={p.source} />
                        {p.topics.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-zinc-600">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {dayAttempt && <ResultBadge result={dayAttempt.result as any} />}
                      {dayAttempt?.timeSpent && (
                        <span className="text-xs font-mono-num text-zinc-600">{dayAttempt.timeSpent}m</span>
                      )}
                    </div>
                  </div>
                  {dayAttempt?.learningNote && (
                    <p className="mt-2 text-xs text-zinc-500 italic border-l border-zinc-700 pl-2">{dayAttempt.learningNote}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
