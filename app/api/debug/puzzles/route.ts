import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId') || 'bedroom';

    // Alle Rätsel im Raum abrufen (ohne Level-Prüfung)
    const puzzles = await executeQuery<{
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
      'SELECT * FROM puzzles WHERE room_id = ? ORDER BY is_required DESC, difficulty ASC',
      [roomId]
    );

    // Rätsel-Daten abrufen
    const puzzleData = await executeQuery<{
      id: number;
      puzzle_id: string;
      data_type: string;
      data_key: string;
      data_value: string;
    }>(
      'SELECT * FROM puzzle_data WHERE puzzle_id IN (SELECT puzzle_id FROM puzzles WHERE room_id = ?) ORDER BY puzzle_id, data_key',
      [roomId]
    );

    // Rätsel mit Daten formatieren
    const formattedPuzzles = puzzles.map(puzzle => {
      const data = puzzleData.filter(pd => pd.puzzle_id === puzzle.puzzle_id);
      
      // Fragen extrahieren
      const questions: any[] = [];
      const questionMap = new Map<number, any>();

      data.forEach(row => {
        if (row.data_key.startsWith('question_')) {
          const questionId = parseInt(row.data_key.split('_')[1]);
          if (!questionMap.has(questionId)) {
            questionMap.set(questionId, {
              id: questionId,
              question: '',
              options: [],
              correct_answer: '',
              explanation: ''
            });
          }
        }
      });

      // Daten zu Fragen zuordnen
      data.forEach(row => {
        const parts = row.data_key.split('_');
        if (parts.length >= 2) {
          const questionId = parseInt(parts[1]);
          const dataType = parts[0];
          const question = questionMap.get(questionId);
          
          if (question) {
            try {
              const value = JSON.parse(row.data_value);
              switch (dataType) {
                case 'question':
                  question.question = value;
                  break;
                case 'options':
                  question.options = value;
                  break;
                case 'correct':
                  question.correct_answer = value;
                  break;
                case 'explanation':
                  question.explanation = value;
                  break;
              }
            } catch {
              // Fallback für nicht-JSON Werte
              const value = row.data_value;
              switch (dataType) {
                case 'question':
                  question.question = value;
                  break;
                case 'correct':
                  question.correct_answer = value;
                  break;
                case 'explanation':
                  question.explanation = value;
                  break;
              }
            }
          }
        }
      });

      questions.push(...Array.from(questionMap.values()).sort((a, b) => a.id - b.id));

      return {
        puzzleId: puzzle.puzzle_id,
        roomId: puzzle.room_id,
        name: puzzle.name,
        description: puzzle.description,
        type: puzzle.puzzle_type,
        difficulty: puzzle.difficulty,
        questions: questions,
        hints: JSON.parse(puzzle.hints || '[]'),
        maxAttempts: puzzle.max_attempts,
        timeLimitSeconds: puzzle.time_limit_seconds,
        rewardExp: puzzle.reward_exp,
        rewardItems: JSON.parse(puzzle.reward_items || '[]'),
        isRequired: puzzle.is_required,
        isHidden: puzzle.is_hidden,
        dataCount: data.length
      };
    });

    return NextResponse.json({
      success: true,
      roomId,
      puzzles: formattedPuzzles,
      totalPuzzles: puzzles.length,
      totalDataEntries: puzzleData.length
    });

  } catch (error) {
    console.error('Fehler beim Debug-Abruf der Rätsel:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 