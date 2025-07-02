import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle } from '@/lib/database';
import { getUploadUrl } from '@/lib/utils';

/**
 * Alle verfügbaren Räume abrufen
 * GET /api/game/rooms
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

      console.log(`[DEBUG] Lade alle Räume für User: ${userId}`);

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

      // Alle Räume aus der Datenbank laden
      const rooms = await executeQuery<{
        room_id: string;
        name: string;
        description: string;
        background_image: string;
        is_locked: boolean;
        required_level: number;
        mission_id: string;
      }>(
        'SELECT room_id, name, description, background_image, is_locked, required_level, mission_id FROM rooms ORDER BY room_id',
        []
      );

      // Räume mit Verfügbarkeits-Status formatieren
      const formattedRooms = rooms.map(room => {
        const isUnlocked = !room.is_locked || gameState.level >= room.required_level;
        
        return {
          id: room.room_id,
          name: room.name,
          description: room.description,
          backgroundImage: getUploadUrl(room.background_image),
          isLocked: !isUnlocked,
          requiredLevel: room.required_level,
          missionId: room.mission_id,
          isCurrentRoom: room.room_id === gameState.current_room
        };
      });

      console.log(`[DEBUG] ${formattedRooms.length} Räume geladen für User Level ${gameState.level}`);

      return NextResponse.json({
        success: true,
        rooms: formattedRooms,
        count: formattedRooms.length,
        currentRoom: gameState.current_room,
        playerLevel: gameState.level
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Abrufen der Räume:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 