// src/app/api/sets/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// Middleware للتحقق من التوكن
// const verifyToken = (request) => {
//   try {
//     const authHeader = request.headers.get('authorization');
//     if (!authHeader) {
//       console.error('No authorization header provided');
      
//       // Development fallback
//       if (process.env.NODE_ENV === 'development') {
//         console.log('Using development fallback user');
//         return { userId: 1 }; // Fallback to user ID 1 for development
//       }
      
//       return null;
//     }

//     const parts = authHeader.split(' ');
//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//       console.error('Invalid authorization format, expected: Bearer <token>');
      
//       // Development fallback
//       if (process.env.NODE_ENV === 'development') {
//         console.log('Using development fallback user');
//         return { userId: 1 }; // Fallback to user ID 1 for development
//       }
      
//       return null;
//     }

//     const token = parts[1];
//     if (!token) {
//       console.error('No token provided in authorization header');
      
//       // Development fallback
//       if (process.env.NODE_ENV === 'development') {
//         console.log('Using development fallback user');
//         return { userId: 1 }; // Fallback to user ID 1 for development
//       }
      
//       return null;
//     }

//     // Check if token is a development mock token
//     if (token.startsWith('mocktoken.')) {
//       console.log('Using mock token for development');
//       try {
//         // Extract the base64 payload
//         const parts = token.split('.');
//         if (parts.length >= 2) {
//           // Decode the base64 payload - use Buffer in Node.js environment
//           const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
//           console.log('Decoded mock token payload:', payload);
//           return payload;
//         }
//       } catch (mockError) {
//         console.error('Error parsing mock token:', mockError);
//       }
      
//       // If mock token parsing fails, use fallback
//       return { userId: 1 };
//     }

//     // Use a default secret for development if JWT_SECRET is not set
//     const jwtSecret = process.env.JWT_SECRET || 'development_fallback_secret';
    
//     try {
//       const decoded = jwt.verify(token, jwtSecret);
//       console.log('Token verified successfully for user:', decoded.userId);
//       return decoded;
//     } catch (jwtError) {
//       console.error('JWT verification failed:', jwtError.message);
      
//       // Development fallback
//       if (process.env.NODE_ENV === 'development') {
//         console.log('Using development fallback user');
//         return { userId: 1 }; // Fallback to user ID 1 for development
//       }
      
//       return null;
//     }
//   } catch (error) {
//     console.error('Token verification error:', error);
    
//     // Development fallback
//     if (process.env.NODE_ENV === 'development') {
//       console.log('Using development fallback user');
//       return { userId: 1 }; // Fallback to user ID 1 for development
//     }
    
//     return null;
//   }
// };

export async function POST(req) {
  try {
    // التحقق من المصادقة
    const user = await verifyToken(req);
    if (!user) {
      console.error('Authentication failed: No valid token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication failed' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.userId);

    // Ensure userId is available and valid
    const userId = user.userId;
    if (!userId) {
      console.error('User ID is missing from token payload');
      return NextResponse.json(
        { error: 'Invalid user', message: 'User ID is missing' },
        { status: 401 }
      );
    }

    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify(requestData));
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return NextResponse.json(
        { error: 'Invalid request data', message: 'Could not parse request body: ' + error.message },
        { status: 400 }
      );
    }

    const { title, description, folderId, flashcards, sourceLang, targetLang, isPublic } = requestData;

    // التحقق من البيانات المطلوبة
    if (!title) {
      console.error('Missing title in request data');
      return NextResponse.json(
        { error: 'Invalid data', message: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(flashcards)) {
      console.error('Flashcards is not an array:', flashcards);
      return NextResponse.json(
        { error: 'Invalid data', message: 'Flashcards must be an array' },
        { status: 400 }
      );
    }
    
    if (flashcards.length === 0) {
      console.error('Flashcards array is empty');
      return NextResponse.json(
        { error: 'Invalid data', message: 'At least one flashcard is required' },
        { status: 400 }
      );
    }

    try {
      // إنشاء المجموعة
      console.log('Creating set with data:', {
        title,
        description: description || '',
        folderId: folderId ? parseInt(folderId) : null,
        userId,
        flashcardsCount: flashcards.length,
        isPublic: isPublic || false
      });

      // First create the set
      const set = await prisma.set.create({
        data: {
          title,
          description: description || '',
          isPublic: isPublic || false,
          userId: parseInt(userId), // Ensure userId is an integer
          folderId: folderId && folderId !== '' ? parseInt(folderId) : null
        }
      });

      console.log('Set created successfully, now adding flashcards for set:', set.id);

      // Then create the flashcards separately
      const createdFlashcards = [];
      for (const card of flashcards) {
        try {
          const flashcard = await prisma.flashcard.create({
            data: {
              setId: set.id,
              question: card.question,
              answer: card.answer
            }
          });
          createdFlashcards.push(flashcard);
        } catch (cardError) {
          console.error('Error creating flashcard:', cardError);
          // Continue with other cards
        }
      }

      console.log(`Created ${createdFlashcards.length} flashcards for set ${set.id}`);

      // Fetch the complete set with flashcards
      const completeSet = await prisma.set.findUnique({
        where: { id: set.id },
        include: {
          flashcards: true,
          folder: true
        }
      });

      console.log('Set created successfully with ID:', set.id);

      // تحديث إحصائيات المستخدم
      try {
        await prisma.userStats.upsert({
          where: { userId },
          update: {
            totalSets: { increment: 1 },
            totalCards: { increment: flashcards.length }
          },
          create: {
            userId,
            totalSets: 1,
            completedSets: 0,
            totalCards: flashcards.length,
            masteredCards: 0,
            studyStreak: 0,
            xpPoints: 0,
            level: 1
          }
        });
        console.log('User stats updated');
      } catch (statsError) {
        console.error('Error updating user stats:', statsError);
        // Continue even if stats update fails
      }

      return NextResponse.json(completeSet);
    } catch (dbError) {
      console.error('Database error creating set:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error',
          message: 'Failed to create set in database',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create set error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create set',
        message: error.message || 'Unknown server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// جلب المجموعات
export async function GET(req) {
  try {
    // التحقق من المصادقة
    const user = await verifyToken(req);
    if (!user) {
      console.error('Authentication failed: No valid token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication failed' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const folderId = url.searchParams.get("folderId");
    const userId = user.userId;

    console.log('Fetching sets for user:', userId, folderId ? `and folder: ${folderId}` : '');

    // Build the query
    const query = {
      where: {
        userId: parseInt(userId)
      },
      include: {
        _count: {
          select: { flashcards: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    };

    // Add folder filter if provided
    if (folderId) {
      query.where.folderId = parseInt(folderId);
    }

    const sets = await prisma.set.findMany(query);

    // Transform the response to include flashcard count
    const transformedSets = sets.map(set => ({
      ...set,
      flashcardsCount: set._count.flashcards
    }));

    return NextResponse.json(transformedSets);
  } catch (error) {
    console.error('Error fetching sets:', error);
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

// Get all sets
export async function GET_ALL(req) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sets = await prisma.set.findMany({
      where: {
        OR: [
          { userId: user.userId },
          { isPublic: true }
        ]
      },
      include: {
        flashcards: true,
        folder: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(sets);
  } catch (error) {
    console.error('Get sets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    );
  }
}