/**
 * Puzzle Service für Frontend-Operationen
 */

import { executeUpdate } from '@/lib/database';

export interface PuzzleData {
  puzzleId: string;
  roomId: string;
  name: string;
  description: string;
  type: string;
  difficulty: number;
  maxAttempts: number;
  timeLimitSeconds?: number;
  isRequired: boolean;
  isHidden: boolean;
  hints: string[];
  data: any;
  progress: {
    isCompleted: boolean;
    attempts: number;
    bestTimeSeconds: number | null;
    completedAt: string | null;
    hintsUsed: number;
  };
}

export interface SolvePuzzleRequest {
  answer: string;
  timeSpent?: number;
}

export interface SolvePuzzleResponse {
  success: boolean;
  isCorrect: boolean;
  message: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
}

/**
 * Rätsel abrufen
 */
export async function getPuzzle(puzzleId: string): Promise<{
  success: boolean;
  puzzle?: PuzzleData;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/puzzles/${puzzleId}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Abrufen des Rätsels'
      };
    }

    return {
      success: true,
      puzzle: data.puzzle
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Rätsels:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen des Rätsels'
    };
  }
}

/**
 * Rätsel lösen
 */
export async function solvePuzzle(puzzleId: string, request: SolvePuzzleRequest): Promise<SolvePuzzleResponse> {
  try {
    const response = await fetch(`/api/game/puzzles/${puzzleId}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        isCorrect: false,
        message: data.error || 'Fehler beim Lösen des Rätsels',
        attempts: 0,
        maxAttempts: 0,
        error: data.error
      };
    }

    return {
      success: true,
      isCorrect: data.isCorrect,
      message: data.message,
      attempts: data.attempts,
      maxAttempts: data.maxAttempts,
    };
  } catch (error) {
    console.error('Fehler beim Lösen des Rätsels:', error);
    return {
      success: false,
      isCorrect: false,
      message: 'Netzwerkfehler beim Lösen des Rätsels',
      attempts: 0,
      maxAttempts: 0,
      error: 'Netzwerkfehler'
    };
  }
}

/**
 * Rätsel in einem Raum abrufen
 */
export async function getRoomPuzzles(roomId: string): Promise<{
  success: boolean;
  puzzles?: PuzzleData[];
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/room?roomId=${encodeURIComponent(roomId)}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Abrufen der Raum-Rätsel'
      };
    }

    return {
      success: true,
      puzzles: data.puzzles || []
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Raum-Rätsel:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen der Raum-Rätsel'
    };
  }
}

/**
 * Fügt einen Eintrag ins puzzle_interaction_logs-Table ein
 */
export async function addPuzzleInteractionLog({
  userId,
  puzzleId,
  actionType,
  attemptNumber = 1,
  timeSpentSeconds = null,
  userInput = null,
  expectedSolution = null,
  isCorrect = null,
  hintIndex = null,
  sessionId = null,
  userAgent = null,
  ipAddress = null
}: {
  userId: number;
  puzzleId: string;
  actionType: 'started' | 'attempted' | 'failed' | 'solved' | 'skipped' | 'timeout' | 'hint_used' | 'abandoned';
  attemptNumber?: number;
  timeSpentSeconds?: number | null;
  userInput?: string | null;
  expectedSolution?: string | null;
  isCorrect?: boolean | null;
  hintIndex?: number | null;
  sessionId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  try {
    console.debug('[Analytics] Logging puzzle_interaction:', {
      userId,
      puzzleId,
      actionType,
      attemptNumber,
      timeSpentSeconds,
      userInput,
      expectedSolution,
      isCorrect,
      hintIndex,
      sessionId,
      userAgent,
      ipAddress
    });
    const result = await executeUpdate(`
      INSERT INTO puzzle_interaction_logs (
        user_id, puzzle_id, action_type, attempt_number, time_spent_seconds, user_input, expected_solution, is_correct, hint_index, session_id, user_agent, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      puzzleId,
      actionType,
      attemptNumber,
      timeSpentSeconds,
      userInput,
      expectedSolution,
      isCorrect,
      hintIndex,
      sessionId,
      userAgent,
      ipAddress
    ]);
    console.debug('[Analytics] Insert result:', result);
  } catch (err) {
    console.error('[Analytics] Fehler beim Logging puzzle_interaction:', err, {
      userId,
      puzzleId,
      actionType,
      attemptNumber,
      timeSpentSeconds,
      userInput,
      expectedSolution,
      isCorrect,
      hintIndex,
      sessionId,
      userAgent,
      ipAddress
    });
  }
} 