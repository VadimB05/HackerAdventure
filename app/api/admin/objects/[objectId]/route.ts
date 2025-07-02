import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/database';

/**
 * Einzelnes Raum-Objekt abrufen
 * GET /api/admin/objects/[objectId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ objectId: string }> }
) {
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

    const { objectId } = await params;
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({
        success: false,
        error: 'roomId Parameter ist erforderlich'
      }, { status: 400 });
    }

    // Objekt abrufen
    const object = await executeQuerySingle<{
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
      WHERE ro.room_id = ? AND ro.object_id = ?`,
      [roomId, objectId]
    );

    if (!object) {
      return NextResponse.json({
        success: false,
        error: 'Objekt nicht gefunden'
      }, { status: 404 });
    }

    const objectResponse = {
      id: object.object_id,
      roomId: object.room_id,
      roomName: object.room_name,
      name: object.name,
      description: object.description,
      type: object.object_type,
      x: object.x_position,
      y: object.y_position,
      width: object.width,
      height: object.height,
      icon: object.icon,
      status: object.status,
      compatibleItems: JSON.parse(object.compatible_items || '[]'),
      requiredItems: JSON.parse(object.required_items || '[]'),
      requiredMissionsCompleted: object.required_missions_completed,
      puzzleId: object.puzzle_id,
      puzzleName: object.puzzle_name,
      exitRoomId: object.exit_room_id,
      exitRoomName: object.exit_room_name,
      createdAt: object.created_at,
      updatedAt: object.updated_at
    };

    return NextResponse.json({
      success: true,
      object: objectResponse
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Objekts:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen des Objekts'
    }, { status: 500 });
  }
}

/**
 * Raum-Objekt aktualisieren
 * PUT /api/admin/objects/[objectId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ objectId: string }> }
) {
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

    const { objectId } = await params;
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const body = await request.json();

    if (!roomId) {
      return NextResponse.json({
        success: false,
        error: 'roomId Parameter ist erforderlich'
      }, { status: 400 });
    }

    const {
      name,
      description,
      type,
      x,
      y,
      width,
      height,
      icon,
      status,
      compatibleItems,
      requiredItems,
      requiredMissionsCompleted,
      puzzleId,
      exitRoomId
    } = body;

    // Prüfen ob Objekt existiert
    const existingObject = await executeQuerySingle(
      'SELECT object_id FROM room_objects WHERE room_id = ? AND object_id = ?',
      [roomId, objectId]
    );

    if (!existingObject) {
      return NextResponse.json({
        success: false,
        error: 'Objekt nicht gefunden'
      }, { status: 404 });
    }

    // Prüfen ob Puzzle existiert (falls geändert)
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

    // Prüfen ob Exit-Raum existiert (falls geändert)
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

    // Objekt aktualisieren
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (type !== undefined) {
      updateFields.push('object_type = ?');
      updateValues.push(type);
    }
    if (x !== undefined) {
      updateFields.push('x_position = ?');
      updateValues.push(x);
    }
    if (y !== undefined) {
      updateFields.push('y_position = ?');
      updateValues.push(y);
    }
    if (width !== undefined) {
      updateFields.push('width = ?');
      updateValues.push(width);
    }
    if (height !== undefined) {
      updateFields.push('height = ?');
      updateValues.push(height);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (compatibleItems !== undefined) {
      updateFields.push('compatible_items = ?');
      updateValues.push(JSON.stringify(compatibleItems));
    }
    if (requiredItems !== undefined) {
      updateFields.push('required_items = ?');
      updateValues.push(JSON.stringify(requiredItems));
    }
    if (requiredMissionsCompleted !== undefined) {
      updateFields.push('required_missions_completed = ?');
      updateValues.push(requiredMissionsCompleted);
    }
    if (puzzleId !== undefined) {
      updateFields.push('puzzle_id = ?');
      updateValues.push(puzzleId || null);
    }
    if (exitRoomId !== undefined) {
      updateFields.push('exit_room_id = ?');
      updateValues.push(exitRoomId || null);
    }

    if (updateFields.length > 0) {
      updateValues.push(roomId, objectId);
      await executeQuery(
        `UPDATE room_objects SET ${updateFields.join(', ')} WHERE room_id = ? AND object_id = ?`,
        updateValues
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Objekt erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Objekts:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren des Objekts'
    }, { status: 500 });
  }
}

/**
 * Raum-Objekt löschen
 * DELETE /api/admin/objects/[objectId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ objectId: string }> }
) {
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

    const { objectId } = await params;
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({
        success: false,
        error: 'roomId Parameter ist erforderlich'
      }, { status: 400 });
    }

    // Prüfen ob Objekt existiert
    const existingObject = await executeQuerySingle(
      'SELECT object_id FROM room_objects WHERE room_id = ? AND object_id = ?',
      [roomId, objectId]
    );

    if (!existingObject) {
      return NextResponse.json({
        success: false,
        error: 'Objekt nicht gefunden'
      }, { status: 404 });
    }

    // Objekt löschen
    await executeQuery(
      'DELETE FROM room_objects WHERE room_id = ? AND object_id = ?',
      [roomId, objectId]
    );

    return NextResponse.json({
      success: true,
      message: 'Objekt erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Objekts:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Löschen des Objekts'
    }, { status: 500 });
  }
} 