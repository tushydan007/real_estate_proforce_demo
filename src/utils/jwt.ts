export interface JWTPayload {
  id?: number;
  email?: string;
  username?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT token (without verification - for client-side use only)
 * Note: This only decodes the payload, doesn't verify the signature
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed (base64url doesn't include padding)
    const paddedPayload = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      "="
    );

    // Convert base64url to base64
    const base64 = paddedPayload.replace(/-/g, "+").replace(/_/g, "/");

    // Decode and parse JSON
    const decodedPayload = JSON.parse(atob(base64));

    return decodedPayload;
  } catch (error) {
    console.error("Error decoding JWT:", error);
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

  // exp is in seconds, Date.now() is in milliseconds
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
