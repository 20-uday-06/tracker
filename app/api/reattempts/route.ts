import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, parseISO, startOfDay, addDays } from "date-fns";

// GET /api/reattempts — list all reattempts with problem details
export async function GET() {
  const reattempts = await prisma.reattempt.findMany({
    include: {
      problem: {
        include: {
          attempts: { orderBy: { attemptedAt: "asc" } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const today = startOfDay(new Date());

  return NextResponse.json(
    reattempts.map((r) => ({
      ...r,
      dueDate: r.dueDate?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      problem: {
        ...r.problem,
        topics: r.problem.topics,
        createdAt: r.problem.createdAt.toISOString(),
        attempts: r.problem.attempts.map((a) => ({
          ...a,
          attemptedAt: a.attemptedAt.toISOString(),
        })),
      },
    }))
  );
}

// POST /api/reattempts — add problem to reattempt queue
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { problemId, dueDate } = body;

  // Check if already in reattempt queue
  const existing = await prisma.reattempt.findUnique({ where: { problemId } });
  if (existing) {
    // Update due date
    const updated = await prisma.reattempt.update({
      where: { problemId },
      data: { dueDate: dueDate ? new Date(dueDate) : null },
    });
    return NextResponse.json({
      ...updated,
      dueDate: updated.dueDate?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
    });
  }

  const reattempt = await prisma.reattempt.create({
    data: {
      problemId,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json({
    ...reattempt,
    dueDate: reattempt.dueDate?.toISOString() || null,
    createdAt: reattempt.createdAt.toISOString(),
  });
}

// DELETE /api/reattempts/[id]
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { problemId } = body;

  await prisma.reattempt.delete({ where: { problemId } });
  return NextResponse.json({ success: true });
}
