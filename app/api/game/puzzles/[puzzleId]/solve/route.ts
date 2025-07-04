import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery, executeTransaction, executeTransactionCommand } from '@/lib/database';
import crypto from 'crypto';
import { addPuzzleInteractionLog } from '@/lib/services/puzzle-service';
import { AlarmLevelService } from '@/lib/services/alarm-level-service';

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
      const userAgent = request.headers.get('user-agent') || null;
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

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
      console.log('[DEBUG] puzzle_progress für user', userId, 'und puzzle', puzzleId, ':', progress);

      // Prüfen ob bereits gelöst
      if (progress?.is_completed) {
        // Analytics: Log skipped
        await addPuzzleInteractionLog({
          userId,
          puzzleId,
          actionType: 'skipped',
          attemptNumber: progress.attempts,
          timeSpentSeconds: timeSpent || null,
          userInput: JSON.stringify(answer),
          isCorrect: true,
          userAgent,
          ipAddress
        });
        // Mission-Completion-Logik auch bei bereits gelöstem Rätsel ausführen!
        // Prüfen ob alle Rätsel der Mission gelöst wurden
        const missionPuzzles = await executeQuery<{puzzle_id: string, is_required: boolean}>(
          `SELECT p.puzzle_id, p.is_required 
           FROM puzzles p 
           JOIN rooms r ON p.room_id = r.room_id 
           WHERE r.mission_id = (SELECT mission_id FROM rooms WHERE room_id = ?)`,
          [puzzle.room_id]
        );

        if (missionPuzzles.length > 0) {
          console.log('[DEBUG] missionPuzzles:', missionPuzzles);
          const requiredPuzzles = missionPuzzles.filter(p => p.is_required);
          console.log('[DEBUG] requiredPuzzles:', requiredPuzzles);
          const solvedRequiredPuzzles = await executeQuery<{puzzle_id: string}>(
            `SELECT pp.puzzle_id 
             FROM puzzle_progress pp 
             WHERE pp.user_id = ? AND pp.is_completed = true AND pp.puzzle_id IN (${requiredPuzzles.map(() => '?').join(',')})`,
            [userId, ...requiredPuzzles.map(p => p.puzzle_id)]
          );
          console.log('[DEBUG] solvedRequiredPuzzles:', solvedRequiredPuzzles);

          // Wenn alle erforderlichen Rätsel gelöst wurden, Mission als abgeschlossen markieren
          if (solvedRequiredPuzzles.length === requiredPuzzles.length) {
            const missionId = await executeQuerySingle<{mission_id: string}>(
              'SELECT mission_id FROM rooms WHERE room_id = ?',
              [puzzle.room_id]
            );
            console.log('[DEBUG] missionId:', missionId);

            if (missionId) {
              // Prüfen, ob die Mission bereits abgeschlossen wurde
              const existingMissionProgress = await executeQuerySingle<{is_completed: boolean}>(
                'SELECT is_completed FROM mission_progress WHERE user_id = ? AND mission_id = ?',
                [userId, missionId.mission_id]
              );

              const isMissionAlreadyCompleted = existingMissionProgress?.is_completed === true;

              if (!isMissionAlreadyCompleted) {
                console.log('[DEBUG] Mission-Completion: Führe Insert in mission_progress aus', {
                  userId,
                  missionId: missionId.mission_id,
                  puzzlesCompleted: solvedRequiredPuzzles.length
                });
                const result = await executeQuery(
                  `INSERT IGNORE INTO mission_progress (user_id, mission_id, is_completed, completed_at, puzzles_completed) 
                          VALUES (?, ?, true, NOW(), ?)`,
                  [userId, missionId.mission_id, solvedRequiredPuzzles.length]
                );
                console.log('[DEBUG] Mission-Completion: Insert-Result', result);
              }
            }
          }
        }
        // Jetzt wie gehabt abbrechen
        return NextResponse.json({
          success: false,
          error: 'Rätsel bereits gelöst'
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

      // Analytics: Log solved/failed/attempted
      await addPuzzleInteractionLog({
        userId,
        puzzleId,
        actionType: isCorrect ? 'solved' : (progress?.attempts || 0 >= puzzle.max_attempts ? 'failed' : 'attempted'),
        attemptNumber: (progress?.attempts || 0) + 1,
        timeSpentSeconds: timeSpent || null,
        userInput: JSON.stringify(answer),
        isCorrect,
        userAgent,
        ipAddress
      });

      // Transaktion starten
      const transactionQueries = [];

      // Versuch registrieren (immer +1, außer schon max)
      let newAttempts = progress?.attempts || 0;
      if (!progress || !progress.is_completed) {
        newAttempts = (progress?.attempts || 0) + 1;
      }

      // Jetzt prüfen, ob das Maximum erreicht ist
      const maxAttemptsNowReached = newAttempts >= puzzle.max_attempts;
      console.log('[DEBUG] newAttempts:', newAttempts, 'max:', puzzle.max_attempts, 'isCorrect:', isCorrect);
      console.log('[DEBUG] maxAttemptsNowReached:', maxAttemptsNowReached);

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

      if (isCorrect && !maxAttemptsNowReached) {
        // Rätsel als gelöst markieren (nur wenn nicht bei Maximum)
        transactionQueries.push({
          query: 'UPDATE puzzle_progress SET is_completed = true, completed_at = NOW() WHERE user_id = ? AND puzzle_id = ?',
          params: [userId, puzzleId]
        });

        // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
        // if (puzzle.reward_bitcoins > 0) {
        //   transactionQueries.push({
        //     query: 'UPDATE game_states SET bitcoins = bitcoins + ? WHERE user_id = ?',
        //     params: [puzzle.reward_bitcoins, userId]
        //   });
        // }

        // if (puzzle.reward_exp > 0) {
        //   transactionQueries.push({
        //     query: 'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
        //     params: [puzzle.reward_exp, userId]
        //   });
        // }

        // Statistik aktualisieren (nur Rätsel-Zähler, keine Belohnungen)
        transactionQueries.push({
          query: 'UPDATE player_stats SET puzzles_solved = puzzles_solved + 1 WHERE user_id = ?',
          params: [userId]
        });

        // Prüfen ob alle Rätsel der Mission gelöst wurden
        const missionPuzzles = await executeQuery<{puzzle_id: string, is_required: boolean}>(
          `SELECT p.puzzle_id, p.is_required 
           FROM puzzles p 
           JOIN rooms r ON p.room_id = r.room_id 
           WHERE r.mission_id = (SELECT mission_id FROM rooms WHERE room_id = ?)`,
          [puzzle.room_id]
        );

        console.log('[DEBUG] Mission-Completion: Rätsel für Mission gefunden:', missionPuzzles.length);

        if (missionPuzzles.length > 0) {
          console.log('[DEBUG] missionPuzzles:', missionPuzzles);
          const requiredPuzzles = missionPuzzles.filter(p => p.is_required);
          console.log('[DEBUG] requiredPuzzles:', requiredPuzzles);
          
          if (requiredPuzzles.length > 0) {
            const solvedRequiredPuzzles = await executeQuery<{puzzle_id: string}>(
              `SELECT pp.puzzle_id 
               FROM puzzle_progress pp 
               WHERE pp.user_id = ? AND pp.is_completed = true AND pp.puzzle_id IN (${requiredPuzzles.map(() => '?').join(',')})`,
              [userId, ...requiredPuzzles.map(p => p.puzzle_id)]
            );
            console.log('[DEBUG] solvedRequiredPuzzles:', solvedRequiredPuzzles);

            // Wenn alle erforderlichen Rätsel gelöst wurden, Mission als abgeschlossen markieren
            if (solvedRequiredPuzzles.length === requiredPuzzles.length) {
              const missionId = await executeQuerySingle<{mission_id: string}>(
                'SELECT mission_id FROM rooms WHERE room_id = ?',
                [puzzle.room_id]
              );
              console.log('[DEBUG] missionId:', missionId);

              if (missionId) {
                // Prüfen, ob die Mission bereits abgeschlossen wurde
                const existingMissionProgress = await executeQuerySingle<{is_completed: boolean}>(
                  'SELECT is_completed FROM mission_progress WHERE user_id = ? AND mission_id = ?',
                  [userId, missionId.mission_id]
                );

                const isMissionAlreadyCompleted = existingMissionProgress?.is_completed === true;

                if (!isMissionAlreadyCompleted) {
                  console.log('[DEBUG] Mission-Completion: Führe Insert in mission_progress aus', {
                    userId,
                    missionId: missionId.mission_id,
                    puzzlesCompleted: solvedRequiredPuzzles.length
                  });
                  
                  // Mission-Belohnungen abrufen
                  const missionRewards = await executeQuerySingle<{reward_bitcoins: number, reward_exp: number}>(
                    'SELECT reward_bitcoins, reward_exp FROM missions WHERE mission_id = ?',
                    [missionId.mission_id]
                  );
                  
                  // Mission als abgeschlossen markieren
                  const result = await executeQuery(
                    `INSERT IGNORE INTO mission_progress (user_id, mission_id, is_completed, completed_at, puzzles_completed) 
                            VALUES (?, ?, true, NOW(), ?)`,
                    [userId, missionId.mission_id, solvedRequiredPuzzles.length]
                  );
                  console.log('[DEBUG] Mission-Completion: Insert-Result', result);
                  
                  // Mission-Belohnungen vergeben
                  if (missionRewards) {
                    if (missionRewards.reward_bitcoins > 0) {
                      await executeQuery(
                        'UPDATE game_states SET bitcoins = bitcoins + ? WHERE user_id = ?',
                        [missionRewards.reward_bitcoins, userId]
                      );
                      console.log('[DEBUG] Mission-Completion: Bitcoins vergeben:', missionRewards.reward_bitcoins);
                    }
                    
                    if (missionRewards.reward_exp > 0) {
                      await executeQuery(
                        'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
                        [missionRewards.reward_exp, userId]
                      );
                      console.log('[DEBUG] Mission-Completion: EXP vergeben:', missionRewards.reward_exp);
                    }
                  }
                } else {
                  console.log('[DEBUG] Mission-Completion: Mission bereits abgeschlossen');
                }
              }
            } else {
              console.log('[DEBUG] Mission-Completion: Nicht alle erforderlichen Rätsel gelöst:', solvedRequiredPuzzles.length, '/', requiredPuzzles.length);
            }
          } else {
            console.log('[DEBUG] Mission-Completion: Keine erforderlichen Rätsel gefunden');
          }
        } else {
          console.log('[DEBUG] Mission-Completion: Keine Rätsel für Mission gefunden');
        }
      }

      // Alarm-Level-Logik NUR wenn jetzt Maximum erreicht und NICHT korrekt
      let alarmLevelIncreased = false;
      let isFirstAlarmLevel = false;
      let newAlarmLevel = 0;
      if (maxAttemptsNowReached && !isCorrect) {
        console.log('[DEBUG] ALARM-LEVEL wird erhöht!');
        // Aktuelles Alarm-Level abrufen
        const currentAlarmStats = await AlarmLevelService.getPlayerAlarmStats(userId);
        const wasFirstAlarmLevel = currentAlarmStats.current_alarm_level === 0;
        // Mission-ID ermitteln
        const missionId = await executeQuerySingle<{mission_id: string}>(
          'SELECT mission_id FROM rooms WHERE room_id = ?',
          [puzzle.room_id]
        );
        // Alarm-Level erhöhen
        const alarmResult = await AlarmLevelService.increaseAlarmLevel(
          userId,
          `Maximale Versuche im Rätsel "${puzzle.name}" erreicht`,
          puzzleId,
          missionId?.mission_id || undefined
        );
        if (alarmResult.success) {
          alarmLevelIncreased = true;
          isFirstAlarmLevel = wasFirstAlarmLevel;
          newAlarmLevel = alarmResult.newLevel;
          // Versuche auf 0 zurücksetzen (als letzten Schritt in der Transaktion)
          transactionQueries.push({
            query: 'UPDATE puzzle_progress SET attempts = 0 WHERE user_id = ? AND puzzle_id = ?',
            params: [userId, puzzleId]
          });
          // KEIN Savepoint mehr für Alarm-Level!
        }
      }

      // Transaktion ausführen
      await executeTransaction(transactionQueries);

      // Bei maximalen Versuchen immer false zurückgeben
      const finalIsCorrect = maxAttemptsNowReached ? false : isCorrect;
      const finalMessage = maxAttemptsNowReached ? 'Maximale Anzahl Versuche erreicht' : validationMessage;

      return NextResponse.json({
        success: true,
        isCorrect: finalIsCorrect,
        message: finalMessage,
        attempts: maxAttemptsNowReached ? 0 : newAttempts, // Versuche auf 0 wenn Alarm-Level erhöht
        maxAttempts: puzzle.max_attempts,
        maxAttemptsReached: maxAttemptsNowReached,
        alarmLevelIncreased,
        isFirstAlarmLevel,
        newAlarmLevel,
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