import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeUpdate, executeQuery } from '@/lib/database';

/**
 * Spielstand abrufen
 * GET /api/game/state
 * 
 * Liefert den zuletzt gespeicherten Fortschritt des angemeldeten Nutzers:
 * - Aktuelle Mission/Raum
 * - Inventar
 * - Gelöste Rätsel
 * - Spieler-Statistiken
 * - Raumdaten
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

      // Spielstand aus Datenbank abrufen
      const gameState = await executeQuerySingle<{
        current_room: string;
        inventory: string;
        progress: string;
        bitcoins: number;
        experience_points: number;
        level: number;
        current_mission: string | null;
      }>(
        'SELECT current_room, inventory, progress, bitcoins, experience_points, level, current_mission FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (!gameState) {
        return NextResponse.json({
          success: false,
          error: 'Spielstand nicht gefunden'
        }, { status: 404 });
      }

      // Spieler-Statistiken abrufen
      const playerStats = await executeQuerySingle<{
        puzzles_solved: number;
        rooms_visited: number;
        missions_completed: number;
        total_bitcoins_earned: number;
        total_exp_earned: number;
        play_time_minutes: number;
      }>(
        'SELECT puzzles_solved, rooms_visited, missions_completed, total_bitcoins_earned, total_exp_earned, play_time_minutes FROM player_stats WHERE user_id = ?',
        [userId]
      );

      // Gelöste Rätsel abrufen
      const solvedPuzzles = await executeQuery<{
        puzzle_id: string;
        is_completed: boolean;
        completed_at: string;
        attempts: number;
        best_time_seconds: number | null;
      }>(
        'SELECT puzzle_id, is_completed, completed_at, attempts, best_time_seconds FROM puzzle_progress WHERE user_id = ? AND is_completed = true',
        [userId]
      );

      // Aktuelle Raumdaten abrufen
      const currentRoomData = await executeQuerySingle<{
        room_id: string;
        name: string;
        description: string;
        background_image: string;
        ambient_sound: string;
        connections: string;
        required_level: number;
        is_locked: boolean;
      }>(
        'SELECT room_id, name, description, background_image, ambient_sound, connections, required_level, is_locked FROM rooms WHERE room_id = ?',
        [gameState.current_room]
      );

      // Missiondaten abrufen (falls vorhanden)
      let missionData = null;
      if (gameState.current_mission) {
        missionData = await executeQuerySingle<{
          mission_id: string;
          name: string;
          description: string;
          difficulty: number;
          required_level: number;
          reward_bitcoins: number;
          reward_exp: number;
        }>(
          'SELECT mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp FROM missions WHERE mission_id = ?',
          [gameState.current_mission]
        );
      }

      // JSON-Strings parsen
      const parsedGameState = {
        currentRoom: gameState.current_room,
        inventory: JSON.parse(gameState.inventory || '[]'),
        progress: JSON.parse(gameState.progress || '{}'),
        bitcoins: gameState.bitcoins,
        experiencePoints: gameState.experience_points,
        level: gameState.level,
        currentMission: gameState.current_mission
      };

      // Raumdaten parsen
      const parsedRoomData = currentRoomData ? {
        roomId: currentRoomData.room_id,
        name: currentRoomData.name,
        description: currentRoomData.description,
        backgroundImage: currentRoomData.background_image,
        ambientSound: currentRoomData.ambient_sound,
        connections: JSON.parse(currentRoomData.connections || '{}'),
        requiredLevel: currentRoomData.required_level,
        isLocked: currentRoomData.is_locked
      } : null;

      // Gelöste Rätsel formatieren
      const solvedPuzzleIds = solvedPuzzles.map(puzzle => ({
        puzzleId: puzzle.puzzle_id,
        completedAt: puzzle.completed_at,
        attempts: puzzle.attempts,
        bestTimeSeconds: puzzle.best_time_seconds
      }));

      // Spieler-Statistiken formatieren
      const formattedStats = playerStats ? {
        puzzlesSolved: playerStats.puzzles_solved,
        roomsVisited: playerStats.rooms_visited,
        missionsCompleted: playerStats.missions_completed,
        totalBitcoinsEarned: playerStats.total_bitcoins_earned,
        totalExpEarned: playerStats.total_exp_earned,
        playTimeMinutes: playerStats.play_time_minutes
      } : {
        puzzlesSolved: 0,
        roomsVisited: 0,
        missionsCompleted: 0,
        totalBitcoinsEarned: 0,
        totalExpEarned: 0,
        playTimeMinutes: 0
      };

      return NextResponse.json({
        success: true,
        gameState: parsedGameState,
        roomData: parsedRoomData,
        missionData: missionData,
        solvedPuzzles: solvedPuzzleIds,
        playerStats: formattedStats,
        hasGameProgress: gameState.current_room !== 'intro' || 
                        gameState.experience_points > 0 || 
                        gameState.level > 1 ||
                        solvedPuzzles.length > 0
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Abrufen des Spielstands:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Serverfehler'
      }, { status: 500 });
    }
  })(request);
}

/**
 * Spielstand aktualisieren
 * PUT /api/game/state
 */
export async function PUT(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { currentRoom, inventory, progress, bitcoins, experiencePoints, level, currentMission } = await request.json();

      await executeUpdate(
        'UPDATE game_states SET current_room = ?, inventory = ?, progress = ?, bitcoins = ?, experience_points = ?, level = ?, current_mission = ? WHERE user_id = ?',
        [
          currentRoom,
          JSON.stringify(inventory || []),
          JSON.stringify(progress || {}),
          bitcoins || 0,
          experiencePoints || 0,
          level || 1,
          currentMission || null,
          userId
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Spielstand erfolgreich aktualisiert'
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Aktualisieren des Spielstands:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Serverfehler'
      }, { status: 500 });
    }
  })(request);
} 