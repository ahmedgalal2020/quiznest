import { PrismaClient } from '@prisma/client';

// Add better error handling for Prisma client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances during hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Add error handling
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    // Safely access params properties
    const model = params?.model || 'unknown';
    const action = params?.action || 'unknown';
    console.error(`Prisma Error in ${model}.${action}:`, error);
    throw error;
  }
});

export default prisma;