import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

const verifyToken = (req) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export async function POST(req) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flashcardId } = await req.json();
    if (!flashcardId) {
      return NextResponse.json({ error: 'flashcardId is required' }, { status: 400 });
    }

    // إنشاء سجل التمييز
    const bookmark = await prisma.flashcardBookmark.create({
      data: {
        userId: user.userId,
        flashcardId: parseInt(flashcardId),
      },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Bookmark create error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create bookmark' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // نفترض أن flashcardId مرسلة كـ query parameter
    const { searchParams } = new URL(req.url);
    const flashcardId = searchParams.get('flashcardId');
    if (!flashcardId) {
      return NextResponse.json({ error: 'flashcardId is required' }, { status: 400 });
    }

    const deleted = await prisma.flashcardBookmark.deleteMany({
      where: {
        userId: user.userId,
        flashcardId: parseInt(flashcardId),
      },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.error('Bookmark delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete bookmark' }, { status: 500 });
  }
}
