import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery, executeTransaction, executeTransactionCommand } from '@/lib/database';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { puzzleId } = await params;
      const body = await request.json();
      const { answer, timeSpent } = body;

      if (!puzzleId || answer === undefined) {
        return NextResponse.json({
          success: false,
          error: 'puzzleId und answer sind erforderlich'
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

      // Prüfen ob maximale Versuche erreicht - ABER NICHT BLOCKIEREN
      const currentAttempts = progress?.attempts || 0;
      const maxAttemptsReached = currentAttempts >= puzzle.max_attempts;
      
      // Wenn maximale Versuche erreicht sind, trotzdem weitermachen
      // Die Puzzle-Komponenten werden das Alarm-Level erhöhen

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
          const options = structuredData.multiple_choice?.options || [];
          
          // Finde den Index der korrekten Antwort
          const correctIndex = options.findIndex((option: string) => 
            option.toLowerCase() === correctAnswer?.toLowerCase()
          );
          
          // Konvertiere den Buchstaben (a, b, c, d) in einen Index (0, 1, 2, 3)
          const answerIndex = answer.toLowerCase().charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
          
          isCorrect = answerIndex === correctIndex;
          validationMessage = isCorrect ? 'Richtige Antwort!' : 'Falsche Antwort';
          break;

        case 'code':
          const expectedInput = structuredData.code?.expected_input;
          const caseSensitive = structuredData.code?.case_sensitive || false;
          const allowPartial = structuredData.code?.allow_partial || false;
          
          // Fallback: Lösung aus der solution-Spalte verwenden
          let solutionToCheck = expectedInput;
          if (!solutionToCheck) {
            try {
              const solutionArray = JSON.parse(puzzle.solution);
              solutionToCheck = Array.isArray(solutionArray) ? solutionArray[0] : solutionArray;
            } catch {
              solutionToCheck = puzzle.solution;
            }
          }
          
          if (caseSensitive) {
            isCorrect = answer === solutionToCheck;
          } else {
            isCorrect = answer.toLowerCase() === solutionToCheck?.toLowerCase();
          }
          
          if (!isCorrect && allowPartial) {
            isCorrect = answer.toLowerCase().includes(solutionToCheck?.toLowerCase());
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

        case 'terminal':
          // Terminal-Rätsel: Direkter Vergleich mit der Lösung aus dem solution-Feld
          const solutionArray = JSON.parse(puzzle.solution);
          if (Array.isArray(solutionArray)) {
            // Prüfe ob die Antwort in der Lösungsliste steht
            isCorrect = solutionArray.some((solution: string) => 
              answer.toLowerCase().trim() === solution.toLowerCase().trim()
            );
          } else {
            // Fallback: Direkter String-Vergleich
            isCorrect = answer.toLowerCase().trim() === solutionArray.toLowerCase().trim();
          }
          validationMessage = isCorrect ? 'Befehl korrekt!' : 'Befehl falsch';
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
      const transactionQueries = [];

      // Versuch registrieren (nur wenn nicht bereits bei Maximum)
      const newAttempts = maxAttemptsReached ? currentAttempts : currentAttempts + 1;
      
      if (progress) {
        // Bestehenden Fortschritt aktualisieren
        transactionQueries.push({
          query: 'UPDATE puzzle_progress SET attempts = ?, best_time_seconds = CASE WHEN ? < best_time_seconds OR best_time_seconds IS NULL THEN ? ELSE best_time_seconds END WHERE user_id = ? AND puzzle_id = ?',
          params: [newAttempts, timeSpent || 0, timeSpent || 0, userId, puzzleId]
        });
      } else {
        // Neuen Fortschritt erstellen
        transactionQueries.push({
          query: 'INSERT INTO puzzle_progress (user_id, puzzle_id, attempts, best_time_seconds) VALUES (?, ?, ?, ?)',
          params: [userId, puzzleId, newAttempts, timeSpent || 0]
        });
      }

      if (isCorrect && !maxAttemptsReached) {
        // Rätsel als gelöst markieren (nur wenn nicht bei Maximum)
        transactionQueries.push({
          query: 'UPDATE puzzle_progress SET is_completed = true, completed_at = NOW() WHERE user_id = ? AND puzzle_id = ?',
          params: [userId, puzzleId]
        });

        // Belohnungen vergeben
        if (puzzle.reward_bitcoins > 0) {
          transactionQueries.push({
            query: 'UPDATE game_states SET bitcoins = bitcoins + ? WHERE user_id = ?',
            params: [puzzle.reward_bitcoins, userId]
          });
        }

        if (puzzle.reward_exp > 0) {
          transactionQueries.push({
            query: 'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
            params: [puzzle.reward_exp, userId]
          });
        }

        // Statistik aktualisieren
        transactionQueries.push({
          query: 'UPDATE player_stats SET puzzles_solved = puzzles_solved + 1, total_bitcoins_earned = total_bitcoins_earned + ?, total_exp_earned = total_exp_earned + ? WHERE user_id = ?',
          params: [puzzle.reward_bitcoins, puzzle.reward_exp, userId]
        });

        // Prüfen ob alle Rätsel der Mission gelöst wurden
        const missionPuzzles = await executeQuery<{puzzle_id: string, is_required: boolean}>(
          `SELECT p.puzzle_id, p.is_required 
           FROM puzzles p 
           JOIN rooms r ON p.room_id = r.room_id 
           WHERE r.mission_id = (SELECT mission_id FROM rooms WHERE room_id = ?)`,
          [puzzle.room_id]
        );

        if (missionPuzzles.length > 0) {
          const requiredPuzzles = missionPuzzles.filter(p => p.is_required);
          const solvedRequiredPuzzles = await executeQuery<{puzzle_id: string}>(
            `SELECT pp.puzzle_id 
             FROM puzzle_progress pp 
             WHERE pp.user_id = ? AND pp.is_completed = true AND pp.puzzle_id IN (${requiredPuzzles.map(() => '?').join(',')})`,
            [userId, ...requiredPuzzles.map(p => p.puzzle_id)]
          );

          // Wenn alle erforderlichen Rätsel gelöst wurden, Mission als abgeschlossen markieren
          if (solvedRequiredPuzzles.length === requiredPuzzles.length) {
            const missionId = await executeQuerySingle<{mission_id: string}>(
              'SELECT mission_id FROM rooms WHERE room_id = ?',
              [puzzle.room_id]
            );

            if (missionId) {
              // Mission-Progress erstellen oder aktualisieren
              transactionQueries.push({
                query: `INSERT INTO mission_progress (user_id, mission_id, is_completed, completed_at, puzzles_completed) 
                        VALUES (?, ?, true, NOW(), ?) 
                        ON DUPLICATE KEY UPDATE 
                        is_completed = true, 
                        completed_at = NOW(), 
                        puzzles_completed = ?`,
                params: [userId, missionId.mission_id, solvedRequiredPuzzles.length, solvedRequiredPuzzles.length]
              });

              // Mission-Belohnungen vergeben
              const mission = await executeQuerySingle<{reward_bitcoins: number, reward_exp: number}>(
                'SELECT reward_bitcoins, reward_exp FROM missions WHERE mission_id = ?',
                [missionId.mission_id]
              );

              if (mission && (mission.reward_bitcoins > 0 || mission.reward_exp > 0)) {
                if (mission.reward_bitcoins > 0) {
                  transactionQueries.push({
                    query: 'UPDATE game_states SET bitcoins = bitcoins + ? WHERE user_id = ?',
                    params: [mission.reward_bitcoins, userId]
                  });
                }

                if (mission.reward_exp > 0) {
                  transactionQueries.push({
                    query: 'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
                    params: [mission.reward_exp, userId]
                  });
                }

                // Mission-Statistik aktualisieren
                transactionQueries.push({
                  query: 'UPDATE player_stats SET missions_completed = missions_completed + 1, total_bitcoins_earned = total_bitcoins_earned + ?, total_exp_earned = total_exp_earned + ? WHERE user_id = ?',
                  params: [mission.reward_bitcoins, mission.reward_exp, userId]
                });
              }
            }
          }
        }
      }

      // Transaktion ausführen
      await executeTransaction(transactionQueries);

      // Bei maximalen Versuchen immer false zurückgeben
      const finalIsCorrect = maxAttemptsReached ? false : isCorrect;
      const finalMessage = maxAttemptsReached ? 'Maximale Anzahl Versuche erreicht' : validationMessage;

      return NextResponse.json({
        success: true,
        isCorrect: finalIsCorrect,
        message: finalMessage,
        attempts: newAttempts,
        maxAttempts: puzzle.max_attempts,
        maxAttemptsReached: maxAttemptsReached,
        rewards: finalIsCorrect ? {
          bitcoins: puzzle.reward_bitcoins,
          exp: puzzle.reward_exp,
          items: JSON.parse(puzzle.reward_items || '[]')
        } : null
      });

    } catch (error) {
      console.error('Fehler beim Lösen des Rätsels:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 