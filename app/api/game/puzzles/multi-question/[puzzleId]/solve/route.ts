import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { puzzleId } = await params;
      const body = await request.json();
      const { questionId, answer, timeSpent } = body;

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

      // Aktuellen Fortschritt abrufen
      const progress = await executeQuerySingle<{
        is_completed: boolean;
        attempts: number;
        best_time_seconds: number | null;
      }>(
        'SELECT is_completed, attempts, best_time_seconds FROM puzzle_progress WHERE user_id = ? AND puzzle_id = ?',
        [userId, puzzleId]
      );

      // Prüfen ob bereits gelöst
      if (progress?.is_completed) {
        return NextResponse.json({
          success: false,
          error: 'Rätsel bereits gelöst'
        }, { status: 400 });
      }

      // Prüfen ob maximale Versuche erreicht
      const currentAttempts = progress?.attempts || 0;
      const maxAttemptsReached = currentAttempts >= puzzle.max_attempts;

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

      // Transaktion starten
      const transactionQueries = [];

      try {
        // Versuch registrieren
        const newAttempts = currentAttempts + 1;

        // Alle Fragen des Rätsels abrufen um zu prüfen ob alle gelöst sind
        const allQuestions = await executeQuery<{
          data_key: string;
        }>(
          'SELECT DISTINCT data_key FROM puzzle_data WHERE puzzle_id = ? AND data_key LIKE "question_%"',
          [puzzleId]
        );

        const totalQuestions = allQuestions.length;
        
        // Für jetzt: Einfache Lösung - wenn die aktuelle Frage richtig ist, ist das Rätsel gelöst
        // In einer vollständigen Implementierung würden wir den Fortschritt pro Frage speichern
        const allCompleted = isCorrect;

        if (progress) {
          // Bestehenden Fortschritt aktualisieren
          transactionQueries.push({
            query: 'UPDATE puzzle_progress SET attempts = ?, best_time_seconds = CASE WHEN ? < best_time_seconds OR best_time_seconds IS NULL THEN ? ELSE best_time_seconds END, is_completed = ?, completed_at = CASE WHEN ? THEN NOW() ELSE completed_at END WHERE user_id = ? AND puzzle_id = ?',
            params: [newAttempts, timeSpent || 0, timeSpent || 0, allCompleted, allCompleted, userId, puzzleId]
          });
        } else {
          // Neuen Fortschritt erstellen
          transactionQueries.push({
            query: 'INSERT INTO puzzle_progress (user_id, puzzle_id, attempts, best_time_seconds, is_completed, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
            params: [userId, puzzleId, newAttempts, timeSpent || 0, allCompleted, allCompleted ? new Date() : null]
          });
        }

        if (isCorrect && !maxAttemptsReached) {
          // Rätsel als gelöst markieren (nur wenn nicht bei Maximum)
          transactionQueries.push({
            query: 'UPDATE puzzle_progress SET is_completed = true, completed_at = NOW() WHERE user_id = ? AND puzzle_id = ?',
            params: [userId, puzzleId]
          });

          // Statistik aktualisieren (nur Rätsel-Zähler, keine Belohnungen)
          transactionQueries.push({
            query: 'UPDATE player_stats SET puzzles_solved = puzzles_solved + 1 WHERE user_id = ?',
            params: [userId]
          });
        }

        await executeQuery('START TRANSACTION');

        for (const query of transactionQueries) {
          await executeQuery(query.query, query.params);
        }

        await executeQuery('COMMIT');

        return NextResponse.json({
          success: true,
          isCorrect: isCorrect,
          message: isCorrect ? 'Rätsel erfolgreich gelöst!' : 'Falsche Antwort. Versuche es erneut.',
          attempts: newAttempts,
          maxAttempts: puzzle.max_attempts,
          completedQuestions: isCorrect ? [questionId.toString()] : [],
          totalQuestions,
          allCompleted,
          explanation: isCorrect ? question.explanation : null
        });

      } catch (error) {
        await executeQuery('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Fehler beim Lösen des Rätsels:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 