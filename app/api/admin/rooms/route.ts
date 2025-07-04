import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Räume-Verwaltung API
 * GET /api/admin/rooms - Alle Räume abrufen
 * POST /api/admin/rooms - Neuen Raum erstellen
 */

// Alle Räume abrufen
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

    const rooms = await executeQuery<{
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
       ORDER BY r.room_id`
    );

    // JSON-Strings parsen
    const formattedRooms = rooms.map(room => ({
      ...room,
      required_items: JSON.parse(room.required_items || '[]'),
      required_puzzles: JSON.parse(room.required_puzzles || '[]'),
      connections: JSON.parse(room.connections || '{}')
    }));

    return NextResponse.json({
      success: true,
      rooms: formattedRooms
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Räume:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Neuen Raum erstellen
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
      room_id, 
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

    // Validierung
    if (!room_id || !name) {
      return NextResponse.json(
        { error: 'room_id und name sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob room_id bereits existiert
    const existingRoom = await executeQuerySingle<{id: number}>(
      'SELECT id FROM rooms WHERE room_id = ?',
      [room_id]
    );

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Ein Raum mit dieser room_id existiert bereits' },
        { status: 409 }
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

    // Neuen Raum erstellen
    const result = await executeUpdate(
      `INSERT INTO rooms (
        room_id, mission_id, city_id, name, description, background_image, 
        is_locked, required_level, required_items, required_puzzles, 
        connections, ambient_sound
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        room_id,
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
        ambient_sound || null
      ]
    );

    // Erstellten Raum abrufen
    const newRoom = await executeQuerySingle<{
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
      'SELECT * FROM rooms WHERE id = ?',
      [result.insertId]
    );

    if (!newRoom) {
      return NextResponse.json(
        { error: 'Fehler beim Abrufen des erstellten Raums' },
        { status: 500 }
      );
    }

    // JSON-Strings parsen
    const formattedRoom = {
      ...newRoom,
      required_items: JSON.parse(newRoom.required_items || '[]'),
      required_puzzles: JSON.parse(newRoom.required_puzzles || '[]'),
      connections: JSON.parse(newRoom.connections || '{}')
    };

    return NextResponse.json({
      success: true,
      room: formattedRoom,
      message: 'Raum erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen des Raums:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 