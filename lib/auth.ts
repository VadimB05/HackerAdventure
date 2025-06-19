import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT Secret aus Umgebungsvariablen
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Token-Interface
export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

// Token validieren
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
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

    const user = verifyToken(token);
    
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

// Token generieren
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
} 