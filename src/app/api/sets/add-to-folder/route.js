import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../../lib/auth";

const prisma = new PrismaClient();

export async function POST(req) {
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

    // Parse request body
    const data = await req.json();
    const { setId, folderId } = data;

    if (!setId || !folderId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Set ID and folder ID are required' },
        { status: 400 }
      );
    }

    // Convert IDs to integers
    const setIdInt = parseInt(setId);
    const folderIdInt = parseInt(folderId);
    const userIdInt = parseInt(user.userId);

    // Verify the set belongs to the user
    const set = await prisma.set.findUnique({
      where: { id: setIdInt }
    });

    if (!set) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Set not found' },
        { status: 404 }
      );
    }

    if (set.userId !== userIdInt) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to modify this set' },
        { status: 403 }
      );
    }

    // Verify the folder belongs to the user
    const folder = await prisma.folder.findUnique({
      where: { id: folderIdInt }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Folder not found' },
        { status: 404 }
      );
    }

    if (folder.userId !== userIdInt) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to access this folder' },
        { status: 403 }
      );
    }

    // Update the set with the folder ID
    const updatedSet = await prisma.set.update({
      where: { id: setIdInt },
      data: { folderId: folderIdInt }
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error('Error adding set to folder:', error);
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
