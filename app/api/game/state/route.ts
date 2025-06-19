import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeUpdate } from '@/lib/database';

/**
 * Spielstand abrufen
 * GET /api/game/state
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
        money: number;
        experience_points: number;
        level: number;
      }>(
        'SELECT current_room, inventory, progress, money, experience_points, level FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (!gameState) {
        return NextResponse.json({
          success: false,
          error: 'Spielstand nicht gefunden'
        }, { status: 404 });
      }

      // JSON-Strings parsen
      const parsedGameState = {
        currentRoom: gameState.current_room,
        inventory: JSON.parse(gameState.inventory || '[]'),
        progress: JSON.parse(gameState.progress || '{}'),
        money: gameState.money,
        experiencePoints: gameState.experience_points,
        level: gameState.level
      };

      return NextResponse.json({
        success: true,
        gameState: parsedGameState
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
      const { currentRoom, inventory, progress, money, experiencePoints, level } = await request.json();

      await executeUpdate(
        'UPDATE game_states SET current_room = ?, inventory = ?, progress = ?, money = ?, experience_points = ?, level = ? WHERE user_id = ?',
        [
          currentRoom,
          JSON.stringify(inventory || []),
          JSON.stringify(progress || {}),
          money || 0,
          experiencePoints || 0,
          level || 1,
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