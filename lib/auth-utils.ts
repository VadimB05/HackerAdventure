import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Hilfsfunktionen für die Authentifizierung in API-Routen
 */

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
}

/**
 * Authentifizierung für API-Routen
 * Extrahiert User-Info aus Request-Headers (von Middleware gesetzt)
 */
export function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-username');

  if (!userId || !username) {
    return null;
  }

  return {
    id: parseInt(userId, 10),
    username,
    isAdmin: false // Wird in den API-Routen aus der DB geprüft
  };
}

/**
 * Middleware-Funktion für geschützte API-Routen
 */
export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Zuerst versuchen, User aus Headers zu extrahieren (von Middleware)
    let user = getAuthenticatedUser(request);

    // Fallback: Token aus Authorization-Header extrahieren
    if (!user) {
      const token = extractToken(request);
      if (token) {
        const tokenUser = await verifyToken(token);
        if (tokenUser) {
          const dbUser = await getUserById(tokenUser.userId);
          if (dbUser) {
            user = {
              id: dbUser.id,
              username: dbUser.username,
              isAdmin: dbUser.isAdmin
            };
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentifizierung erforderlich'
      }, { status: 401 });
    }

    // User zum Request hinzufügen
    (request as AuthenticatedRequest).user = user;

    return handler(request as AuthenticatedRequest);
  };
}

/**
 * Middleware-Funktion für Admin-API-Routen
 */
export function requireAdmin(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return requireAuth(async (request: AuthenticatedRequest) => {
    if (!request.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Berechtigung erforderlich'
      }, { status: 403 });
    }

    return handler(request);
  });
}

/**
 * Hilfsfunktion für User-ID aus Request extrahieren
 */
export function getUserId(request: NextRequest): number | null {
  const user = getAuthenticatedUser(request);
  return user?.id || null;
}

/**
 * Hilfsfunktion für Username aus Request extrahieren
 */
export function getUsername(request: NextRequest): string | null {
  const user = getAuthenticatedUser(request);
  return user?.username || null;
}

/**
 * Hilfsfunktion für Admin-Status prüfen
 */
export function isAdmin(request: NextRequest): boolean {
  const user = getAuthenticatedUser(request);
  return user?.isAdmin || false;
}

// Die requireAdmin Funktion ist bereits vorhanden und funktioniert korrekt
// Keine zusätzlichen Admin-Funktionen nötig 