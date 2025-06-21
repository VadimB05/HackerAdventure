import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puzzleId, questionId, answer, timeSpent } = body;

    if (!puzzleId || answer === undefined) {
      return NextResponse.json({
        success: false,
        error: 'puzzleId und answer sind erforderlich'
      }, { status: 400 });
    }

    // Rätsel abrufen
    const puzzle = await executeQuerySingle<{
      id: number;
      puzzle_id: string;
      room_id: string;
      name: string;
      puzzle_type: string;
      difficulty: number;
      solution: string;
      max_attempts: number;
      time_limit_seconds: number | null;
      reward_exp: number;
      reward_items: string;
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

    // Lösung aus dem Rätsel extrahieren
    let correctAnswer = '';
    try {
      const solution = Array.isArray(puzzle.solution) ? puzzle.solution : JSON.parse(puzzle.solution || '[]');
      correctAnswer = Array.isArray(solution) ? solution[0] : solution;
    } catch {
      correctAnswer = puzzle.solution || '';
    }

    // Antwort validieren
    const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();
    const validationMessage = isCorrect ? 'Richtige Antwort!' : 'Falsche Antwort';

    // Für Code-Rätsel: Rätsel ist gelöst, wenn die Antwort richtig ist
    const allCompleted = isCorrect;

    // Belohnungen nur bei vollständiger Lösung
    let rewards = null;
    if (allCompleted) {
      rewards = {
        exp: puzzle.reward_exp,
        items: Array.isArray(puzzle.reward_items) ? puzzle.reward_items : JSON.parse(puzzle.reward_items || '[]')
      };
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      message: validationMessage,
      attempts: 1, // Debug: Immer 1 Versuch
      maxAttempts: puzzle.max_attempts,
      completedQuestions: isCorrect ? ['1'] : [],
      totalQuestions: 1, // Code-Rätsel haben nur eine "Frage"
      allCompleted,
      rewards
    });

  } catch (error) {
    console.error('Fehler beim Lösen des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
} 