import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Admin-Verifizierung
 * GET /api/admin/verify
 */
export async function GET(request: NextRequest) {
  try {
    // Token aus Cookie extrahieren
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Kein Token gefunden'
      }, { status: 401 });
    }

    // Token verifizieren
    const tokenUser = await verifyToken(token);
    if (!tokenUser) {
      return NextResponse.json({
        success: false,
        error: 'Ungültiger Token'
      }, { status: 401 });
    }

    // Benutzer aus Datenbank laden
    const dbUser = await getUserById(tokenUser.userId);
    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'Benutzer nicht gefunden'
      }, { status: 401 });
    }

    if (!dbUser.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Berechtigung erforderlich'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        isAdmin: dbUser.isAdmin
      }
    });

  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
} 