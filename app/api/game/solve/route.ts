import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeUpdate } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/services/auth-service';

interface SolveRequest {
  puzzleId: string;
  answer: string | string[]; // Einzelne Antwort oder Array für Multi-Question
  questionId?: string; // Optional für Multi-Question Rätsel
  timeSpent?: number; // Optional: Verbrachte Zeit in Sekunden
}

interface SolveResponse {
  success: boolean;
  isCorrect: boolean;
  attempts: number;
  message: string;
  // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
  // rewardExp?: number;
  // rewardBitcoins?: number;
  // rewardItems?: string[];
  unlockedRooms?: string[];
  unlockedItems?: string[];
  hints?: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung prüfen
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    // User-Daten aus der Datenbank abrufen
    const dbUser = await getUserById(user.userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Benutzer nicht gefunden' },
        { status: 401 }
      );
    }

    // Request-Body parsen
    const body: SolveRequest = await request.json();
    const { puzzleId, answer, questionId, timeSpent } = body;

    if (!puzzleId || !answer) {
      return NextResponse.json(
        { success: false, error: 'Rätsel-ID und Antwort erforderlich' },
        { status: 400 }
      );
    }

    // Rätsel-Daten abrufen
    const puzzleQuery = `
      SELECT 
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
        p.reward_bitcoins,
        p.reward_items,
        p.is_required,
        p.is_hidden
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

    // Aktuellen Fortschritt abrufen
    const progressQuery = `
      SELECT 
        attempts,
        is_completed,
        hints_used,
        completed_at
      FROM puzzle_progress
      WHERE user_id = ? AND puzzle_id = ?
    `;

    const progressResult = await executeQuery(progressQuery, [dbUser.id, puzzleId]);
    const currentProgress = progressResult.length > 0 ? progressResult[0] : {
      attempts: 0,
      is_completed: false,
      hints_used: 0,
      completed_at: null
    };

    // Prüfen ob Rätsel bereits gelöst
    if (currentProgress.is_completed) {
      return NextResponse.json({
        success: true,
        isCorrect: true,
        attempts: currentProgress.attempts,
        message: 'Rätsel bereits gelöst',
        // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
        // rewardExp: puzzle.reward_exp,
        // rewardBitcoins: parseFloat(puzzle.reward_bitcoins || '0'),
        // rewardItems: JSON.parse(puzzle.reward_items || '[]')
      });
    }

    // Prüfen ob maximale Versuche erreicht
    if (currentProgress.attempts >= puzzle.max_attempts) {
      return NextResponse.json({
        success: false,
        error: 'Maximale Anzahl Versuche erreicht',
        attempts: currentProgress.attempts
      });
    }

    // Lösung validieren basierend auf Rätseltyp
    const isCorrect = await validateSolution(puzzle, answer, questionId);

    // Versuche erhöhen
    const newAttempts = currentProgress.attempts + 1;

    if (isCorrect) {
      // Rätsel als gelöst markieren
      await executeUpdate(`
        INSERT INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts, completed_at, best_time_seconds)
        VALUES (?, ?, TRUE, ?, NOW(), ?)
        ON DUPLICATE KEY UPDATE
        is_completed = TRUE,
        attempts = ?,
        completed_at = NOW(),
        best_time_seconds = CASE 
          WHEN best_time_seconds IS NULL OR ? < best_time_seconds 
          THEN ? 
          ELSE best_time_seconds 
        END
      `, [dbUser.id, puzzleId, newAttempts, timeSpent || null, newAttempts, timeSpent || 0, timeSpent || 0]);

      // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
      // await executeUpdate(`
      //   UPDATE game_states 
      //   SET 
      //     experience_points = experience_points + ?,
      //     bitcoins = bitcoins + ?,
      //     progress = JSON_SET(progress, CONCAT('$.', ?), JSON_OBJECT('completed', TRUE, 'completed_at', NOW()))
      //   WHERE user_id = ?
      // `, [puzzle.reward_exp || 0, parseFloat(puzzle.reward_bitcoins || '0'), puzzleId, dbUser.id]);

      // Erfolgs-Response
      const response: SolveResponse = {
        success: true,
        isCorrect: true,
        attempts: newAttempts,
        message: 'Rätsel erfolgreich gelöst!',
        // KEINE Rätsel-Belohnungen mehr - nur Mission-Belohnungen
        // rewardExp: puzzle.reward_exp,
        // rewardBitcoins: parseFloat(puzzle.reward_bitcoins || '0'),
        // rewardItems: JSON.parse(puzzle.reward_items || '[]')
      };

      return NextResponse.json(response);

    } else {
      // Falsche Antwort - nur Versuche aktualisieren
      await executeUpdate(`
        INSERT INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts)
        VALUES (?, ?, FALSE, ?)
        ON DUPLICATE KEY UPDATE
        attempts = ?
      `, [dbUser.id, puzzleId, newAttempts, newAttempts]);

      // Hinweise abrufen
      const hintsQuery = `
        SELECT data_value
        FROM puzzle_data
        WHERE puzzle_id = ? AND data_type = ? AND data_key LIKE 'hint_%'
        ORDER BY data_key
        LIMIT ?
      `;

      const hintsResult = await executeQuery(hintsQuery, [
        puzzleId, 
        puzzle.puzzle_type, 
        Math.min(currentProgress.hints_used + 1, 3) // Maximal 3 Hinweise
      ]);

      const hints = hintsResult.map((row: any) => {
        try {
          const parsed = JSON.parse(row.data_value);
          return parsed.text || parsed;
        } catch {
          return row.data_value;
        }
      });

      // Fehler-Response
      const response: SolveResponse = {
        success: false,
        isCorrect: false,
        attempts: newAttempts,
        message: 'Falsche Antwort. Versuche es nochmal!',
        hints: hints.length > 0 ? hints : undefined
      };

      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('Fehler beim Lösen des Rätsels:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

async function validateSolution(puzzle: any, answer: string | string[], questionId?: string): Promise<boolean> {
  const puzzleType = puzzle.puzzle_type;
  let solution: any;

  try {
    solution = JSON.parse(puzzle.solution);
  } catch {
    solution = puzzle.solution;
  }

  switch (puzzleType) {
    case 'terminal':
    case 'terminal_command':
      // Terminal-Rätsel: String-Vergleich (case-insensitive)
      const terminalAnswer = Array.isArray(answer) ? answer[0] : answer;
      const terminalSolution = Array.isArray(solution) ? solution[0] : solution;
      return terminalAnswer.toLowerCase().trim() === terminalSolution.toLowerCase().trim();

    case 'code':
    case 'password':
      // Code/Passwort-Rätsel: String-Vergleich
      const codeAnswer = Array.isArray(answer) ? answer[0] : answer;
      const codeSolution = Array.isArray(solution) ? solution[0] : solution;
      return codeAnswer.trim() === codeSolution.trim();

    case 'multiple_choice':
      // Multiple-Choice: Index-Vergleich
      if (questionId && Array.isArray(solution)) {
        // Multi-Question Rätsel
        const questionIndex = parseInt(questionId) - 1;
        if (questionIndex >= 0 && questionIndex < solution.length) {
          const correctAnswer = solution[questionIndex];
          return answer === correctAnswer.toString();
        }
      } else {
        // Einzelne Multiple-Choice Frage
        const correctAnswer = Array.isArray(solution) ? solution[0] : solution;
        return answer === correctAnswer.toString();
      }
      return false;

    case 'sequence':
    case 'pattern':
      // Sequenz/Pattern-Rätsel: Array-Vergleich
      const sequenceAnswer = Array.isArray(answer) ? answer : [answer];
      const sequenceSolution = Array.isArray(solution) ? solution : [solution];
      
      if (sequenceAnswer.length !== sequenceSolution.length) {
        return false;
      }
      
      return sequenceAnswer.every((ans, index) => 
        ans.toString().trim() === sequenceSolution[index].toString().trim()
      );

    case 'logic':
      // Logik-Rätsel: Komplexe Validierung
      const logicAnswer = Array.isArray(answer) ? answer[0] : answer;
      const logicSolution = Array.isArray(solution) ? solution[0] : solution;
      return logicAnswer.trim() === logicSolution.trim();

    case 'point_and_click':
      // Point-and-Click: Koordinaten oder Objekt-ID
      const clickAnswer = Array.isArray(answer) ? answer[0] : answer;
      const clickSolution = Array.isArray(solution) ? solution[0] : solution;
      return clickAnswer.trim() === clickSolution.trim();

    default:
      // Fallback: String-Vergleich
      const defaultAnswer = Array.isArray(answer) ? answer[0] : answer;
      const defaultSolution = Array.isArray(solution) ? solution[0] : solution;
      return defaultAnswer.trim() === defaultSolution.trim();
  }
} 