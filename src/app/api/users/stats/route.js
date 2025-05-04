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

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    
    // For development, we'll use a fallback user ID
    const userId = user?.userId || (process.env.NODE_ENV === 'development' ? 1 : null);
    
    // If not authenticated and not in development, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching stats for user:', userId);

    // Get user stats
    const userStats = await prisma.userStats.findUnique({
      where: {
        userId: userId
      }
    });

    // If no stats exist yet, create default stats
    if (!userStats) {
      const defaultStats = {
        userId: userId,
        totalSets: 0,
        completedSets: 0,
        totalCards: 0,
        masteredCards: 0,
        studyStreak: 0,
        lastStudyDate: null,
        xpPoints: 0,
        level: 1
      };

      // Try to create default stats
      try {
        await prisma.userStats.create({
          data: defaultStats
        });
        
        return NextResponse.json(defaultStats);
      } catch (createError) {
        console.error('Error creating default user stats:', createError);
        return NextResponse.json(defaultStats);
      }
    }

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user stats',
        message: error.message || 'Unknown server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
