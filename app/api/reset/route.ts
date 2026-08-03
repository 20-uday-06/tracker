import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/seed — reset and re-seed demo data
export async function POST() {
  // Clear everything
  await prisma.reattempt.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.dailyTarget.deleteMany();

  return NextResponse.json({ success: true, message: "All data cleared" });
}
