import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
  try {
    const { puzzleId } = await params;

    // Rätsel abrufen
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
      reward_money: number;
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

    // Rätsel-Daten abrufen
    const puzzleData = await executeQuery<{
      id: number;
      puzzle_id: string;
      data_type: string;
      data_key: string;
      data_value: string;
    }>(
      'SELECT * FROM puzzle_data WHERE puzzle_id = ? ORDER BY data_key',
      [puzzleId]
    );

    // Hinweise extrahieren
    const hints: string[] = [];
    puzzleData.forEach(row => {
      if (row.data_key.startsWith('hint_')) {
        try {
          const value = JSON.parse(row.data_value);
          if (value && typeof value === 'object' && value.text) {
            hints.push(value.text);
          } else if (typeof value === 'string') {
            hints.push(value);
          }
        } catch {
          // Fallback für nicht-JSON Werte
          hints.push(row.data_value);
        }
      }
    });

    // Fortschritt (für Debug-Zwecke immer leer)
    const progress = {
      isCompleted: false,
      attempts: 0,
      bestTimeSeconds: null,
      completedAt: null,
      hintsUsed: 0,
      completedQuestions: []
    };

    const formattedPuzzle = {
      puzzleId: puzzle.puzzle_id,
      roomId: puzzle.room_id,
      name: puzzle.name,
      description: puzzle.description,
      type: puzzle.puzzle_type,
      difficulty: puzzle.difficulty,
      solution: Array.isArray(puzzle.solution) ? puzzle.solution : JSON.parse(puzzle.solution || '[]'),
      hints: hints,
      maxAttempts: puzzle.max_attempts,
      timeLimitSeconds: puzzle.time_limit_seconds,
      rewardExp: puzzle.reward_exp,
      rewardItems: Array.isArray(puzzle.reward_items) ? puzzle.reward_items : JSON.parse(puzzle.reward_items || '[]'),
      isRequired: puzzle.is_required,
      isHidden: puzzle.is_hidden,
      progress: progress
    };

    return NextResponse.json({
      success: true,
      puzzle: formattedPuzzle
    });

  } catch (error) {
    console.error('Fehler beim Abrufen des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 