import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

const verifyToken = (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.error('Invalid authorization format, expected: Bearer <token>');
      return null;
    }

    const token = parts[1];
    if (!token) {
      console.error('No token provided in authorization header');
      return null;
    }

    // Use a default secret for development if JWT_SECRET is not set
    const jwtSecret = process.env.JWT_SECRET || 'development_fallback_secret';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Token verified successfully for user:', decoded.userId);
      return decoded;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback user');
        return { userId: 1 }; // Fallback to user ID 1 for development
      }
      
      return null;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('Using development fallback user');
      return { userId: 1 }; // Fallback to user ID 1 for development
    }
    
    return null;
  }
};

export async function GET(req, context) {
  try {
    // Make sure to await the params
    const params = await context.params;
    if (!params || !params.id) {
      console.error('Missing or invalid set ID in params:', params);
      return NextResponse.json(
        { error: 'Invalid set ID' },
        { status: 400 }
      );
    }

    // Parse the ID safely
    let setId;
    try {
      setId = parseInt(params.id);
      if (isNaN(setId)) {
        throw new Error('ID is not a valid number');
      }
    } catch (parseError) {
      console.error('Error parsing set ID:', parseError);
      return NextResponse.json(
        { error: 'Invalid set ID format' },
        { status: 400 }
      );
    }

    console.log('Fetching set with ID:', setId);

    const user = await verifyToken(req);
    if (!user) {
      console.warn('No authenticated user, using public access only');
      // For public sets, we can continue without authentication
      // For development, we'll use a fallback user ID
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const userId = user?.userId || (process.env.NODE_ENV === 'development' ? 1 : null);
    console.log('Using user ID for query:', userId);

    // جلب المجموعة مع جلب حالة التمييز لكل كارت للمستخدم
    const setData = await prisma.set.findUnique({
      where: {
        id: setId
      },
      include: {
        flashcards: {
          include: {
            // تأكد من أن العلاقة في الـ schema اسمها "flashcardBookmarks"
            flashcardBookmarks: userId ? {
              where: { userId }
            } : false
          }
        },
        folder: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (!setData) {
      console.error('Set not found with ID:', setId);
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية الوصول إلى المجموعة
    if (!setData.isPublic && setData.userId !== userId) {
      console.error('Access denied to private set:', setId);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Format the response to include isBookmarked flag
    const formattedSet = {
      ...setData,
      flashcards: setData.flashcards.map(card => ({
        ...card,
        isBookmarked: card.flashcardBookmarks && card.flashcardBookmarks.length > 0,
        flashcardBookmarks: undefined // Remove the bookmarks data from the response
      }))
    };

    // Ensure we're returning a valid JSON response
    return NextResponse.json({
      ...formattedSet,
      success: true
    });
  } catch (error) {
    console.error('Get set error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch set',
        message: error.message || 'Unknown server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
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

    // Parse the ID safely
    const params = await context.params;
    let setId;
    try {
      setId = parseInt(params.id);
      if (isNaN(setId)) {
        throw new Error('ID is not a valid number');
      }
    } catch (parseError) {
      console.error('Error parsing set ID:', parseError);
      return NextResponse.json(
        { error: 'Invalid set ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { title, description, isPublic, folderId, flashcards } = data;
    const userId = parseInt(user.userId);

    // Verify the set belongs to the user
    const existingSet = await prisma.set.findUnique({
      where: { id: setId },
      include: { flashcards: true }
    });

    if (!existingSet) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Set not found' },
        { status: 404 }
      );
    }

    if (existingSet.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this set' },
        { status: 403 }
      );
    }

    // Prepare the update transaction
    // This is a complex update that needs to:
    // 1. Update the set details
    // 2. Update existing flashcards
    // 3. Add new flashcards
    // 4. Delete removed flashcards

    // First, identify existing flashcard IDs
    const existingCardIds = existingSet.flashcards.map(card => card.id);
    
    // Identify cards to update, add, and delete
    const cardsToUpdate = flashcards.filter(card => card.id && existingCardIds.includes(card.id));
    const cardsToAdd = flashcards.filter(card => !card.id);
    const cardIdsToKeep = cardsToUpdate.map(card => card.id);
    const cardIdsToDelete = existingCardIds.filter(id => !cardIdsToKeep.includes(id));

    // Execute the transaction
    const updatedSet = await prisma.$transaction(async (tx) => {
      // 1. Update the set details
      const updatedSetData = await tx.set.update({
        where: { id: setId },
        data: {
          title,
          description: description || '',
          isPublic: isPublic !== undefined ? isPublic : existingSet.isPublic,
          folderId: folderId !== undefined ? (folderId ? parseInt(folderId) : null) : existingSet.folderId
        }
      });

      // 2. Update existing flashcards
      for (const card of cardsToUpdate) {
        await tx.flashcard.update({
          where: { id: card.id },
          data: {
            question: card.question,
            answer: card.answer,
            hint: card.hint || null,
            notes: card.notes || null,
            difficulty: convertDifficultyToInt(card.difficulty || 'MEDIUM')
          }
        });
        
        // Handle bookmark status separately
        if (card.isBookmarked) {
          // Create bookmark if it doesn't exist
          await tx.flashcardBookmark.upsert({
            where: {
              userId_flashcardId: {
                userId,
                flashcardId: card.id
              }
            },
            create: {
              userId,
              flashcardId: card.id
            },
            update: {} // No need to update anything if it exists
          });
        } else {
          // Remove bookmark if it exists
          await tx.flashcardBookmark.deleteMany({
            where: {
              userId,
              flashcardId: card.id
            }
          });
        }
      }

      // 3. Add new flashcards
      if (cardsToAdd.length > 0) {
        const newCards = await tx.flashcard.createMany({
          data: cardsToAdd.map(card => ({
            setId,
            question: card.question,
            answer: card.answer,
            hint: card.hint || null,
            notes: card.notes || null,
            difficulty: convertDifficultyToInt(card.difficulty || 'MEDIUM')
          })),
          skipDuplicates: false
        });
        
        // For new cards with bookmarks, we need to get their IDs first
        if (cardsToAdd.some(card => card.isBookmarked)) {
          const addedCards = await tx.flashcard.findMany({
            where: {
              setId,
              question: { in: cardsToAdd.map(card => card.question) },
              answer: { in: cardsToAdd.map(card => card.answer) }
            },
            orderBy: { id: 'desc' },
            take: cardsToAdd.length
          });
          
          // Create bookmarks for new cards that should be bookmarked
          const bookmarksToCreate = [];
          for (let i = 0; i < cardsToAdd.length; i++) {
            if (cardsToAdd[i].isBookmarked && addedCards[i]) {
              bookmarksToCreate.push({
                userId,
                flashcardId: addedCards[i].id
              });
            }
          }
          
          if (bookmarksToCreate.length > 0) {
            await tx.flashcardBookmark.createMany({
              data: bookmarksToCreate,
              skipDuplicates: true
            });
          }
        }
      }

      // 4. Delete removed flashcards
      if (cardIdsToDelete.length > 0) {
        await tx.flashcard.deleteMany({
          where: {
            id: { in: cardIdsToDelete }
          }
        });
      }

      // Return the updated set with all flashcards
      return tx.set.findUnique({
        where: { id: setId },
        include: {
          flashcards: {
            include: {
              flashcardBookmarks: {
                where: { userId }
              }
            }
          },
          folder: true
        }
      });
    });

    // Format the response to include isBookmarked flag
    const formattedSet = {
      ...updatedSet,
      flashcards: updatedSet.flashcards.map(card => ({
        ...card,
        isBookmarked: card.flashcardBookmarks && card.flashcardBookmarks.length > 0,
        flashcardBookmarks: undefined // Remove the bookmarks data from the response
      }))
    };

    // Ensure we're returning a valid JSON response
    return NextResponse.json({
      ...formattedSet,
      success: true
    });
  } catch (error) {
    console.error('Update set error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update set',
        message: error.message || 'Unknown server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to convert difficulty string to integer
function convertDifficultyToInt(difficulty) {
  switch (difficulty) {
    case 'EASY':
      return 0;
    case 'MEDIUM':
      return 1;
    case 'HARD':
      return 2;
    default:
      return 1; // Default to MEDIUM
  }
}
