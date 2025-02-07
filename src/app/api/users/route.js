import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// إنشاء مستخدم جديد
export async function POST(req) {
  const { name, email, password } = await req.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return NextResponse.json(user);
}

// جلب جميع المستخدمين
export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}
