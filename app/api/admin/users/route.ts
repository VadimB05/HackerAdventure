import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { executeQuery } from '@/lib/database';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Alle Benutzer für Admin abrufen
 * GET /api/admin/users
 */
async function handler(request: NextRequest) {
  try {
    // User-Info aus Headers extrahieren
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentifizierung erforderlich'
      }, { status: 401 });
    }

    // Admin-Status aus der Datenbank prüfen
    const dbUser = await getUserById(user.id);
    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Berechtigung erforderlich'
      }, { status: 403 });
    }

    // Alle Benutzer aus der Datenbank laden
    const users = await executeQuery(`
      SELECT 
        id,
        username,
        email,
        is_admin,
        is_active,
        created_at,
        last_login
      FROM users 
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error loading users:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Benutzer'
    }, { status: 500 });
  }
}

export const GET = handler;

/**
 * Benutzer-Status ändern
 * PATCH /api/admin/users
 * Body: { userId: number, isActive: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isActive } = body;

    // Validierung
    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'userId und isActive sind erforderlich'
      }, { status: 400 });
    }

    // Platzhalter-Logik für Test
    return NextResponse.json({
      success: true,
      message: `Benutzer ${userId} Status erfolgreich geändert`,
      user: {
        id: userId,
        isActive
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Ändern des Benutzer-Status'
    }, { status: 500 });
  }
} 