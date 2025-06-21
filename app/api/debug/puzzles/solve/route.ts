import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puzzleId, questionId, answer, timeSpent } = body;

    if (!puzzleId || !questionId || answer === undefined) {
      return NextResponse.json({
        success: false,
        error: 'puzzleId, questionId und answer sind erforderlich'
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

    // Spezifische Frage abrufen
    const questionData = await executeQuery<{
      data_type: string;
      data_key: string;
      data_value: string;
    }>(
      'SELECT * FROM puzzle_data WHERE puzzle_id = ? AND data_key LIKE ?',
      [puzzleId, `%_${questionId}`]
    );

    // Frage-Daten strukturieren
    const question: any = {
      id: parseInt(questionId),
      question: '',
      options: [],
      correct_answer: '',
      explanation: ''
    };

    questionData.forEach(row => {
      const parts = row.data_key.split('_');
      if (parts.length >= 2) {
        const dataType = parts[0];
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
    });

    // Antwort validieren
    const isCorrect = answer.toLowerCase() === question.correct_answer?.toLowerCase();
    const validationMessage = isCorrect ? 'Richtige Antwort!' : 'Falsche Antwort';

    // Alle Fragen des Rätsels abrufen um zu prüfen ob alle gelöst sind
    const allQuestions = await executeQuery<{
      data_key: string;
    }>(
      'SELECT DISTINCT data_key FROM puzzle_data WHERE puzzle_id = ? AND data_key LIKE "question_%"',
      [puzzleId]
    );

    const totalQuestions = allQuestions.length;
    
    // Bereits gelöste Fragen aus der Session abrufen (für Debug-Zwecke)
    // In einer vollständigen Implementierung würden wir das in der Datenbank speichern
    const completedQuestions = isCorrect ? [questionId.toString()] : [];
    
    // Das Rätsel ist vollständig gelöst, wenn alle Fragen beantwortet wurden
    // Für Debug-Zwecke: Wenn die aktuelle Frage richtig ist UND es die letzte Frage ist
    const questionNumbers = allQuestions.map(q => {
      const parts = q.data_key.split('_');
      return parseInt(parts[parts.length - 1]);
    }).sort((a, b) => a - b);
    
    const currentQuestionNumber = parseInt(questionId);
    const isLastQuestion = currentQuestionNumber === Math.max(...questionNumbers);
    const allCompleted = isCorrect && isLastQuestion;

    // Belohnungen nur bei vollständiger Lösung
    let rewards = null;
    if (allCompleted) {
      rewards = {
        exp: puzzle.reward_exp,
        items: JSON.parse(puzzle.reward_items || '[]')
      };
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      message: validationMessage,
      attempts: 1, // Debug: Immer 1 Versuch
      maxAttempts: puzzle.max_attempts,
      completedQuestions,
      totalQuestions,
      allCompleted,
      rewards,
      explanation: isCorrect ? question.explanation : null
    });

  } catch (error) {
    console.error('Fehler beim Lösen des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
} 