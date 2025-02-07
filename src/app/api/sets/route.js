import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// إنشاء مجموعة جديدة داخل مجلد
export async function POST(req) {
  const { title, folderId } = await req.json();

  const set = await prisma.set.create({
    data: { title, folderId },
  });

  return NextResponse.json(set);
}

// جلب جميع المجموعات
export async function GET() {
  const sets = await prisma.set.findMany({
    include: { flashcards: true }, // إرجاع البطاقات داخل كل مجموعة
  });
  return NextResponse.json(sets);
}
