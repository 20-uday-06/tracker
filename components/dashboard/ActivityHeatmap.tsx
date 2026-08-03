"use client";

import { useMemo, useState } from "react";
import { format, subDays, eachDayOfInterval, startOfWeek, getDay, parseISO, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { DayActivity } from "@/lib/types";
import { getHeatIntensity, formatMinutes } from "@/lib/calculations";
import { SOURCE_LABELS } from "@/lib/types";

interface ActivityHeatmapProps {
  activityData: DayActivity[];
  onDayClick?: (day: DayActivity | null, date: string) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HEAT_COLORS = [
  "bg-zinc-800/80",              // 0 — no activity
  "bg-indigo-500/20",            // 1 — light
  "bg-indigo-500/40",            // 2 — moderate
  "bg-indigo-500/65",            // 3 — active
  "bg-indigo-500",               // 4 — very active
];

export function ActivityHeatmap({ activityData, onDayClick }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: DayActivity | null; date: string } | null>(null);

  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    for (const d of activityData) {
      map.set(d.date, d);
    }
    return map;
  }, [activityData]);

  // Generate last 26 weeks of days
  const today = new Date();
  const weeks = useMemo(() => {
    const end = today;
    const start = subDays(end, 26 * 7 - 1);
    const allDays = eachDayOfInterval({ start, end });

    // Pad beginning to start on Sunday
    const paddedStart: (string | null)[] = [];
    const firstDayOfWeek = getDay(allDays[0]);
    for (let i = 0; i < firstDayOfWeek; i++) paddedStart.push(null);

    const allWithPadding = [...paddedStart, ...allDays.map((d) => format(d, "yyyy-MM-dd"))];

    const weekChunks: (string | null)[][] = [];
    for (let i = 0; i < allWithPadding.length; i += 7) {
      weekChunks.push(allWithPadding.slice(i, i + 7));
    }
    return weekChunks;
  }, []);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, colIdx) => {
      const firstDay = week.find(Boolean);
      if (!firstDay) return;
      const month = parseISO(firstDay).getMonth();
      if (month !== lastMonth) {
        labels.push({ month: MONTHS[month], col: colIdx });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map(({ month, col }) => (
          <div
            key={`${month}-${col}`}
            className="text-[10px] text-zinc-600 absolute"
            style={{ left: `${col * 14 + 32}px` }}
          >
            {month}
          </div>
        ))}
      </div>

      <div className="flex mt-5">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-2">
          {[1, 3, 5].map((dayIdx) => (
            <div
              key={dayIdx}
              className="text-[10px] text-zinc-600 h-[12px] flex items-center"
              style={{ marginTop: dayIdx === 1 ? 0 : dayIdx === 3 ? "12px" : "12px" }}
            >
              {DAYS[dayIdx]}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {week.map((dateStr, dayIdx) => {
                if (!dateStr) {
                  return <div key={dayIdx} className="w-[12px] h-[12px]" />;
                }

                const activity = activityMap.get(dateStr) || null;
                const intensity = activity ? getHeatIntensity(activity.problems, activity.focusMinutes) : 0;
                const isCurrentDay = isToday(parseISO(dateStr));

                return (
                  <button
                    key={dayIdx}
                    className={cn(
                      "w-[12px] h-[12px] rounded-[2px] transition-all duration-100 hover:scale-125 hover:z-10 relative",
                      HEAT_COLORS[intensity],
                      isCurrentDay && "ring-1 ring-indigo-400/60"
                    )}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, data: activity, date: dateStr });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => onDayClick?.(activity, dateStr)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-zinc-600">Less</span>
        {HEAT_COLORS.map((color, i) => (
          <div key={i} className={cn("w-[10px] h-[10px] rounded-[2px]", color)} />
        ))}
        <span className="text-[10px] text-zinc-600">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-[#1a1a1d] border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-left mb-1 min-w-[160px]">
            <p className="text-xs font-medium text-zinc-200 mb-1.5">
              {format(parseISO(tooltip.date), "MMMM d, yyyy")}
            </p>
            {tooltip.data ? (
              <>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                  <span className="font-mono-num text-zinc-200 font-medium">{tooltip.data.problems}</span>
                  <span>problems</span>
                </div>
                {tooltip.data.focusMinutes > 0 && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
                    <span className="font-mono-num text-zinc-200 font-medium">{formatMinutes(tooltip.data.focusMinutes)}</span>
                    <span>focused</span>
                  </div>
                )}
                {Object.entries(tooltip.data.sources).map(([src, count]) => (
                  <div key={src} className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{SOURCE_LABELS[src] || src}</span>
                    <span className="font-mono-num text-zinc-400">{count}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-zinc-600">No activity</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
