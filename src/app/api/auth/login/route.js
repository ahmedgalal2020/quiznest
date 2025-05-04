import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// تأكد من وجود SECRET_KEY
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function POST(req) {
  let prismaClient = null;
  
  try {
    prismaClient = new PrismaClient();
    
    // 1. التحقق من البيانات المستلمة
    if (!req.body) {
      return NextResponse.json({ 
        success: false, 
        error: "No data provided" 
      }, { status: 400 });
    }

    const { email, password } = await req.json();

    // 2. التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Email and password are required" 
      }, { status: 400 });
    }

    // 3. البحث عن المستخدم
    const user = await prismaClient.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        image: true,
      },
    });

    // 4. التحقق من وجود المستخدم
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid email or password" 
      }, { status: 401 });
    }

    // 5. التحقق من صحة كلمة المرور
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid email or password" 
      }, { status: 401 });
    }

    // 6. إنشاء بيانات التوكن
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name
    };

    // 7. إنشاء التوكن
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 8. تحديث وقت آخر تسجيل دخول
    await prismaClient.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // 9. إرجاع البيانات
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || null
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json({ 
      success: false, 
      error: "An error occurred during login",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });

  } finally {
    // إغلاق اتصال Prisma
    if (prismaClient) {
      await prismaClient.$disconnect();
    }
  }
}