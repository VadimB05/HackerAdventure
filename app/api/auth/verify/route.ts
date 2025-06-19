import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * JWT-Token verifizieren
 * GET /api/auth/verify
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    // Vollständige Benutzerdaten aus Datenbank abrufen
    const dbUser = await getUserById(user.id);

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        isAdmin: dbUser.isAdmin
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Token-Verifikationsfehler:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler'
    }, { status: 500 });
  }
} 