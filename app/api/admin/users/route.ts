import { NextRequest, NextResponse } from 'next/server';

/**
 * Alle Benutzer für Admin abrufen
 * GET /api/admin/users
 */
export async function GET(request: NextRequest) {
  try {
    // Platzhalter-Daten für Test
    const users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@intrusion.com',
        isAdmin: true,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        username: 'player1',
        email: 'player1@example.com',
        isAdmin: false,
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        lastLogin: '2024-01-14T15:45:00Z'
      },
      {
        id: 3,
        username: 'player2',
        email: 'player2@example.com',
        isAdmin: false,
        isActive: false,
        createdAt: '2024-01-03T00:00:00Z',
        lastLogin: '2024-01-10T09:20:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen der Benutzer'
    }, { status: 500 });
  }
}

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