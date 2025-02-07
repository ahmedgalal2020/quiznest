import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// إنشاء مستخدم جديد
export async function POST(req) {
  try {
    console.log("📌 استلام طلب لإنشاء مجلد...");

    if (req.headers.get("content-type") !== "application/json") {
      console.log("🚨 خطأ: البيانات ليست بصيغة JSON");
      return NextResponse.json({ error: "يجب إرسال البيانات بصيغة JSON" }, { status: 400 });
    }

    const data = await req.json();
    console.log("📌 البيانات المستلمة:", data);

    if (!data || !data.name || !data.userId) {
      console.log("🚨 خطأ: البيانات غير مكتملة:", data);
      return NextResponse.json({ error: "يجب إدخال اسم المجلد و userId" }, { status: 400 });
    }

    console.log("📌 إنشاء مجلد في قاعدة البيانات...");
    const folder = await prisma.folder.create({
      data: {
        name: data.name,
        userId: parseInt(data.userId), // ✅ تحويل userId إلى رقم
      },
    });

    console.log("✅ مجلد تم إنشاؤه بنجاح:", folder);
    return NextResponse.json(folder);
  } catch (error) {
    console.error("🚨 خطأ داخلي أثناء إنشاء المجلد:", error);

    // 🔍 إرسال الخطأ المفصل إلى العميل
    return NextResponse.json({ error: `🚨 Prisma Error: ${error.message}` }, { status: 500 });
  }
}
// جلب جميع المستخدمين
export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}
