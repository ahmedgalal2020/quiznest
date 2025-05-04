import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from '@/app/lib/prisma';

// إنشاء مستخدم جديد (Register)
export async function POST(req) {
  try {
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify({
        ...requestData,
        password: requestData.password ? '[REDACTED]' : undefined
      }));
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return NextResponse.json(
        { error: 'Invalid request data', message: 'Could not parse request body' },
        { status: 400 }
      );
    }

    const { name, email, password } = requestData;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // التحقق مما إذا كان البريد الإلكتروني مسجلاً بالفعل
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Create initial user stats
    try {
      await prisma.userStats.create({
        data: {
          userId: user.id,
          totalSets: 0,
          completedSets: 0,
          totalCards: 0,
          masteredCards: 0,
          studyStreak: 0,
          xpPoints: 0,
          level: 1
        }
      });
    } catch (statsError) {
      console.warn('Failed to create initial user stats:', statsError);
      // Continue even if stats creation fails
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("🚨 Error creating user:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

// جلب بيانات مستخدم محدد بناءً على `id`
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    // If no userId is provided, return all users (with limited fields for security)
    if (!userId) {
      console.log('No user ID provided, returning all users');
      const users = await prisma.user.findMany({
        select: { 
          id: true, 
          name: true, 
          image: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit to 50 users for performance
      });
      
      return NextResponse.json(users);
    }

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

    console.log('Fetching user with ID:', parsedId);

    const user = await prisma.user.findUnique({
      where: { id: parsedId },
      select: { id: true, name: true, image: true },
    });

    if (!user) {
      console.warn(`User not found with ID: ${parsedId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("🚨 Error fetching user:", error);
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

// ✅ تحديث بيانات المستخدم
export async function PUT(req) {
  try {
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify({
        ...requestData,
        password: requestData.password ? '[REDACTED]' : undefined
      }));
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return NextResponse.json(
        { error: 'Invalid request data', message: 'Could not parse request body' },
        { status: 400 }
      );
    }

    const { id, name, email, image } = requestData;

    if (!id || !name || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    let parsedId;
    try {
      parsedId = parseInt(id);
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

    const updatedUser = await prisma.user.update({
      where: { id: parsedId },
      data: { name, email, image },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error("🚨 Error updating user:", error);
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
