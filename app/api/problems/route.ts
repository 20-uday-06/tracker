import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform");
  const source = searchParams.get("source");
  const result = searchParams.get("result");
  const topic = searchParams.get("topic");
  const difficulty = searchParams.get("difficulty");
  const reattemptOnly = searchParams.get("reattemptOnly") === "true";
  const search = searchParams.get("search");
  const cfRating = searchParams.get("cfRating");

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (source) where.source = source;
  if (difficulty) where.difficulty = difficulty;
  if (cfRating) where.cfRating = parseInt(cfRating);
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (reattemptOnly) where.reattempt = { isNot: null };
  if (topic) where.topics = { has: topic };

  const problems = await prisma.problem.findMany({
    where,
    include: {
      attempts: { orderBy: { attemptedAt: "asc" } },
      reattempt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let parsed = problems.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    attempts: p.attempts.map((a) => ({
      ...a,
      attemptedAt: a.attemptedAt.toISOString(),
    })),
    reattempt: p.reattempt
      ? {
          ...p.reattempt,
          dueDate: p.reattempt.dueDate?.toISOString() ?? null,
          createdAt: p.reattempt.createdAt.toISOString(),
        }
      : null,
  }));

  // Filter by result (latest attempt)
  if (result) {
    parsed = parsed.filter((p) => {
      const latest = p.attempts[p.attempts.length - 1];
      return latest?.result === result;
    });
  }

  return NextResponse.json(parsed);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title, platform, source, topics, difficulty, cfRating,
    url, result, timeSpent, learningNote, addToReattempt, reattemptDueDate,
  } = body;

  const problem = await prisma.problem.create({
    data: {
      title: title.trim(),
      platform,
      source,
      topics: topics || [],
      difficulty: difficulty || null,
      cfRating: cfRating ? parseInt(cfRating) : null,
      url: url || null,
      attempts: {
        create: {
          result,
          timeSpent: timeSpent ? parseInt(timeSpent) : null,
          learningNote: learningNote || null,
        },
      },
    },
    include: { attempts: true, reattempt: true },
  });

  if (addToReattempt || result === "Hint" || result === "Solution") {
    await prisma.reattempt.create({
      data: {
        problemId: problem.id,
        dueDate: reattemptDueDate ? new Date(reattemptDueDate) : null,
      },
    });
  }

  return NextResponse.json({
    ...problem,
    createdAt: problem.createdAt.toISOString(),
    attempts: problem.attempts.map((a) => ({ ...a, attemptedAt: a.attemptedAt.toISOString() })),
  });
}
