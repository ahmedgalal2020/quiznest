import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// إنشاء بطاقة تعليمية جديدة داخل مجموعة
export async function POST(req) {
  const { setId, question, answer, image } = await req.json();

  const flashcard = await prisma.flashcard.create({
    data: { setId, question, answer, image },
  });

  return NextResponse.json(flashcard);
}

// جلب جميع البطاقات
export async function GET() {
  const flashcards = await prisma.flashcard.findMany();
  return NextResponse.json(flashcards);
}
