import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery } from '@/lib/database';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { puzzleId: string } }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const puzzleId = params.puzzleId;
      const body = await request.json();
      const { answer, timeSpent } = body;

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
        reward_money: number;
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

      // Rätsel-spezifische Daten abrufen
      const puzzleData = await executeQuery<{
        data_type: string;
        data_key: string;
        data_value: string;
      }>(
        'SELECT * FROM puzzle_data WHERE puzzle_id = ?',
        [puzzleId]
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
      if (currentAttempts >= puzzle.max_attempts) {
        return NextResponse.json({
          success: false,
          error: 'Maximale Anzahl Versuche erreicht'
        }, { status: 400 });
      }

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

      // Antwort validieren je nach Rätseltyp
      let isCorrect = false;
      let validationMessage = '';

      switch (puzzle.puzzle_type) {
        case 'multiple_choice':
          const correctAnswer = structuredData.multiple_choice?.correct_answer;
          isCorrect = answer.toLowerCase() === correctAnswer?.toLowerCase();
          validationMessage = isCorrect ? 'Richtige Antwort!' : 'Falsche Antwort';
          break;

        case 'code':
          const expectedInput = structuredData.code?.expected_input;
          const caseSensitive = structuredData.code?.case_sensitive || false;
          const allowPartial = structuredData.code?.allow_partial || false;
          
          if (caseSensitive) {
            isCorrect = answer === expectedInput;
          } else {
            isCorrect = answer.toLowerCase() === expectedInput?.toLowerCase();
          }
          
          if (!isCorrect && allowPartial) {
            isCorrect = answer.toLowerCase().includes(expectedInput?.toLowerCase());
          }
          
          validationMessage = isCorrect ? 'Code korrekt!' : 'Code falsch';
          break;

        case 'terminal_command':
          const allowedCommands = structuredData.terminal?.allowed_commands || [];
          const expectedOutput = structuredData.terminal?.expected_output;
          
          // Prüfen ob Befehl erlaubt ist
          const isAllowedCommand = allowedCommands.some((cmd: string) => 
            answer.toLowerCase().startsWith(cmd.toLowerCase())
          );
          
          if (isAllowedCommand) {
            // Für einfache Befehle wie 'ls' ist die Ausgabe vorgegeben
            isCorrect = true;
            validationMessage = 'Befehl korrekt ausgeführt!';
          } else {
            isCorrect = false;
            validationMessage = 'Befehl nicht erlaubt';
          }
          break;

        case 'password':
          const hashType = structuredData.password?.hash_type;
          const expectedHash = structuredData.password?.expected_hash;
          const plaintext = structuredData.password?.plaintext;
          
          if (hashType === 'md5') {
            const hash = crypto.createHash('md5').update(answer).digest('hex');
            isCorrect = hash === expectedHash;
          } else {
            // Fallback: Direkter Vergleich
            isCorrect = answer === plaintext;
          }
          
          validationMessage = isCorrect ? 'Passwort korrekt!' : 'Passwort falsch';
          break;

        case 'sequence':
          const nextNumber = structuredData.sequence?.next_number;
          isCorrect = parseInt(answer) === nextNumber;
          validationMessage = isCorrect ? 'Zahl korrekt!' : 'Zahl falsch';
          break;

        case 'logic':
          const solution = structuredData.logic?.solution;
          isCorrect = answer.toString() === solution?.toString();
          validationMessage = isCorrect ? 'Lösung korrekt!' : 'Lösung falsch';
          break;

        default:
          // Fallback: Direkter Vergleich mit solution JSON
          const solutionData = JSON.parse(puzzle.solution);
          isCorrect = answer.toString() === solutionData.expected_input?.toString();
          validationMessage = isCorrect ? 'Antwort korrekt!' : 'Antwort falsch';
      }

      // Transaktion starten
      await executeQuery('START TRANSACTION');

      try {
        // Versuch registrieren
        const newAttempts = currentAttempts + 1;
        
        if (progress) {
          // Bestehenden Fortschritt aktualisieren
          await executeQuery(
            'UPDATE puzzle_progress SET attempts = ?, best_time_seconds = CASE WHEN ? < best_time_seconds OR best_time_seconds IS NULL THEN ? ELSE best_time_seconds END WHERE user_id = ? AND puzzle_id = ?',
            [newAttempts, timeSpent || 0, timeSpent || 0, userId, puzzleId]
          );
        } else {
          // Neuen Fortschritt erstellen
          await executeQuery(
            'INSERT INTO puzzle_progress (user_id, puzzle_id, attempts, best_time_seconds) VALUES (?, ?, ?, ?)',
            [userId, puzzleId, newAttempts, timeSpent || 0]
          );
        }

        if (isCorrect) {
          // Rätsel als gelöst markieren
          await executeQuery(
            'UPDATE puzzle_progress SET is_completed = true, completed_at = NOW() WHERE user_id = ? AND puzzle_id = ?',
            [userId, puzzleId]
          );

          // Belohnungen vergeben
          if (puzzle.reward_money > 0) {
            await executeQuery(
              'UPDATE game_states SET money = money + ? WHERE user_id = ?',
              [puzzle.reward_money, userId]
            );
          }

          if (puzzle.reward_exp > 0) {
            await executeQuery(
              'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
              [puzzle.reward_exp, userId]
            );
          }

          // Statistik aktualisieren
          await executeQuery(
            'UPDATE player_stats SET puzzles_solved = puzzles_solved + 1, total_money_earned = total_money_earned + ?, total_exp_earned = total_exp_earned + ? WHERE user_id = ?',
            [puzzle.reward_money, puzzle.reward_exp, userId]
          );
        }

        // Transaktion bestätigen
        await executeQuery('COMMIT');

        return NextResponse.json({
          success: true,
          isCorrect,
          message: validationMessage,
          attempts: newAttempts,
          maxAttempts: puzzle.max_attempts,
          rewards: isCorrect ? {
            money: puzzle.reward_money,
            exp: puzzle.reward_exp,
            items: JSON.parse(puzzle.reward_items || '[]')
          } : null
        });

      } catch (error) {
        // Transaktion rückgängig machen
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