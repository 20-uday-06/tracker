import {
  startOfDay,
  subDays,
  format,
  differenceInCalendarDays,
  parseISO,
  isToday,
  isYesterday,
} from "date-fns";
import type { Problem, Attempt, Result, TopicMastery, DayActivity } from "./types";

/**
 * Returns the "study day" key for a given date, respecting a custom day-start hour.
 * For night-owls (e.g. dayStartHour=5): 4 AM Tuesday → counted as Monday ("yesterday's session").
 * Default dayStartHour=0 means normal midnight boundary.
 */
export function getStudyDayKey(date: Date | string, dayStartHour: number = 0): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const adjusted = dayStartHour > 0 ? subDays(d, d.getHours() < dayStartHour ? 1 : 0) : d;
  return format(adjusted, "yyyy-MM-dd");
}

/** Returns the "study day" key for right now (i.e. what "today" is for the user). */
export function getTodayStudyKey(dayStartHour: number = 0): string {
  return getStudyDayKey(new Date(), dayStartHour);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getMotivationalSuffix(streak: number): string {
  if (streak === 0) return "Start your streak today.";
  if (streak < 5) return "Keep the momentum going.";
  if (streak < 10) return "You're building consistency.";
  if (streak < 21) return "Keep the streak alive.";
  if (streak < 30) return "You're on fire.";
  return "Exceptional consistency.";
}

export function calculateStreak(
  problems: Problem[],
  sessions: { date: string; duration: number }[],
  minProblems = 1,
  minMinutes = 30,
  dayStartHour = 0
): { current: number; longest: number; totalActiveDays: number } {
  const activeDaysSet = new Set<string>();

  // Count problems per study-day
  const problemsByDay = new Map<string, number>();
  for (const p of problems) {
    for (const a of p.attempts) {
      const dateKey = getStudyDayKey(a.attemptedAt, dayStartHour);
      problemsByDay.set(dateKey, (problemsByDay.get(dateKey) || 0) + 1);
    }
  }

  // Count session minutes per study-day
  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    const dateKey = getStudyDayKey(s.date, dayStartHour);
    minutesByDay.set(dateKey, (minutesByDay.get(dateKey) || 0) + s.duration);
  }

  // Determine active days
  const allDates = new Set([...problemsByDay.keys(), ...minutesByDay.keys()]);
  for (const dateKey of allDates) {
    const problems = problemsByDay.get(dateKey) || 0;
    const minutes = minutesByDay.get(dateKey) || 0;
    if (problems >= minProblems || minutes >= minMinutes) {
      activeDaysSet.add(dateKey);
    }
  }

  const totalActiveDays = activeDaysSet.size;

  // Calculate current streak — use the user's "today" study key
  const todayKey = getTodayStudyKey(dayStartHour);
  let current = 0;
  let checkDate = parseISO(todayKey);
  while (true) {
    const dateKey = format(checkDate, "yyyy-MM-dd");
    if (activeDaysSet.has(dateKey)) {
      current++;
      checkDate = subDays(checkDate, 1);
    } else if (current === 0) {
      // Check yesterday (today might not be done yet)
      checkDate = subDays(checkDate, 1);
      const yestKey = format(checkDate, "yyyy-MM-dd");
      if (activeDaysSet.has(yestKey)) {
        continue;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Calculate longest streak
  const sortedDates = Array.from(activeDaysSet).sort();
  let longest = 0;
  let runLength = 0;
  let prevDate: string | null = null;
  for (const dateKey of sortedDates) {
    if (prevDate === null) {
      runLength = 1;
    } else {
      const prev = parseISO(prevDate);
      const curr = parseISO(dateKey);
      const diff = differenceInCalendarDays(curr, prev);
      if (diff === 1) {
        runLength++;
      } else {
        runLength = 1;
      }
    }
    longest = Math.max(longest, runLength);
    prevDate = dateKey;
  }

  return { current, longest, totalActiveDays };
}

export function getTodayStats(
  problems: Problem[],
  sessions: { source: string; duration: number; date: string }[],
  dayStartHour = 0
) {
  const todayStr = getTodayStudyKey(dayStartHour);

  const todayAttempts = problems.flatMap((p) =>
    p.attempts.filter((a) => getStudyDayKey(a.attemptedAt, dayStartHour) === todayStr)
  );

  const todayMinutes = sessions
    .filter((s) => getStudyDayKey(s.date, dayStartHour) === todayStr)
    .reduce((sum, s) => sum + s.duration, 0);

  const totalAttempts = problems.flatMap((p) => p.attempts);
  const independentCount = totalAttempts.filter((a) => a.result === "Independent").length;
  const independentRate =
    totalAttempts.length > 0 ? Math.round((independentCount / totalAttempts.length) * 100) : 0;

  const todayBySource: Record<string, { problems: number; minutes: number }> = {};
  for (const attempt of todayAttempts) {
    const problem = problems.find((p) => p.id === attempt.problemId);
    if (!problem) continue;
    const src = problem.source;
    if (!todayBySource[src]) todayBySource[src] = { problems: 0, minutes: 0 };
    todayBySource[src].problems++;
    todayBySource[src].minutes += attempt.timeSpent || 0;
  }

  return {
    problemsToday: todayAttempts.length,
    focusMinutesToday: todayMinutes,
    totalProblems: problems.length,
    independentRate,
    todayBySource,
  };
}

export function getHeatmapData(
  problems: Problem[],
  sessions: { source: string; duration: number; date: string }[],
  dayStartHour = 0
): DayActivity[] {
  const activityMap = new Map<string, DayActivity>();

  for (const p of problems) {
    for (const a of p.attempts) {
      const dateKey = getStudyDayKey(a.attemptedAt, dayStartHour);
      if (!activityMap.has(dateKey)) {
        activityMap.set(dateKey, {
          date: dateKey,
          problems: 0,
          solvedIndependent: 0,
          focusMinutes: 0,
          sources: {},
          results: { Independent: 0, Struggled: 0, Hint: 0, Solution: 0 },
        });
      }
      const day = activityMap.get(dateKey)!;
      day.problems++;
      if (a.result === "Independent") day.solvedIndependent++;
      day.results[a.result as Result]++;
      day.sources[p.source] = (day.sources[p.source] || 0) + 1;
    }
  }

  for (const s of sessions) {
    const dateKey = getStudyDayKey(s.date, dayStartHour);
    if (!activityMap.has(dateKey)) {
      activityMap.set(dateKey, {
        date: dateKey,
        problems: 0,
        solvedIndependent: 0,
        focusMinutes: 0,
        sources: {},
        results: { Independent: 0, Struggled: 0, Hint: 0, Solution: 0 },
      });
    }
    activityMap.get(dateKey)!.focusMinutes += s.duration;
  }

  return Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateTopicMastery(problems: Problem[]): TopicMastery[] {
  const topicMap = new Map<
    string,
    { total: number; independent: number; hard: number; recentIndependent: number; recentTotal: number }
  >();

  const cutoff = subDays(new Date(), 14);

  for (const p of problems) {
    const latestAttempt = p.attempts[p.attempts.length - 1];
    if (!latestAttempt) continue;

    for (const topic of p.topics) {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { total: 0, independent: 0, hard: 0, recentIndependent: 0, recentTotal: 0 });
      }
      const t = topicMap.get(topic)!;
      t.total++;
      if (latestAttempt.result === "Independent" || latestAttempt.result === "Struggled") {
        t.independent++;
      }
      if (p.difficulty === "Hard" || (p.cfRating && p.cfRating >= 1400)) t.hard++;

      const isRecent = parseISO(latestAttempt.attemptedAt) > cutoff;
      if (isRecent) {
        t.recentTotal++;
        if (latestAttempt.result === "Independent") t.recentIndependent++;
      }
    }
  }

  const result: TopicMastery[] = [];
  for (const [topic, data] of topicMap.entries()) {
    if (data.total === 0) continue;
    const independentRate = Math.round((data.independent / data.total) * 100);
    const hardBonus = Math.min(data.hard * 5, 20);
    const recentPenalty = data.recentTotal > 0
      ? Math.max(0, (1 - data.recentIndependent / data.recentTotal) * 10)
      : 0;
    const masteryScore = Math.max(0, Math.min(100, independentRate + hardBonus - recentPenalty));
    result.push({
      topic,
      attempted: data.total,
      independentRate,
      masteryScore: Math.round(masteryScore),
      needsAttention: masteryScore < 65,
    });
  }

  return result.sort((a, b) => b.masteryScore - a.masteryScore);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getResultColor(result: Result): string {
  const colors: Record<Result, string> = {
    Independent: "text-green-500",
    Struggled: "text-yellow-500",
    Hint: "text-orange-500",
    Solution: "text-red-500",
  };
  return colors[result];
}

export function getResultBg(result: Result): string {
  const colors: Record<Result, string> = {
    Independent: "bg-green-500/10 text-green-400 border-green-500/20",
    Struggled: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Hint: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Solution: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return colors[result];
}

export function getResultDot(result: Result): string {
  const colors: Record<Result, string> = {
    Independent: "🟢",
    Struggled: "🟡",
    Hint: "🟠",
    Solution: "🔴",
  };
  return colors[result];
}

export function getHeatIntensity(problems: number, minutes: number): number {
  const score = problems * 20 + minutes;
  if (score === 0) return 0;
  if (score < 60) return 1;
  if (score < 150) return 2;
  if (score < 300) return 3;
  return 4;
}
