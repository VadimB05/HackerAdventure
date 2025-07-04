import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle } from '@/lib/database';

export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

    console.log(`Progress-API aufgerufen für User: ${userId}`);

    // Prüfen ob User existiert
    const userExists = await executeQuerySingle<{ id: number }>(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (!userExists) {
      console.log(`User ${userId} nicht gefunden`);
      return NextResponse.json(
        { success: false, error: `User ${userId} nicht gefunden` },
        { status: 404 }
      );
    }

    // Spieler-Status abrufen
    const gameState = await executeQuerySingle<{
      current_room: string;
      current_mission: string | null;
      bitcoins: number;
      experience_points: number;
      level: number;
      inventory: string;
    }>(
      'SELECT current_room, current_mission, bitcoins, experience_points, level, inventory FROM game_states WHERE user_id = ?',
      [userId]
    );

    if (!gameState) {
      console.log(`Game-State für User ${userId} nicht gefunden - erstelle Standard-Werte`);
      
      // Standard-Game-State erstellen
      await executeQuery(
        'INSERT INTO game_states (user_id, current_room, bitcoins, experience_points, level) VALUES (?, ?, ?, ?, ?)',
        [userId, 'intro', 0.25, 0, 1]
      );

      // Standard-Game-State nochmal abrufen
      const newGameState = await executeQuerySingle<{
        current_room: string;
        current_mission: string | null;
        bitcoins: number;
        experience_points: number;
        level: number;
        inventory: string;
      }>(
        'SELECT current_room, current_mission, bitcoins, experience_points, level, inventory FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (!newGameState) {
        return NextResponse.json(
          { success: false, error: 'Konnte Game-State nicht erstellen' },
          { status: 500 }
        );
      }

      // Standard-Response mit neuem Game-State
      return NextResponse.json({
        success: true,
        progress: {
          userId,
          currentRoom: newGameState.current_room,
          currentMission: newGameState.current_mission,
          bitcoins: parseFloat(newGameState.bitcoins.toString()),
          experiencePoints: newGameState.experience_points,
          level: newGameState.level,
          puzzleProgress: [],
          missionProgress: [],
          inventory: []
        }
      });
    }

    // Rätsel-Fortschritt abrufen
    const puzzleProgress = await executeQuery<{
      puzzle_id: string;
      is_completed: boolean;
      attempts: number;
      best_time_seconds: number | null;
      completed_at: string | null;
      hints_used: number;
    }>(
      'SELECT puzzle_id, is_completed, attempts, best_time_seconds, completed_at, hints_used FROM puzzle_progress WHERE user_id = ?',
      [userId]
    );

    // Mission-Fortschritt abrufen
    const missionProgress = await executeQuery<{
      mission_id: string;
      is_completed: boolean;
      completed_at: string | null;
    }>(
      'SELECT mission_id, is_completed, completed_at FROM mission_progress WHERE user_id = ?',
      [userId]
    );

    // Inventar abrufen
    const inventory = await executeQuery<{
      item_id: string;
      quantity: number;
    }>(
      'SELECT item_id, quantity FROM player_inventory WHERE user_id = ?',
      [userId]
    );

    // Inventar-Array erstellen
    const inventoryArray = inventory.map(item => item.item_id);

    console.log(`Progress erfolgreich abgerufen für User ${userId}`);

    return NextResponse.json({
      success: true,
      progress: {
        userId,
        currentRoom: gameState.current_room,
        currentMission: gameState.current_mission,
        bitcoins: parseFloat(gameState.bitcoins.toString()),
        experiencePoints: gameState.experience_points,
        level: gameState.level,
        puzzleProgress: puzzleProgress.map(p => ({
          puzzleId: p.puzzle_id,
          isCompleted: p.is_completed,
          attempts: p.attempts,
          bestTimeSeconds: p.best_time_seconds,
          completedAt: p.completed_at,
          hintsUsed: p.hints_used
        })),
        missionProgress: missionProgress.map(m => ({
          missionId: m.mission_id,
          isCompleted: m.is_completed,
          completedAt: m.completed_at,
          puzzlesCompleted: [], // TODO: Aus puzzle_progress ableiten
          roomsVisited: [] // TODO: Aus room_visits ableiten
        })),
        inventory: inventoryArray
      }
    });

    } catch (error) {
      console.error('Fehler beim Abrufen des Spieler-Fortschritts:', error);
      return NextResponse.json(
        { success: false, error: `Interner Server-Fehler: ${error}` },
        { status: 500 }
      );
    }
  })(request);
} 