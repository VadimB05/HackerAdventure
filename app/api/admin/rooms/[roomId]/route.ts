import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Einzelne Raum-Verwaltung API
 * GET /api/admin/rooms/[roomId] - Raum abrufen
 * PUT /api/admin/rooms/[roomId] - Raum bearbeiten
 * DELETE /api/admin/rooms/[roomId] - Raum löschen
 */

// Raum abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

    const { roomId } = await params;

    const room = await executeQuerySingle<{
      id: number;
      room_id: string;
      mission_id: string | null;
      city_id: string | null;
      name: string;
      description: string | null;
      background_image: string | null;
      is_locked: boolean;
      required_level: number;
      required_items: string;
      required_puzzles: string;
      connections: string;
      ambient_sound: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT r.*, 
              m.name as mission_name,
              c.name as city_name
       FROM rooms r
       LEFT JOIN missions m ON r.mission_id = m.mission_id
       LEFT JOIN cities c ON r.city_id = c.city_id
       WHERE r.room_id = ?`,
      [roomId]
    );

    if (!room) {
      return NextResponse.json(
        { error: 'Raum nicht gefunden' },
        { status: 404 }
      );
    }

    // JSON-Strings parsen
    const formattedRoom = {
      ...room,
      required_items: JSON.parse(room.required_items || '[]'),
      required_puzzles: JSON.parse(room.required_puzzles || '[]'),
      connections: JSON.parse(room.connections || '{}')
    };

    return NextResponse.json({
      success: true,
      room: formattedRoom
    });

  } catch (error) {
    console.error('Fehler beim Abrufen des Raums:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Raum bearbeiten
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

    const { roomId } = await params;
    const body = await request.json();
    const { 
      mission_id, 
      city_id, 
      name, 
      description, 
      background_image, 
      is_locked, 
      required_level, 
      required_items, 
      required_puzzles, 
      connections, 
      ambient_sound 
    } = body;

    // Prüfen ob Raum existiert
    const existingRoom = await executeQuerySingle<{id: number}>(
      'SELECT id FROM rooms WHERE room_id = ?',
      [roomId]
    );

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Raum nicht gefunden' },
        { status: 404 }
      );
    }

    // Mission-Validierung (falls angegeben)
    if (mission_id) {
      const missionExists = await executeQuerySingle<{id: number}>(
        'SELECT id FROM missions WHERE mission_id = ?',
        [mission_id]
      );
      if (!missionExists) {
        return NextResponse.json(
          { error: 'Die angegebene Mission existiert nicht' },
          { status: 400 }
        );
      }
    }

    // Stadt-Validierung (falls angegeben)
    if (city_id) {
      const cityExists = await executeQuerySingle<{id: number}>(
        'SELECT id FROM cities WHERE city_id = ?',
        [city_id]
      );
      if (!cityExists) {
        return NextResponse.json(
          { error: 'Die angegebene Stadt existiert nicht' },
          { status: 400 }
        );
      }
    }

    // Raum aktualisieren
    await executeUpdate(
      `UPDATE rooms SET 
        mission_id = ?, city_id = ?, name = ?, description = ?, 
        background_image = ?, is_locked = ?, required_level = ?, 
        required_items = ?, required_puzzles = ?, connections = ?, 
        ambient_sound = ?, updated_at = CURRENT_TIMESTAMP
       WHERE room_id = ?`,
      [
        mission_id || null,
        city_id || null,
        name,
        description || null,
        background_image || null,
        is_locked !== undefined ? is_locked : false,
        required_level || 1,
        JSON.stringify(required_items || []),
        JSON.stringify(required_puzzles || []),
        JSON.stringify(connections || {}),
        ambient_sound || null,
        roomId
      ]
    );

    // Aktualisierten Raum abrufen
    const updatedRoom = await executeQuerySingle<{
      id: number;
      room_id: string;
      mission_id: string | null;
      city_id: string | null;
      name: string;
      description: string | null;
      background_image: string | null;
      is_locked: boolean;
      required_level: number;
      required_items: string;
      required_puzzles: string;
      connections: string;
      ambient_sound: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT r.*, 
              m.name as mission_name,
              c.name as city_name
       FROM rooms r
       LEFT JOIN missions m ON r.mission_id = m.mission_id
       LEFT JOIN cities c ON r.city_id = c.city_id
       WHERE r.room_id = ?`,
      [roomId]
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { error: 'Fehler beim Abrufen des aktualisierten Raums' },
        { status: 500 }
      );
    }

    // JSON-Strings parsen
    const formattedRoom = {
      ...updatedRoom,
      required_items: JSON.parse(updatedRoom.required_items || '[]'),
      required_puzzles: JSON.parse(updatedRoom.required_puzzles || '[]'),
      connections: JSON.parse(updatedRoom.connections || '{}')
    };

    return NextResponse.json({
      success: true,
      room: formattedRoom,
      message: 'Raum erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Raums:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Raum löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

    const { roomId } = await params;

    // Prüfen ob Raum existiert
    const existingRoom = await executeQuerySingle<{id: number}>(
      'SELECT id FROM rooms WHERE room_id = ?',
      [roomId]
    );

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Raum nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Raum als current_room verwendet wird
    const roomInUse = await executeQuerySingle<{id: number}>(
      'SELECT id FROM game_states WHERE current_room = ?',
      [roomId]
    );

    if (roomInUse) {
      return NextResponse.json(
        { error: 'Raum kann nicht gelöscht werden, da er von Spielern verwendet wird' },
        { status: 409 }
      );
    }

    // Raum löschen (CASCADE löscht automatisch verknüpfte Rätsel und Objekte)
    await executeUpdate(
      'DELETE FROM rooms WHERE room_id = ?',
      [roomId]
    );

    return NextResponse.json({
      success: true,
      message: 'Raum erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen des Raums:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 