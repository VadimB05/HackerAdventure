import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { executeQuery, executeUpdate } from '@/lib/database';
import { getUserById } from '@/lib/services/auth-service';

async function patchHandler(request: NextRequest) {
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

  const url = new URL(request.url);
  const userId = parseInt(url.pathname.split('/').pop() || '', 10);

  if (isNaN(userId)) {
    return NextResponse.json({
      success: false,
      error: 'Ungültige Benutzer-ID'
    }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { is_admin, is_active } = body;

    // Prüfen welche Felder aktualisiert werden sollen
    const updates: string[] = [];
    const values: any[] = [];

    if (typeof is_admin === 'boolean') {
      updates.push('is_admin = ?');
      values.push(is_admin);
    }

    if (typeof is_active === 'boolean') {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Keine gültigen Felder zum Aktualisieren'
      }, { status: 400 });
    }

    // Update durchführen
    const result = await executeUpdate(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      [...values, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
}

async function deleteHandler(request: NextRequest) {
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

  const url = new URL(request.url);
  const userId = parseInt(url.pathname.split('/').pop() || '', 10);

  if (isNaN(userId)) {
    return NextResponse.json({
      success: false,
      error: 'Ungültige Benutzer-ID'
    }, { status: 400 });
  }

  try {
    // Benutzer löschen
    const result = await executeUpdate(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
}

export const PATCH = patchHandler;
export const DELETE = deleteHandler; 