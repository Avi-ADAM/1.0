/**
 * JWT Authentication utilities
 */
import jwt from 'jsonwebtoken';

// Get JWT_SECRET dynamically to ensure it's loaded after dotenv.config()
function getJwtSecret(): string | undefined {
  return process.env.JWT_SECRET;
}

function shouldSkipVerification(): boolean {
  const secret = getJwtSecret();
  return !secret || secret === 'your-jwt-secret-here';
}

export interface JWTPayload {
  id: string;
  [key: string]: any;
}

/**
 * Verify JWT token and extract user ID
 * 
 * Note: If JWT_SECRET is not configured, verification is skipped.
 * This is acceptable for development but NOT for production!
 */
export function verifyToken(token: string): { valid: boolean; userId?: string; error?: string } {
  const JWT_SECRET = getJwtSecret();
  
  // Skip verification if JWT_SECRET is not configured
  if (shouldSkipVerification()) {
    console.warn('[Auth] JWT verification is DISABLED - JWT_SECRET not configured');
    
    // Try to decode without verification to get userId
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded && (decoded.id || decoded.userId)) {
        return {
          valid: true,
          userId: decoded.id || decoded.userId
        };
      }
    } catch (error) {
      // If decode fails, we can't extract userId
    }
    
    // If we can't decode, just accept it (insecure but allows development)
    return {
      valid: true,
      userId: undefined
    };
  }
  
  // Normal JWT verification when JWT_SECRET is configured
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    
    // Debug: log the decoded JWT to see what fields it has
    console.log('[Auth] Decoded JWT:', JSON.stringify(decoded, null, 2));
    
    // Strapi JWT typically has 'id' field
    const userId = decoded.id || decoded.userId || decoded.sub;
    
    return {
      valid: true,
      userId: String(userId) // Ensure it's a string
    };
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token'
    };
  }
}

/**
 * Extract token from bearer string
 */
export function extractToken(bearerToken: string): string | null {
  if (!bearerToken) return null;
  
  const parts = bearerToken.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  
  return bearerToken;
}
