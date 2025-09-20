
// lib/jwt.ts - JWT utility functions
export interface JWTPayload {
  user_id?: number;
  id?: number;
  email?: string;
  username?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT token (without verification - for client-side use only)
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(atob(base64));
    
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  return payload.exp * 1000 < Date.now();
};

/**
 * Gets the user data from a JWT token
 */
export const getUserFromToken = (token: string): JWTPayload | null => {
  if (!token || isTokenExpired(token)) {
    return null;
  }
  
  return decodeJWT(token);
};