import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { jwtConfig } from './config';

// Token-Interface
export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT-Token generieren
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = new TextEncoder().encode(jwtConfig.secret);
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(jwtConfig.expiresIn)
    .sign(secret);
    
  return token;
}

/**
 * JWT-Token verifizieren
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(jwtConfig.secret);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('Token-Validierungsfehler:', error);
    return null;
  }
}

// Token aus Request extrahieren
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Middleware für geschützte Routen
export async function authenticateRequest(request: NextRequest): Promise<{
  user: JWTPayload | null;
  error?: string;
}> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return { user: null, error: 'Kein Token bereitgestellt' };
    }

    const user = await verifyToken(token);
    
    if (!user) {
      return { user: null, error: 'Ungültiger Token' };
    }

    return { user };
  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    return { user: null, error: 'Authentifizierungsfehler' };
  }
}

// Hilfsfunktion für geschützte API-Routen
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // User-Objekt zum Request hinzufügen
    (request as any).user = user;
    
    return handler(request);
  };
} 