import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle } from '@/lib/database';

/**
 * Spezifischen Raum abrufen
 * GET /api/game/rooms/[roomId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { roomId } = await params;

      console.log(`[DEBUG] Lade Raum: ${roomId} für User: ${userId}`);

      // Raum-Details aus der Datenbank laden
      const room = await executeQuerySingle<{
        room_id: string;
        name: string;
        description: string;
        background_image: string;
        is_locked: boolean;
        required_level: number;
        connections: string;
        mission_id: string;
      }>(
        'SELECT room_id, name, description, background_image, is_locked, required_level, connections, mission_id FROM rooms WHERE room_id = ?',
        [roomId]
      );

      if (!room) {
        console.log(`[DEBUG] Raum nicht gefunden: ${roomId}`);
        return NextResponse.json({
          success: false,
          error: 'Raum nicht gefunden'
        }, { status: 404 });
      }

      // Spieler-Status abrufen für Level-Prüfung
      const gameState = await executeQuerySingle<{
        level: number;
        current_room: string;
      }>(
        'SELECT level, current_room FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (!gameState) {
        return NextResponse.json({
          success: false,
          error: 'Spieler-Status nicht gefunden'
        }, { status: 404 });
      }

      // Level-Anforderung prüfen
      const isUnlocked = !room.is_locked || gameState.level >= room.required_level;

      // Raum-Objekte aus der Datenbank laden
      const roomObjects = await executeQuery<{
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
        puzzle_id: string | null;
        exit_room_id: string | null;
      }>(
        'SELECT * FROM room_objects WHERE room_id = ? ORDER BY object_id',
        [roomId]
      );

      // Rätsel im Raum laden
      const puzzles = await executeQuery<{
        puzzle_id: string;
        name: string;
        description: string;
        puzzle_type: string;
        difficulty: number;
        is_required: boolean;
      }>(
        'SELECT puzzle_id, name, description, puzzle_type, difficulty, is_required FROM puzzles WHERE room_id = ? ORDER BY id',
        [roomId]
      );

      // Rätsel-Fortschritt für den Spieler laden
      const puzzleProgress = await executeQuery<{
        puzzle_id: string;
        is_completed: boolean;
        attempts: number;
      }>(
        'SELECT puzzle_id, is_completed, attempts FROM puzzle_progress WHERE user_id = ? AND puzzle_id IN (SELECT puzzle_id FROM puzzles WHERE room_id = ?)',
        [userId, roomId]
      );

      // Progress-Map erstellen
      const progressMap = new Map();
      puzzleProgress.forEach(p => {
        progressMap.set(p.puzzle_id, {
          isCompleted: p.is_completed,
          attempts: p.attempts
        });
      });

      // Rätsel mit Fortschritt kombinieren
      const puzzlesWithProgress = puzzles.map(puzzle => ({
        ...puzzle,
        progress: progressMap.get(puzzle.puzzle_id) || { isCompleted: false, attempts: 0 }
      }));

      // Verbindungen parsen
      let connections = {};
      try {
        connections = JSON.parse(room.connections || '{}');
      } catch (error) {
        console.error('Fehler beim Parsen der Raum-Verbindungen:', error);
        connections = {};
      }

      // Raum-Objekte formatieren
      const formattedObjects = roomObjects.map(obj => {
        let compatibleItems = [];
        let requiredItems = [];
        
        try {
          compatibleItems = JSON.parse(obj.compatible_items || '[]');
          requiredItems = JSON.parse(obj.required_items || '[]');
        } catch (error) {
          console.error('Fehler beim Parsen der Item-Listen:', error);
        }

        return {
          id: obj.object_id,
          name: obj.name,
          description: obj.description,
          type: obj.object_type,
          x: obj.x_position,
          y: obj.y_position,
          width: obj.width,
          height: obj.height,
          icon: obj.icon,
          status: obj.status,
          compatibleItems,
          requiredItems,
          puzzleId: obj.puzzle_id,
          exitRoomId: obj.exit_room_id
        };
      });

      const backgroundPath = room.background_image ? `/${room.background_image}` : '/room-bedroom.png';
      
      const roomData = {
        id: room.room_id,
        name: room.name,
        description: room.description,
        background: backgroundPath,
        isLocked: !isUnlocked,
        requiredLevel: room.required_level,
        missionId: room.mission_id,
        connections,
        objects: formattedObjects,
        puzzles: puzzlesWithProgress
      };

      console.log(`[DEBUG] Raum ${roomId} - Background: ${backgroundPath}`);

      console.log(`[DEBUG] Raum geladen: ${roomId}, Objekte: ${formattedObjects.length}, Rätsel: ${puzzlesWithProgress.length}`);

      return NextResponse.json({
        success: true,
        room: roomData
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Abrufen des Raums:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 