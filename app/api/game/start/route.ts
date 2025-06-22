import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeUpdate } from '@/lib/database';

/**
 * Neues Spiel starten
 * POST /api/game/start
 * 
 * Legt einen neuen Spielstand für den Nutzer an (Missions-ID auf 1, Start im ersten Raum)
 * und gibt initiale Raumdaten zurück.
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

      // Prüfen ob bereits ein Spielstand existiert
      const existingGameState = await executeQuerySingle<{ id: number }>(
        'SELECT id FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (existingGameState) {
        // Existierenden Spielstand auf Standardwerte zurücksetzen
        await executeUpdate(
          'UPDATE game_states SET current_room = ?, inventory = ?, progress = ?, bitcoins = ?, experience_points = ?, level = ?, current_mission = ? WHERE user_id = ?',
          ['intro', '[]', '{}', 0.00000000, 0, 1, 'mission_001', userId]
        );

        // Spieler-Statistiken zurücksetzen
        await executeUpdate(
          'UPDATE player_stats SET puzzles_solved = ?, rooms_visited = ?, total_bitcoins_earned = ?, total_exp_earned = ? WHERE user_id = ?',
          [0, 0, 0.00000000, 0, userId]
        );
      } else {
        // Neuen Spielstand erstellen
        await executeUpdate(
          'INSERT INTO game_states (user_id, current_room, inventory, progress, bitcoins, experience_points, level, current_mission) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, 'intro', '[]', '{}', 0.00000000, 0, 1, 'mission_001']
        );

        // Spieler-Statistiken erstellen
        await executeUpdate(
          'INSERT INTO player_stats (user_id, puzzles_solved, rooms_visited, total_bitcoins_earned, total_exp_earned) VALUES (?, ?, ?, ?, ?)',
          [userId, 0, 0, 0.00000000, 0]
        );
      }

      // Initiale Raumdaten für den ersten Raum (intro) zurückgeben
      const initialRoomData = {
        roomId: 'intro',
        roomName: 'Einleitung',
        description: 'Willkommen bei INTRUSION. Du bist ein angehender Hacker, der sich in die digitale Unterwelt wagt. Deine Mission beginnt hier...',
        exits: [
          {
            id: 'basement',
            name: 'Keller',
            description: 'Ein dunkler Keller mit Computerausrüstung'
          }
        ],
        items: [],
        npcs: [],
        puzzles: [],
        background: '/images/rooms/intro.jpg',
        ambient: '/sounds/ambient/cyberpunk.mp3'
      };

      // Aktualisierten Spielstand zurückgeben
      const updatedGameState = {
        currentRoom: 'intro',
        inventory: [],
        progress: {},
        bitcoins: 0.00000000,
        experiencePoints: 0,
        level: 1,
        currentMission: 'mission_001'
      };

      return NextResponse.json({
        success: true,
        message: 'Neues Spiel erfolgreich gestartet',
        gameState: updatedGameState,
        roomData: initialRoomData
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Starten eines neuen Spiels:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Serverfehler'
      }, { status: 500 });
    }
  })(request);
} 