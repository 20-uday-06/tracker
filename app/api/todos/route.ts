import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const todo = await prisma.todo.create({
    data: {
      text: body.text,
      category: body.category || "today",
    },
  });
  return NextResponse.json(todo);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, completed, category, text } = body;
  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(completed !== undefined && { completed }),
      ...(category !== undefined && { category }),
      ...(text !== undefined && { text }),
    },
  });
  return NextResponse.json(todo);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all");
  const id = url.searchParams.get("id");

  if (all === "true") {
    await prisma.todo.deleteMany({});
    return NextResponse.json({ deleted: true });
  }

  if (id) {
    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Missing id or all param" }, { status: 400 });
}
