import jwt from 'jsonwebtoken';

/**
 * Verifies a JWT token from the request headers
 * @param {Request} request - The Next.js request object
 * @returns {Object|null} - The decoded token payload or null if invalid
 */
export const verifyToken = (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback user');
        return { userId: 1 }; // Fallback to user ID 1 for development
      }
      
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.error('Invalid authorization format, expected: Bearer <token>');
      
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback user');
        return { userId: 1 }; // Fallback to user ID 1 for development
      }
      
      return null;
    }

    const token = parts[1];
    if (!token) {
      console.error('No token provided in authorization header');
      
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback user');
        return { userId: 1 }; // Fallback to user ID 1 for development
      }
      
      return null;
    }

    // Check if token is a development mock token
    if (token.startsWith('mocktoken.')) {
      console.log('Using mock token for development');
      try {
        // Extract the base64 payload
        const parts = token.split('.');
        if (parts.length >= 2) {
          // Decode the base64 payload - use Buffer in Node.js environment
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('Decoded mock token payload:', payload);
          return payload;
        }
      } catch (mockError) {
        console.error('Error parsing mock token:', mockError);
      }
      
      // If mock token parsing fails, use fallback
      return { userId: 1 };
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
