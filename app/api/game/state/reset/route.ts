import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeUpdate } from '@/lib/database';

/**
 * Spielstand zurücksetzen (Neues Spiel)
 * POST /api/game/state/reset
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

      // Spielstand auf Standardwerte zurücksetzen
      await executeUpdate(
        'UPDATE game_states SET current_room = ?, inventory = ?, progress = ?, money = ?, experience_points = ?, level = ?, current_mission = ? WHERE user_id = ?',
        ['intro', '[]', '{}', 0.00, 0, 1, 'mission_001', userId]
      );

      // Spieler-Statistiken zurücksetzen
      await executeUpdate(
        'UPDATE player_stats SET puzzles_solved = ?, rooms_visited = ?, total_money_earned = ?, total_exp_earned = ? WHERE user_id = ?',
        [0, 0, 0.00, 0, userId]
      );

      return NextResponse.json({
        success: true,
        message: 'Spielstand erfolgreich zurückgesetzt'
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Spielstands:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Serverfehler'
      }, { status: 500 });
    }
  })(request);
} 