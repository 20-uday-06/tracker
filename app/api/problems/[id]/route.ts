import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: { attempts: { orderBy: { attemptedAt: "asc" } }, reattempt: true },
  });
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...problem,
    createdAt: problem.createdAt.toISOString(),
    attempts: problem.attempts.map((a) => ({ ...a, attemptedAt: a.attemptedAt.toISOString() })),
    reattempt: problem.reattempt
      ? { ...problem.reattempt, dueDate: problem.reattempt.dueDate?.toISOString() ?? null, createdAt: problem.reattempt.createdAt.toISOString() }
      : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, platform, source, topics, difficulty, cfRating, url, company } = body;
  const problem = await prisma.problem.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(platform && { platform }),
      ...(source && { source }),
      ...(topics !== undefined && { topics }),
      ...(difficulty !== undefined && { difficulty: difficulty || null }),
      ...(cfRating !== undefined && { cfRating: cfRating ? parseInt(cfRating) : null }),
      ...(url !== undefined && { url: url || null }),
      ...(company !== undefined && { company: company || null }),
    },
    include: { attempts: { orderBy: { attemptedAt: "asc" } }, reattempt: true },
  });
  return NextResponse.json({
    ...problem,
    createdAt: problem.createdAt.toISOString(),
    attempts: problem.attempts.map((a) => ({ ...a, attemptedAt: a.attemptedAt.toISOString() })),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.problem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
