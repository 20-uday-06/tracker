import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sessions
export async function GET() {
  const sessions = await prisma.studySession.findMany({
    orderBy: { date: "desc" },
  });

  return NextResponse.json(
    sessions.map((s) => ({ ...s, date: s.date.toISOString() }))
  );
}

// POST /api/sessions — log a study session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, duration, date } = body;

  const session = await prisma.studySession.create({
    data: {
      source,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json({ ...session, date: session.date.toISOString() });
}
