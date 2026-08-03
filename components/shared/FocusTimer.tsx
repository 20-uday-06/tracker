"use client";

import { useTimer } from "@/components/providers/TimerProvider";
import { Play, Pause, Square } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatMinutes } from "@/lib/calculations";

export function FocusTimer() {
  const { isActive, timeElapsed, startTimer, pauseTimer, stopTimer } = useTimer();
  const qc = useQueryClient();

  const saveSession = useMutation({
    mutationFn: (durationMins: number) =>
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "Timer", duration: durationMins }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const handleStop = () => {
    if (timeElapsed > 60) {
      const mins = Math.round(timeElapsed / 60);
      saveSession.mutate(mins);
    }
    stopTimer();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-3 mb-2 p-3 bg-[#111113] border border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Focus Session</span>
        <span className="text-sm font-mono-num text-zinc-100 font-medium">{formatTime(timeElapsed)}</span>
      </div>
      <div className="flex gap-2">
        {!isActive ? (
          <button
            onClick={startTimer}
            className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-md text-xs font-medium transition-colors"
          >
            <Pause className="w-3.5 h-3.5 fill-current" /> Pause
          </button>
        )}
        <button
          onClick={handleStop}
          disabled={timeElapsed === 0}
          className="px-2.5 py-1.5 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
}
