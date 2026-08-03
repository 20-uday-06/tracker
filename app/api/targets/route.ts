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
  const { source, count } = body;

  const target = await prisma.dailyTarget.upsert({
    where: { source },
    update: { count: parseInt(count) },
    create: { source, count: parseInt(count) },
  });

  return NextResponse.json(target);
}
