import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle } from '@/lib/database';
import { toMySQLTimestamp } from '@/lib/utils';

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

    const body = await request.json();
    const { puzzleId, isCompleted, attempts, timeSpent, hintsUsed } = body;

    if (!puzzleId || isCompleted === undefined) {
      return NextResponse.json(
        { success: false, error: 'puzzleId und isCompleted sind erforderlich' },
        { status: 400 }
      );
    }

    // Rätsel-Daten abrufen
    const puzzle = await executeQuerySingle<{
      id: number;
      puzzle_id: string;
      // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
      // reward_exp: number;
      // reward_bitcoins: number;
      max_attempts: number;
    }>(
      'SELECT id, puzzle_id, max_attempts FROM puzzles WHERE puzzle_id = ?',
      [puzzleId]
    );

    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Rätsel nicht gefunden' },
        { status: 404 }
      );
    }

    // Aktuellen Fortschritt abrufen oder erstellen
    let progress = await executeQuerySingle<{
      id: number;
      is_completed: boolean;
      attempts: number;
      best_time_seconds: number | null;
      hints_used: number;
      completed_at: string | null;
    }>(
      'SELECT * FROM puzzle_progress WHERE user_id = ? AND puzzle_id = ?',
      [userId, puzzleId]
    );

    if (!progress) {
      // Neuen Fortschritt erstellen
      await executeQuery(
        'INSERT INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts, hints_used) VALUES (?, ?, ?, ?, ?)',
        [userId, puzzleId, isCompleted, attempts || 1, hintsUsed || 0]
      );
    } else {
      // Bestehenden Fortschritt aktualisieren
      const newAttempts = progress.attempts + (attempts || 1);
      const newHintsUsed = progress.hints_used + (hintsUsed || 0);
      
      // Beste Zeit nur aktualisieren, wenn Rätsel gelöst wurde und Zeit besser ist
      let bestTime = progress.best_time_seconds;
      if (isCompleted && timeSpent && (!bestTime || timeSpent < bestTime)) {
        bestTime = timeSpent;
      }

      await executeQuery(
        `UPDATE puzzle_progress 
         SET is_completed = ?, attempts = ?, hints_used = ?, 
             best_time_seconds = ?, completed_at = ?
         WHERE user_id = ? AND puzzle_id = ?`,
        [
          isCompleted || progress.is_completed,
          newAttempts,
          newHintsUsed,
          bestTime,
          isCompleted ? toMySQLTimestamp() : progress.completed_at,
          userId,
          puzzleId
        ]
      );
    }

    // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
    // Belohnungen vergeben, wenn Rätsel zum ersten Mal gelöst wurde
    // let rewards = null;
    // if (isCompleted && (!progress || !progress.is_completed)) {
    //   // Spieler-Statistiken aktualisieren
    //   await executeQuery(
    //     'UPDATE game_states SET experience_points = experience_points + ?, bitcoins = bitcoins + ? WHERE user_id = ?',
    //     [puzzle.reward_exp, puzzle.reward_bitcoins, userId]
    //   );

    //   // Level berechnen und aktualisieren
    //   const gameState = await executeQuerySingle<{
    //     experience_points: number;
    //     level: number;
    //   }>(
    //     'SELECT experience_points, level FROM game_states WHERE user_id = ?',
    //     [userId]
    //   );

    //   if (gameState) {
    //     const newLevel = Math.floor(gameState.experience_points / 100) + 1;
    //     if (newLevel > gameState.level) {
    //       await executeQuery(
    //         'UPDATE game_states SET level = ? WHERE user_id = ?',
    //         [newLevel, userId]
    //       );
    //     }
    //   }

    //   rewards = {
    //     exp: puzzle.reward_exp,
    //     bitcoins: puzzle.reward_bitcoins
    //   };
    // }

    // Aktualisierten Fortschritt zurückgeben
    const updatedProgress = await executeQuerySingle<{
      is_completed: boolean;
      attempts: number;
      best_time_seconds: number | null;
      completed_at: string | null;
      hints_used: number;
    }>(
      'SELECT is_completed, attempts, best_time_seconds, completed_at, hints_used FROM puzzle_progress WHERE user_id = ? AND puzzle_id = ?',
      [userId, puzzleId]
    );

    return NextResponse.json({
      success: true,
      progress: {
        puzzleId,
        isCompleted: updatedProgress?.is_completed || false,
        attempts: updatedProgress?.attempts || 0,
        bestTimeSeconds: updatedProgress?.best_time_seconds || null,
        completedAt: updatedProgress?.completed_at || null,
        hintsUsed: updatedProgress?.hints_used || 0
      }
      // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
      // rewards
    });

    } catch (error) {
      console.error('Fehler beim Speichern des Rätsel-Fortschritts:', error);
      return NextResponse.json(
        { success: false, error: 'Interner Server-Fehler' },
        { status: 500 }
      );
    }
  })(request);
} 