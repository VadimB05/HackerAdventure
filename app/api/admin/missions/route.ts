import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Missionen-Verwaltung API
 * GET /api/admin/missions - Alle Missionen abrufen
 * POST /api/admin/missions - Neue Mission erstellen
 */

// Alle Missionen abrufen
export async function GET(request: NextRequest) {
  try {
    // User-Info aus Headers extrahieren (von Middleware gesetzt)
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
    }

    // Admin-Status aus der Datenbank prüfen
    const dbUser = await getUserById(user.id);
    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin-Berechtigung erforderlich' }, { status: 403 });
    }

    const missions = await executeQuery<{
      id: number;
      mission_id: string;
      name: string;
      description: string | null;
      difficulty: number;
      required_level: number;
      reward_bitcoins: string;
      reward_exp: number;
      is_available: boolean;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp, is_available, created_at, updated_at FROM missions ORDER BY required_level, difficulty, name'
    );

    return NextResponse.json({
      success: true,
      missions
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Missionen:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Neue Mission erstellen
export async function POST(request: NextRequest) {
  try {
    // User-Info aus Headers extrahieren (von Middleware gesetzt)
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
    }

    // Admin-Status aus der Datenbank prüfen
    const dbUser = await getUserById(user.id);
    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin-Berechtigung erforderlich' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      mission_id, 
      name, 
      description, 
      difficulty, 
      required_level, 
      reward_bitcoins, 
      reward_exp, 
      is_available 
    } = body;

    // Validierung
    if (!mission_id || !name) {
      return NextResponse.json(
        { error: 'mission_id und name sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob mission_id bereits existiert
    const existingMission = await executeQuerySingle<{id: number}>(
      'SELECT id FROM missions WHERE mission_id = ?',
      [mission_id]
    );

    if (existingMission) {
      return NextResponse.json(
        { error: 'Eine Mission mit dieser mission_id existiert bereits' },
        { status: 409 }
      );
    }

    // Neue Mission erstellen
    const result = await executeUpdate(
      'INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        mission_id,
        name,
        description || null,
        difficulty || 1,
        required_level || 1,
        reward_bitcoins || '0.00000000',
        reward_exp || 0,
        is_available !== undefined ? is_available : true
      ]
    );

    // Erstellte Mission abrufen
    const newMission = await executeQuerySingle<{
      id: number;
      mission_id: string;
      name: string;
      description: string | null;
      difficulty: number;
      required_level: number;
      reward_bitcoins: string;
      reward_exp: number;
      is_available: boolean;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp, is_available, created_at, updated_at FROM missions WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      mission: newMission,
      message: 'Mission erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Mission:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 