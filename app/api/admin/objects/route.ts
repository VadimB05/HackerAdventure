import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/database';

/**
 * Alle Raum-Objekte für Admin abrufen
 * GET /api/admin/objects
 */
export async function GET(request: NextRequest) {
  try {
    // Admin-Authentifizierung über Header
    const authHeader = request.headers.get('x-user-info');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const userInfo = JSON.parse(decodeURIComponent(authHeader));
    if (!userInfo.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Rechte erforderlich'
      }, { status: 403 });
    }

    // Alle Raum-Objekte mit Raum-Informationen abrufen
    const objects = await executeQuery<{
      id: number;
      room_id: string;
      object_id: string;
      name: string;
      description: string;
      object_type: string;
      x_position: number;
      y_position: number;
      width: number;
      height: number;
      icon: string;
      status: string;
      compatible_items: string;
      required_items: string;
      required_missions_completed: boolean;
      puzzle_id: string | null;
      exit_room_id: string | null;
      created_at: string;
      updated_at: string;
      room_name: string;
      puzzle_name: string | null;
      exit_room_name: string | null;
    }>(
      `SELECT 
        ro.*,
        r.name as room_name,
        p.name as puzzle_name,
        er.name as exit_room_name
      FROM room_objects ro
      LEFT JOIN rooms r ON ro.room_id = r.room_id
      LEFT JOIN puzzles p ON ro.puzzle_id = p.puzzle_id
      LEFT JOIN rooms er ON ro.exit_room_id = er.room_id
      ORDER BY ro.room_id, ro.object_id`
    );

    // Objekte formatieren
    const formattedObjects = objects.map(obj => ({
      id: obj.object_id,
      roomId: obj.room_id,
      roomName: obj.room_name,
      name: obj.name,
      description: obj.description,
      type: obj.object_type,
      x: obj.x_position,
      y: obj.y_position,
      width: obj.width,
      height: obj.height,
      icon: obj.icon,
      status: obj.status,
      compatibleItems: JSON.parse(obj.compatible_items || '[]'),
      requiredItems: JSON.parse(obj.required_items || '[]'),
      requiredMissionsCompleted: obj.required_missions_completed,
      puzzleId: obj.puzzle_id,
      puzzleName: obj.puzzle_name,
      exitRoomId: obj.exit_room_id,
      exitRoomName: obj.exit_room_name,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at
    }));

    return NextResponse.json({
      success: true,
      objects: formattedObjects,
      count: formattedObjects.length
    }, { status: 200 });
  } catch (error) {
    console.error('Fehler beim Abrufen der Objekte:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen der Objekte'
    }, { status: 500 });
  }
}

/**
 * Neues Raum-Objekt erstellen
 * POST /api/admin/objects
 */
export async function POST(request: NextRequest) {
  try {
    // Admin-Authentifizierung über Header
    const authHeader = request.headers.get('x-user-info');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const userInfo = JSON.parse(decodeURIComponent(authHeader));
    if (!userInfo.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Rechte erforderlich'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      roomId,
      id: objectId,
      name,
      description,
      type,
      x,
      y,
      width,
      height,
      icon,
      status = 'available',
      compatibleItems = [],
      requiredItems = [],
      requiredMissionsCompleted = false,
      puzzleId,
      exitRoomId
    } = body;

    // Validierung
    if (!roomId || !objectId || !name || !type) {
      return NextResponse.json({
        success: false,
        error: 'roomId, id, name und type sind erforderlich'
      }, { status: 400 });
    }

    // Prüfen ob Raum existiert
    const room = await executeQuerySingle(
      'SELECT room_id FROM rooms WHERE room_id = ?',
      [roomId]
    );

    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Raum nicht gefunden'
      }, { status: 404 });
    }

    // Prüfen ob Objekt-ID bereits existiert
    const existingObject = await executeQuerySingle(
      'SELECT object_id FROM room_objects WHERE room_id = ? AND object_id = ?',
      [roomId, objectId]
    );

    if (existingObject) {
      return NextResponse.json({
        success: false,
        error: 'Objekt-ID bereits in diesem Raum vorhanden'
      }, { status: 409 });
    }

    // Prüfen ob Puzzle existiert (falls angegeben)
    if (puzzleId) {
      const puzzle = await executeQuerySingle(
        'SELECT puzzle_id FROM puzzles WHERE puzzle_id = ?',
        [puzzleId]
      );

      if (!puzzle) {
        return NextResponse.json({
          success: false,
          error: 'Puzzle nicht gefunden'
        }, { status: 404 });
      }
    }

    // Prüfen ob Exit-Raum existiert (falls angegeben)
    if (exitRoomId) {
      const exitRoom = await executeQuerySingle(
        'SELECT room_id FROM rooms WHERE room_id = ?',
        [exitRoomId]
      );

      if (!exitRoom) {
        return NextResponse.json({
          success: false,
          error: 'Exit-Raum nicht gefunden'
        }, { status: 404 });
      }
    }

    // Objekt erstellen
    await executeQuery(
      `INSERT INTO room_objects (
        room_id, object_id, name, description, object_type, x_position, y_position,
        width, height, icon, status, compatible_items, required_items,
        required_missions_completed, puzzle_id, exit_room_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        objectId,
        name,
        description || '',
        type,
        x || 50,
        y || 50,
        width || 10,
        height || 10,
        icon || 'Zap',
        status,
        JSON.stringify(compatibleItems),
        JSON.stringify(requiredItems),
        requiredMissionsCompleted,
        puzzleId || null,
        exitRoomId || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Objekt erfolgreich erstellt',
      objectId
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Objekts:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen des Objekts'
    }, { status: 500 });
  }
} 