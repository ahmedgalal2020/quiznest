import { NextResponse } from "next/server";
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// إنشاء مجلد جديد
export async function POST(req) {
  try {
    console.log("📌 استلام طلب لإنشاء مجلد...");

    // التحقق من المصادقة
    const user = await verifyToken(req);
    if (!user) {
      console.error('Authentication failed: No valid token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (req.headers.get("content-type") !== "application/json") {
      console.log("🚨 خطأ: البيانات ليست بصيغة JSON");
      return NextResponse.json({ error: "يجب إرسال البيانات بصيغة JSON" }, { status: 400 });
    }

    const data = await req.json();
    console.log("📌 البيانات المستلمة:", data);

    if (!data || !data.name) {
      console.log("🚨 خطأ: البيانات غير مكتملة:", data);
      return NextResponse.json({ error: "يجب إدخال اسم المجلد" }, { status: 400 });
    }

    // استخدام userId من التوكن
    const userId = user.userId;

    console.log("📌 إنشاء مجلد في قاعدة البيانات...");
    const folder = await prisma.folder.create({
      data: {
        name: data.name,
        userId: parseInt(userId), // ✅ تحويل userId إلى رقم
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

// جلب جميع المجلدات
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    // If userId is provided, get folders for that user
    if (userId) {
      let parsedId;
      try {
        parsedId = parseInt(userId);
        if (isNaN(parsedId)) {
          throw new Error('ID is not a valid number');
        }
      } catch (parseError) {
        console.error('Error parsing user ID:', parseError);
        return NextResponse.json(
          { error: 'Invalid user ID format' },
          { status: 400 }
        );
      }

      console.log('Fetching folders for user ID:', parsedId);
      const folders = await prisma.folder.findMany({
        where: { userId: parsedId },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(folders);
    }

    // Otherwise, return all folders (with limited info)
    console.log('Fetching all folders');
    const folders = await prisma.folder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 folders for performance
    });
    return NextResponse.json(folders);
  } catch (error) {
    console.error("🚨 Error fetching folders:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
