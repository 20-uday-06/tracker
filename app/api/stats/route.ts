import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [problems, sessions] = await Promise.all([
    prisma.problem.findMany({
      include: { attempts: { orderBy: { attemptedAt: "asc" } }, reattempt: true },
    }),
    prisma.studySession.findMany({ orderBy: { date: "asc" } }),
  ]);

  return NextResponse.json({
    problems: problems.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      attempts: p.attempts.map((a) => ({ ...a, attemptedAt: a.attemptedAt.toISOString() })),
      reattempt: p.reattempt
        ? { ...p.reattempt, dueDate: p.reattempt.dueDate?.toISOString() ?? null, createdAt: p.reattempt.createdAt.toISOString() }
        : null,
    })),
    sessions: sessions.map((s) => ({ ...s, date: s.date.toISOString() })),
  });
}
