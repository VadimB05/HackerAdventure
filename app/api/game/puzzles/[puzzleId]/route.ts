import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { puzzleId } = await params;

      if (!puzzleId) {
        return NextResponse.json({
          success: false,
          error: 'puzzleId ist erforderlich'
        }, { status: 400 });
      }

      // Rätsel-Grunddaten abrufen
      const puzzle = await executeQuerySingle<{
        id: number;
        puzzle_id: string;
        room_id: string;
        name: string;
        description: string;
        puzzle_type: string;
        difficulty: number;
        solution: string;
        hints: string;
        max_attempts: number;
        time_limit_seconds: number | null;
        reward_bitcoins: number;
        reward_exp: number;
        reward_items: string;
        is_required: boolean;
        is_hidden: boolean;
      }>(
        'SELECT * FROM puzzles WHERE puzzle_id = ?',
        [puzzleId]
      );

      if (!puzzle) {
        return NextResponse.json({
          success: false,
          error: 'Rätsel nicht gefunden'
        }, { status: 404 });
      }

      // Rätsel-spezifische Daten abrufen
      const puzzleData = await executeQuery<{
        id: number;
        data_type: string;
        data_key: string;
        data_value: string;
      }>(
        'SELECT * FROM puzzle_data WHERE puzzle_id = ? ORDER BY data_type, data_key',
        [puzzleId]
      );

      // Spieler-Fortschritt abrufen
      const progress = await executeQuerySingle<{
        is_completed: boolean;
        attempts: number;
        best_time_seconds: number | null;
        completed_at: string | null;
        hints_used: number;
      }>(
        'SELECT is_completed, attempts, best_time_seconds, completed_at, hints_used FROM puzzle_progress WHERE user_id = ? AND puzzle_id = ?',
        [userId, puzzleId]
      );

      // Rätsel-spezifische Daten strukturieren
      const structuredData: any = {};
      puzzleData.forEach(row => {
        if (!structuredData[row.data_type]) {
          structuredData[row.data_type] = {};
        }
        try {
          structuredData[row.data_type][row.data_key] = JSON.parse(row.data_value);
        } catch {
          structuredData[row.data_type][row.data_key] = row.data_value;
        }
      });

      // Rätsel-Response zusammenstellen
      const puzzleResponse = {
        puzzleId: puzzle.puzzle_id,
        roomId: puzzle.room_id,
        name: puzzle.name,
        description: puzzle.description,
        type: puzzle.puzzle_type,
        difficulty: puzzle.difficulty,
        solution: JSON.parse(puzzle.solution),
        hints: JSON.parse(puzzle.hints || '[]'),
        maxAttempts: puzzle.max_attempts,
        timeLimitSeconds: puzzle.time_limit_seconds,
        rewardBitcoins: puzzle.reward_bitcoins,
        rewardExp: puzzle.reward_exp,
        rewardItems: JSON.parse(puzzle.reward_items || '[]'),
        isRequired: puzzle.is_required,
        isHidden: puzzle.is_hidden,
        data: structuredData,
        progress: progress ? {
          isCompleted: progress.is_completed,
          attempts: progress.attempts,
          bestTimeSeconds: progress.best_time_seconds,
          completedAt: progress.completed_at,
          hintsUsed: progress.hints_used
        } : {
          isCompleted: false,
          attempts: 0,
          bestTimeSeconds: null,
          completedAt: null,
          hintsUsed: 0
        }
      };

      return NextResponse.json({
        success: true,
        puzzle: puzzleResponse
      });

    } catch (error) {
      console.error('Fehler beim Abrufen des Rätsels:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 