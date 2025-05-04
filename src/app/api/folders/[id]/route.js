import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../../lib/auth";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      console.error('Authentication failed: No valid token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication failed' },
        { status: 401 }
      );
    }

    const folderId = parseInt(params.id);
    const userId = parseInt(user.userId);

    // Fetch the folder
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: { sets: true }
        }
      }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Folder not found' },
        { status: 404 }
      );
    }

    // Verify the folder belongs to the user
    if (folder.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to access this folder' },
        { status: 403 }
      );
    }

    // Transform the response to include set count
    const transformedFolder = {
      ...folder,
      setsCount: folder._count.sets
    };

    return NextResponse.json(transformedFolder);
  } catch (error) {
    console.error('Error fetching folder:', error);
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
