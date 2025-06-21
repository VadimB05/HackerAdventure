import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { puzzleId: string } }
) {
  try {
    const puzzleId = params.puzzleId;

    // Rätsel-Daten abrufen
    const puzzleQuery = `
      SELECT 
        p.id,
        p.puzzle_id,
        p.room_id,
        p.name,
        p.description,
        p.puzzle_type,
        p.difficulty,
        p.solution,
        p.hints,
        p.max_attempts,
        p.time_limit_seconds,
        p.reward_exp,
        p.is_required,
        p.created_at,
        p.updated_at
      FROM puzzles p
      WHERE p.puzzle_id = ?
    `;

    const puzzleResult = await executeQuery(puzzleQuery, [puzzleId]);
    
    if (!puzzleResult || puzzleResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rätsel nicht gefunden' },
        { status: 404 }
      );
    }

    const puzzle = puzzleResult[0];

    // Hinweise aus puzzle_data abrufen
    const hintsQuery = `
      SELECT data_value
      FROM puzzle_data
      WHERE puzzle_id = ? AND data_type = 'terminal' AND data_key LIKE 'hint_%'
      ORDER BY data_key
    `;

    const hintsResult = await executeQuery(hintsQuery, [puzzleId]);
    const hints = hintsResult.map((row: any) => {
      try {
        const parsed = JSON.parse(row.data_value);
        return parsed.text || parsed;
      } catch {
        return row.data_value;
      }
    });

    // Lösung aus dem solution-Feld der puzzles-Tabelle
    let solution: any = null;
    try {
      solution = JSON.parse(puzzle.solution);
    } catch {
      solution = puzzle.solution;
    }

    // Fortschritt (Mock - da keine Authentifizierung)
    const progress = {
      attempts: 0,
      isCompleted: false,
      completedAt: null
    };

    // Rätsel-Daten zusammenstellen
    const puzzleData = {
      id: puzzle.puzzle_id,
      name: puzzle.name,
      description: puzzle.description,
      type: puzzle.puzzle_type,
      difficulty: puzzle.difficulty,
      maxAttempts: puzzle.max_attempts,
      timeLimitSeconds: puzzle.time_limit_seconds,
      rewardExp: puzzle.reward_exp,
      isRequired: puzzle.is_required,
      hints,
      solution,
      progress
    };

    return NextResponse.json({
      success: true,
      puzzle: puzzleData
    });

  } catch (error) {
    console.error('Fehler beim Abrufen des Rätsels:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 