import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/attempts — add a new attempt to an existing problem
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { problemId, result, timeSpent, learningNote } = body;

  const attempt = await prisma.attempt.create({
    data: {
      problemId,
      result,
      timeSpent: timeSpent ? parseInt(timeSpent) : null,
      learningNote: learningNote || null,
    },
  });

  // If result is now independent, optionally remove reattempt
  if (result === "Independent") {
    // Keep it — user might want to reattempt again later
  }

  return NextResponse.json({
    ...attempt,
    attemptedAt: attempt.attemptedAt.toISOString(),
  });
}

// PATCH /api/attempts/[id]
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, result, timeSpent, learningNote } = body;

  const attempt = await prisma.attempt.update({
    where: { id },
    data: {
      ...(result && { result }),
      ...(timeSpent !== undefined && { timeSpent: timeSpent ? parseInt(timeSpent) : null }),
      ...(learningNote !== undefined && { learningNote }),
    },
  });

  return NextResponse.json({
    ...attempt,
    attemptedAt: attempt.attemptedAt.toISOString(),
  });
}
