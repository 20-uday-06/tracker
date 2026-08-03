import { PrismaClient } from "@prisma/client";
import { subDays, addDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const today = startOfDay(new Date());

const problems = [
  // NeetCode 150 problems
  { title: "Two Sum", platform: "LeetCode", source: "NeetCode150", topics: ["Arrays", "Hashing"], difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/", daysAgo: 34, result: "Independent", timeSpent: 12 },
  { title: "Valid Anagram", platform: "LeetCode", source: "NeetCode150", topics: ["Hashing", "Strings"], difficulty: "Easy", url: "https://leetcode.com/problems/valid-anagram/", daysAgo: 34, result: "Independent", timeSpent: 10 },
  { title: "Contains Duplicate", platform: "LeetCode", source: "NeetCode150", topics: ["Arrays", "Hashing"], difficulty: "Easy", url: "https://leetcode.com/problems/contains-duplicate/", daysAgo: 33, result: "Independent", timeSpent: 8 },
  { title: "Group Anagrams", platform: "LeetCode", source: "NeetCode150", topics: ["Hashing", "Strings"], difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/", daysAgo: 33, result: "Struggled", timeSpent: 28, learningNote: "Sorted string as key approach - O(n * k log k). Could also use character frequency tuple." },
  { title: "Top K Frequent Elements", platform: "LeetCode", source: "NeetCode150", topics: ["Hashing", "Heap"], difficulty: "Medium", url: "https://leetcode.com/problems/top-k-frequent-elements/", daysAgo: 32, result: "Independent", timeSpent: 22 },
  { title: "Valid Parentheses", platform: "LeetCode", source: "NeetCode150", topics: ["Stack"], difficulty: "Easy", url: "https://leetcode.com/problems/valid-parentheses/", daysAgo: 32, result: "Independent", timeSpent: 14 },
  { title: "Min Stack", platform: "LeetCode", source: "NeetCode150", topics: ["Stack"], difficulty: "Medium", url: "https://leetcode.com/problems/min-stack/", daysAgo: 31, result: "Independent", timeSpent: 20 },
  { title: "Best Time to Buy and Sell Stock", platform: "LeetCode", source: "NeetCode150", topics: ["Arrays", "Sliding Window"], difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", daysAgo: 31, result: "Independent", timeSpent: 15 },
  { title: "Longest Substring Without Repeating Characters", platform: "LeetCode", source: "NeetCode150", topics: ["Sliding Window", "Hashing"], difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", daysAgo: 30, result: "Struggled", timeSpent: 35, learningNote: "Sliding window with hashmap storing last seen index. Edge case: when char is already in window but BEFORE left pointer." },
  { title: "Longest Repeating Character Replacement", platform: "LeetCode", source: "NeetCode150", topics: ["Sliding Window"], difficulty: "Medium", url: "https://leetcode.com/problems/longest-repeating-character-replacement/", daysAgo: 30, result: "Hint", timeSpent: 42, learningNote: "Key insight: window_size - max_freq <= k. Don't need to decrement maxFreq when shrinking window." },
  { title: "Minimum Window Substring", platform: "LeetCode", source: "NeetCode150", topics: ["Sliding Window", "Hashing"], difficulty: "Hard", url: "https://leetcode.com/problems/minimum-window-substring/", daysAgo: 29, result: "Solution", timeSpent: 46, learningNote: "Two pointers with character count maps. Track 'have' vs 'need'. Classic hard sliding window.", reattemptDaysFromNow: 0 },
  { title: "Binary Search", platform: "LeetCode", source: "NeetCode150", topics: ["Binary Search"], difficulty: "Easy", url: "https://leetcode.com/problems/binary-search/", daysAgo: 28, result: "Independent", timeSpent: 10 },
  { title: "Koko Eating Bananas", platform: "LeetCode", source: "NeetCode150", topics: ["Binary Search"], difficulty: "Medium", url: "https://leetcode.com/problems/koko-eating-bananas/", daysAgo: 28, result: "Struggled", timeSpent: 33, learningNote: "Binary search on the answer space (k from 1 to max pile). CEILDIV = (pile + k - 1) // k" },
  { title: "Search in Rotated Sorted Array", platform: "LeetCode", source: "NeetCode150", topics: ["Binary Search"], difficulty: "Medium", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/", daysAgo: 27, result: "Independent", timeSpent: 25 },
  { title: "Find Minimum in Rotated Sorted Array", platform: "LeetCode", source: "NeetCode150", topics: ["Binary Search"], difficulty: "Medium", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", daysAgo: 27, result: "Independent", timeSpent: 20 },
  { title: "Reverse Linked List", platform: "LeetCode", source: "NeetCode150", topics: ["Linked List"], difficulty: "Easy", url: "https://leetcode.com/problems/reverse-linked-list/", daysAgo: 26, result: "Independent", timeSpent: 12 },
  { title: "Merge Two Sorted Lists", platform: "LeetCode", source: "NeetCode150", topics: ["Linked List"], difficulty: "Easy", url: "https://leetcode.com/problems/merge-two-sorted-lists/", daysAgo: 26, result: "Independent", timeSpent: 15 },
  { title: "Reorder List", platform: "LeetCode", source: "NeetCode150", topics: ["Linked List"], difficulty: "Medium", url: "https://leetcode.com/problems/reorder-list/", daysAgo: 25, result: "Hint", timeSpent: 38, learningNote: "Find middle, reverse second half, then merge. Three-step approach.", reattemptDaysFromNow: 3 },
  { title: "Invert Binary Tree", platform: "LeetCode", source: "NeetCode150", topics: ["Trees"], difficulty: "Easy", url: "https://leetcode.com/problems/invert-binary-tree/", daysAgo: 24, result: "Independent", timeSpent: 10 },
  { title: "Maximum Depth of Binary Tree", platform: "LeetCode", source: "NeetCode150", topics: ["Trees"], difficulty: "Easy", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", daysAgo: 24, result: "Independent", timeSpent: 8 },
  { title: "Balanced Binary Tree", platform: "LeetCode", source: "NeetCode150", topics: ["Trees"], difficulty: "Easy", url: "https://leetcode.com/problems/balanced-binary-tree/", daysAgo: 23, result: "Struggled", timeSpent: 28 },
  { title: "Lowest Common Ancestor of BST", platform: "LeetCode", source: "NeetCode150", topics: ["Trees", "BST"], difficulty: "Medium", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", daysAgo: 23, result: "Independent", timeSpent: 20 },
  { title: "Binary Tree Level Order Traversal", platform: "LeetCode", source: "NeetCode150", topics: ["Trees", "Queue"], difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", daysAgo: 22, result: "Independent", timeSpent: 22 },
  { title: "Largest Rectangle in Histogram", platform: "LeetCode", source: "NeetCode150", topics: ["Stack"], difficulty: "Hard", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/", daysAgo: 21, result: "Solution", timeSpent: 55, learningNote: "Monotonic stack — keep track of (start_index, height). Pop when current bar is shorter.", reattemptDaysFromNow: -2 },
  { title: "Number of Islands", platform: "LeetCode", source: "NeetCode150", topics: ["Graph", "BFS/DFS"], difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/", daysAgo: 20, result: "Independent", timeSpent: 25 },
  { title: "Clone Graph", platform: "LeetCode", source: "NeetCode150", topics: ["Graph", "BFS/DFS"], difficulty: "Medium", url: "https://leetcode.com/problems/clone-graph/", daysAgo: 20, result: "Struggled", timeSpent: 32 },
  { title: "House Robber", platform: "LeetCode", source: "NeetCode150", topics: ["DP"], difficulty: "Medium", url: "https://leetcode.com/problems/house-robber/", daysAgo: 19, result: "Independent", timeSpent: 18 },
  { title: "House Robber II", platform: "LeetCode", source: "NeetCode150", topics: ["DP"], difficulty: "Medium", url: "https://leetcode.com/problems/house-robber-ii/", daysAgo: 19, result: "Independent", timeSpent: 22 },
  // Striver SDE
  { title: "Merge Intervals", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays", "Greedy"], difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/", daysAgo: 18, result: "Independent", timeSpent: 24 },
  { title: "Sort Colors", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays", "Two Pointers"], difficulty: "Medium", url: "https://leetcode.com/problems/sort-colors/", daysAgo: 18, result: "Independent", timeSpent: 18 },
  { title: "Pascal's Triangle", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays", "Math"], difficulty: "Easy", url: "https://leetcode.com/problems/pascals-triangle/", daysAgo: 17, result: "Independent", timeSpent: 12 },
  { title: "Next Permutation", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays", "Two Pointers"], difficulty: "Medium", url: "https://leetcode.com/problems/next-permutation/", daysAgo: 17, result: "Solution", timeSpent: 40, learningNote: "Find rightmost pair i,i+1 where arr[i]<arr[i+1]. Swap arr[i] with smallest element > arr[i] to its right. Reverse from i+1.", reattemptDaysFromNow: -1 },
  { title: "Maximum Subarray", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays", "DP"], difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/", daysAgo: 16, result: "Independent", timeSpent: 15 },
  { title: "Set Matrix Zeroes", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays"], difficulty: "Medium", url: "https://leetcode.com/problems/set-matrix-zeroes/", daysAgo: 15, result: "Struggled", timeSpent: 30 },
  // CP-31
  { title: "Watermelon", platform: "Codeforces", source: "CP31", topics: ["Math"], cfRating: 800, url: "https://codeforces.com/problemset/problem/4/A", daysAgo: 35, result: "Independent", timeSpent: 5 },
  { title: "Way Too Long Words", platform: "Codeforces", source: "CP31", topics: ["Strings"], cfRating: 800, url: "https://codeforces.com/problemset/problem/71/A", daysAgo: 35, result: "Independent", timeSpent: 7 },
  { title: "Team", platform: "Codeforces", source: "CP31", topics: ["Math"], cfRating: 800, url: "https://codeforces.com/problemset/problem/231/A", daysAgo: 35, result: "Independent", timeSpent: 6 },
  { title: "Bit++", platform: "Codeforces", source: "CP31", topics: ["Strings"], cfRating: 800, url: "https://codeforces.com/problemset/problem/282/A", daysAgo: 34, result: "Independent", timeSpent: 5 },
  { title: "Helpful Maths", platform: "Codeforces", source: "CP31", topics: ["Strings", "Greedy"], cfRating: 900, url: "https://codeforces.com/problemset/problem/339/A", daysAgo: 33, result: "Independent", timeSpent: 12 },
  { title: "Nearly Lucky Number", platform: "Codeforces", source: "CP31", topics: ["Strings", "Math"], cfRating: 900, url: "https://codeforces.com/problemset/problem/42/A", daysAgo: 32, result: "Independent", timeSpent: 10 },
  { title: "Funny Subtraction", platform: "Codeforces", source: "CP31", topics: ["Math"], cfRating: 1000, url: "https://codeforces.com/problemset/problem/733/A", daysAgo: 31, result: "Independent", timeSpent: 15 },
  { title: "Domino Piling", platform: "Codeforces", source: "CP31", topics: ["Math", "Greedy"], cfRating: 1000, url: "https://codeforces.com/problemset/problem/50/A", daysAgo: 30, result: "Struggled", timeSpent: 25 },
  { title: "Bear and Prime 100", platform: "Codeforces", source: "CP31", topics: ["Math"], cfRating: 1000, url: "https://codeforces.com/problemset/problem/679/A", daysAgo: 29, result: "Independent", timeSpent: 18 },
  { title: "Vladik and Courtesy", platform: "Codeforces", source: "CP31", topics: ["Math", "Greedy"], cfRating: 1100, url: "https://codeforces.com/problemset/problem/811/A", daysAgo: 28, result: "Independent", timeSpent: 20 },
  { title: "Minimum Binary Number", platform: "Codeforces", source: "CP31", topics: ["Strings", "Greedy"], cfRating: 1100, url: "https://codeforces.com/problemset/problem/768/B", daysAgo: 27, result: "Independent", timeSpent: 22 },
  { title: "Sum of Digits", platform: "Codeforces", source: "CP31", topics: ["Math", "Strings"], cfRating: 1100, url: "https://codeforces.com/problemset/problem/228/A", daysAgo: 26, result: "Struggled", timeSpent: 30 },
  { title: "Polycarp and Coins", platform: "Codeforces", source: "CP31", topics: ["Math", "Greedy"], cfRating: 1200, url: "https://codeforces.com/problemset/problem/1551/B", daysAgo: 25, result: "Independent", timeSpent: 28 },
  { title: "Nezzar and Lucky Number", platform: "Codeforces", source: "CP31", topics: ["Math"], cfRating: 1200, url: "https://codeforces.com/problemset/problem/1478/B", daysAgo: 24, result: "Struggled", timeSpent: 35, learningNote: "Check if d appears in decimal representation after repeated subtractions of d." },
  { title: "Forked!", platform: "Codeforces", source: "CP31", topics: ["Math", "Hashing"], cfRating: 1300, url: "https://codeforces.com/problemset/problem/1473/C", daysAgo: 23, result: "Hint", timeSpent: 45, learningNote: "For each king position, the knight attacks form a set. Precompute all attacked squares and check intersection.", reattemptDaysFromNow: 1 },
  { title: "Strange Beauty", platform: "Codeforces", source: "CP31", topics: ["DP", "Math"], cfRating: 1400, url: "https://codeforces.com/problemset/problem/1264/C", daysAgo: 20, result: "Solution", timeSpent: 52, learningNote: "LIS variant. dp[i] = max length ending with i. For each j that divides i, dp[i] = max(dp[i], dp[j]+1).", reattemptDaysFromNow: 0 },
  // CSES
  { title: "Weird Algorithm", platform: "CSES", source: "CSES", topics: ["Math"], url: "https://cses.fi/problemset/task/1068", daysAgo: 15, result: "Independent", timeSpent: 8 },
  { title: "Missing Number", platform: "CSES", source: "CSES", topics: ["Math", "Arrays"], url: "https://cses.fi/problemset/task/1083", daysAgo: 14, result: "Independent", timeSpent: 10 },
  { title: "Permutations", platform: "CSES", source: "CSES", topics: ["Arrays", "Greedy"], url: "https://cses.fi/problemset/task/1070", daysAgo: 13, result: "Independent", timeSpent: 15 },
  // Recent problems (last 5 days)
  { title: "Coin Change", platform: "LeetCode", source: "NeetCode150", topics: ["DP"], difficulty: "Medium", url: "https://leetcode.com/problems/coin-change/", daysAgo: 5, result: "Independent", timeSpent: 28 },
  { title: "Longest Common Subsequence", platform: "LeetCode", source: "NeetCode150", topics: ["DP"], difficulty: "Medium", url: "https://leetcode.com/problems/longest-common-subsequence/", daysAgo: 5, result: "Struggled", timeSpent: 40 },
  { title: "Word Break", platform: "LeetCode", source: "NeetCode150", topics: ["DP"], difficulty: "Medium", url: "https://leetcode.com/problems/word-break/", daysAgo: 4, result: "Independent", timeSpent: 30 },
  { title: "Counting Rooms", platform: "CSES", source: "CSES", topics: ["Graph", "BFS/DFS"], url: "https://cses.fi/problemset/task/1192", daysAgo: 3, result: "Independent", timeSpent: 22 },
  { title: "Combination Sum IV", platform: "LeetCode", source: "NeetCode150", topics: ["DP"], difficulty: "Medium", url: "https://leetcode.com/problems/combination-sum-iv/", daysAgo: 3, result: "Hint", timeSpent: 38, learningNote: "Order matters here — it's permutations not combinations. dp[i] += dp[i - coin] for each coin.", reattemptDaysFromNow: 2 },
  { title: "Maximum Product Subarray", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays", "DP"], difficulty: "Medium", daysAgo: 2, result: "Independent", timeSpent: 25 },
  { title: "Rotate Image", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays"], difficulty: "Medium", daysAgo: 2, result: "Independent", timeSpent: 18 },
  { title: "Spiral Matrix", platform: "LeetCode", source: "StriverSDE", topics: ["Arrays"], difficulty: "Medium", daysAgo: 1, result: "Independent", timeSpent: 20 },
];

async function main() {
  console.log("🌱 Seeding demo data...");

  await prisma.reattempt.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.dailyTarget.deleteMany();

  await prisma.dailyTarget.createMany({
    data: [
      { source: "NeetCode150", count: 4 },
      { source: "StriverSDE", count: 2 },
      { source: "CP31", count: 3 },
      { source: "Reattempt", count: 1 },
    ],
  });

  for (const p of problems) {
    const attemptedAt = subDays(today, p.daysAgo);
    attemptedAt.setHours(9 + Math.floor(Math.random() * 8));
    attemptedAt.setMinutes(Math.floor(Math.random() * 60));

    const problem = await prisma.problem.create({
      data: {
        title: p.title,
        platform: p.platform,
        source: p.source,
        topics: p.topics || [],
        difficulty: (p as any).difficulty || null,
        cfRating: (p as any).cfRating || null,
        url: (p as any).url || null,
        createdAt: attemptedAt,
        attempts: {
          create: {
            result: p.result,
            timeSpent: p.timeSpent,
            learningNote: (p as any).learningNote || null,
            attemptedAt,
          },
        },
      },
    });

    if ((p as any).reattemptDaysFromNow !== undefined) {
      const dueDate = addDays(today, (p as any).reattemptDaysFromNow);
      await prisma.reattempt.create({
        data: { problemId: problem.id, dueDate },
      });
    }
  }

  // Study sessions for heatmap
  const sessionData = [];
  for (let d = 35; d >= 1; d--) {
    if (d % 7 === 6 || d === 22 || d === 15) continue;
    const dayDate = subDays(today, d);
    const numSessions = 2 + Math.floor(Math.random() * 3);
    const sources = ["NeetCode150", "StriverSDE", "CP31"];
    for (let s = 0; s < numSessions; s++) {
      const src = sources[Math.floor(Math.random() * sources.length)];
      const duration = 40 + Math.floor(Math.random() * 120);
      const sd = new Date(dayDate);
      sd.setHours(9 + s * 2 + Math.floor(Math.random() * 2));
      sessionData.push({ source: src, duration, date: sd });
    }
  }
  sessionData.push({ source: "NeetCode150", duration: 201, date: new Date(today.setHours(9)) });
  sessionData.push({ source: "CP31", duration: 131, date: new Date(new Date().setHours(13)) });

  await prisma.studySession.createMany({ data: sessionData });

  console.log(`✅ Seeded ${problems.length} problems + ${sessionData.length} sessions`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
