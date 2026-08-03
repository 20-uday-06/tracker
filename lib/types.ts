export type Result = "Independent" | "Struggled" | "Hint" | "Solution";
export type Platform = "LeetCode" | "Codeforces" | "CSES" | "Other";
export type Source = "NeetCode150" | "StriverSDE" | "CP31" | "CSES" | "Custom";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  id: string;
  title: string;
  platform: Platform;
  source: Source;
  topics: string[];
  difficulty?: Difficulty | null;
  cfRating?: number | null;
  url?: string | null;
  createdAt: string;
  attempts: Attempt[];
  reattempt?: Reattempt | null;
}

export interface Attempt {
  id: string;
  problemId: string;
  result: Result;
  timeSpent?: number | null;
  learningNote?: string | null;
  attemptedAt: string;
}

export interface Reattempt {
  id: string;
  problemId: string;
  dueDate?: string | null;
  createdAt: string;
  problem?: Problem;
}

export interface StudySession {
  id: string;
  source: string;
  duration: number;
  date: string;
}

export interface DailyTarget {
  id: string;
  source: string;
  count: number;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  isToday: boolean;
  createdAt: string;
}

export interface DayActivity {
  date: string;
  problems: number;
  solvedIndependent: number;
  focusMinutes: number;
  sources: Record<string, number>;
  results: Record<Result, number>;
}

export interface TopicMastery {
  topic: string;
  attempted: number;
  independentRate: number;
  masteryScore: number;
  needsAttention: boolean;
}

export const RESULT_COLORS: Record<Result, string> = {
  Independent: "#22c55e",
  Struggled: "#eab308",
  Hint: "#f97316",
  Solution: "#ef4444",
};

export const RESULT_LABELS: Record<Result, string> = {
  Independent: "Independent",
  Struggled: "Struggled",
  Hint: "Hint",
  Solution: "Solution",
};

export const SOURCE_LABELS: Record<string, string> = {
  NeetCode150: "NeetCode 150",
  StriverSDE: "Striver SDE",
  CP31: "CP-31",
  CSES: "CSES",
  Custom: "Custom",
  Reattempt: "Reattempt",
  Generic: "Generic",
};

export const TOPICS = [
  "Arrays",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Strings",
  "Linked List",
  "Stack",
  "Queue",
  "Heap",
  "Trees",
  "BST",
  "Graph",
  "BFS/DFS",
  "DP",
  "Greedy",
  "Backtracking",
  "Trie",
  "Bit Manipulation",
  "Math",
  "Prefix Sum",
  "Other",
] as const;

export const CF_RATINGS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700] as const;
