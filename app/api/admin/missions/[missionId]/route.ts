import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Einzelne Mission-Verwaltung API
 * GET /api/admin/missions/[missionId] - Mission abrufen
 * PUT /api/admin/missions/[missionId] - Mission aktualisieren
 * DELETE /api/admin/missions/[missionId] - Mission löschen
 */

// Mission abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
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

    const { missionId } = await params;

    const mission = await executeQuerySingle<{
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
      'SELECT id, mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp, is_available, created_at, updated_at FROM missions WHERE mission_id = ?',
      [missionId]
    );

    if (!mission) {
      return NextResponse.json(
        { error: 'Mission nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mission
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Mission:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Mission aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
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

    const { missionId } = await params;
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

    // Prüfen ob Mission existiert
    const existingMission = await executeQuerySingle<{id: number}>(
      'SELECT id FROM missions WHERE mission_id = ?',
      [missionId]
    );

    if (!existingMission) {
      return NextResponse.json(
        { error: 'Mission nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob neue mission_id bereits existiert (außer bei der aktuellen Mission)
    if (mission_id !== missionId) {
      const duplicateMission = await executeQuerySingle<{id: number}>(
        'SELECT id FROM missions WHERE mission_id = ? AND mission_id != ?',
        [mission_id, missionId]
      );

      if (duplicateMission) {
        return NextResponse.json(
          { error: 'Eine Mission mit dieser mission_id existiert bereits' },
          { status: 409 }
        );
      }
    }

    // Mission aktualisieren
    await executeUpdate(
      'UPDATE missions SET mission_id = ?, name = ?, description = ?, difficulty = ?, required_level = ?, reward_bitcoins = ?, reward_exp = ?, is_available = ? WHERE mission_id = ?',
      [
        mission_id,
        name,
        description || null,
        difficulty || 1,
        required_level || 1,
        reward_bitcoins || '0.00000000',
        reward_exp || 0,
        is_available !== undefined ? is_available : true,
        missionId
      ]
    );

    // Aktualisierte Mission abrufen
    const updatedMission = await executeQuerySingle<{
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
      'SELECT id, mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp, is_available, created_at, updated_at FROM missions WHERE mission_id = ?',
      [mission_id]
    );

    return NextResponse.json({
      success: true,
      mission: updatedMission,
      message: 'Mission erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Mission:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Mission löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
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

    const { missionId } = await params;

    // Prüfen ob Mission existiert
    const existingMission = await executeQuerySingle<{id: number}>(
      'SELECT id FROM missions WHERE mission_id = ?',
      [missionId]
    );

    if (!existingMission) {
      return NextResponse.json(
        { error: 'Mission nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Mission Städten zugeordnet ist
    const cityMissions = await executeQuery<{id: number}>(
      'SELECT id FROM city_missions WHERE mission_id = ?',
      [missionId]
    );

    if (cityMissions.length > 0) {
      return NextResponse.json(
        { error: 'Mission kann nicht gelöscht werden, da sie noch Städten zugeordnet ist' },
        { status: 409 }
      );
    }

    // Prüfen ob Mission Räume hat
    const missionRooms = await executeQuery<{id: number}>(
      'SELECT id FROM rooms WHERE mission_id = ?',
      [missionId]
    );

    if (missionRooms.length > 0) {
      return NextResponse.json(
        { error: 'Mission kann nicht gelöscht werden, da sie noch Räume zugeordnet hat' },
        { status: 409 }
      );
    }

    // Prüfen ob Mission Rätsel hat
    const missionPuzzles = await executeQuery<{id: number}>(
      'SELECT p.id FROM puzzles p JOIN rooms r ON p.room_id = r.room_id WHERE r.mission_id = ?',
      [missionId]
    );

    if (missionPuzzles.length > 0) {
      return NextResponse.json(
        { error: 'Mission kann nicht gelöscht werden, da sie noch Rätsel zugeordnet hat' },
        { status: 409 }
      );
    }

    // Mission löschen
    const result = await executeUpdate(
      'DELETE FROM missions WHERE mission_id = ?',
      [missionId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Mission konnte nicht gelöscht werden' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mission erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen der Mission:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 