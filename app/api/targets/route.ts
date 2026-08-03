import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/targets
export async function GET() {
  const targets = await prisma.dailyTarget.findMany();
  return NextResponse.json(targets);
}

// POST /api/targets — upsert a target
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, minutes } = body;

  const target = await prisma.dailyTarget.upsert({
    where: { source },
    update: { minutes: parseInt(minutes) },
    create: { source, minutes: parseInt(minutes) },
  });

  return NextResponse.json(target);
}
