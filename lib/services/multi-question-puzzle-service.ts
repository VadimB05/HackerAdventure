/**
 * Multi-Question Puzzle Service für Frontend-Operationen
 */

export interface MultiQuestionPuzzleData {
  puzzleId: string;
  roomId: string;
  name: string;
  description: string;
  type: string;
  difficulty: number;
  questions: {
    id: number;
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }[];
  maxAttempts: number;
  timeLimitSeconds?: number;
  rewardExp: number;
  rewardItems: string[];
  isRequired: boolean;
  isHidden: boolean;
  hints: string[];
  progress: {
    isCompleted: boolean;
    attempts: number;
    bestTimeSeconds: number | null;
    completedAt: string | null;
    hintsUsed: number;
    completedQuestions: string[];
  };
}

export interface SolveMultiQuestionRequest {
  questionId: number;
  answer: string;
  timeSpent?: number;
}

export interface SolveMultiQuestionResponse {
  success: boolean;
  isCorrect: boolean;
  message: string;
  attempts: number;
  maxAttempts: number;
  completedQuestions: string[];
  totalQuestions: number;
  allCompleted: boolean;
  rewards?: {
    exp: number;
    items: string[];
  };
  explanation?: string;
  error?: string;
}

/**
 * Multi-Question-Rätsel abrufen
 */
export async function getMultiQuestionPuzzle(puzzleId: string): Promise<{
  success: boolean;
  puzzle?: MultiQuestionPuzzleData;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/puzzles/multi-question/${puzzleId}`, {
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
    console.error('Fehler beim Abrufen des Multi-Question-Rätsels:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen des Rätsels'
    };
  }
}

/**
 * Multi-Question-Rätsel lösen (Debug-Version ohne Authentifizierung)
 */
export async function solveMultiQuestionPuzzleDebug(puzzleId: string, request: SolveMultiQuestionRequest): Promise<SolveMultiQuestionResponse> {
  try {
    const response = await fetch(`/api/debug/puzzles/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        puzzleId,
        ...request
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        isCorrect: false,
        message: data.error || 'Fehler beim Lösen des Rätsels',
        attempts: 0,
        maxAttempts: 0,
        completedQuestions: [],
        totalQuestions: 0,
        allCompleted: false,
        error: data.error
      };
    }

    return {
      success: true,
      isCorrect: data.isCorrect,
      message: data.message,
      attempts: data.attempts,
      maxAttempts: data.maxAttempts,
      completedQuestions: data.completedQuestions,
      totalQuestions: data.totalQuestions,
      allCompleted: data.allCompleted,
      rewards: data.rewards,
      explanation: data.explanation
    };
  } catch (error) {
    console.error('Fehler beim Lösen des Multi-Question-Rätsels:', error);
    return {
      success: false,
      isCorrect: false,
      message: 'Netzwerkfehler beim Lösen des Rätsels',
      attempts: 0,
      maxAttempts: 0,
      completedQuestions: [],
      totalQuestions: 0,
      allCompleted: false,
      error: 'Netzwerkfehler'
    };
  }
}

/**
 * Multi-Question-Rätsel lösen
 */
export async function solveMultiQuestionPuzzle(puzzleId: string, request: SolveMultiQuestionRequest): Promise<SolveMultiQuestionResponse> {
  try {
    const response = await fetch(`/api/game/puzzles/multi-question/${puzzleId}/solve`, {
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
        completedQuestions: [],
        totalQuestions: 0,
        allCompleted: false,
        error: data.error
      };
    }

    return {
      success: true,
      isCorrect: data.isCorrect,
      message: data.message,
      attempts: data.attempts,
      maxAttempts: data.maxAttempts,
      completedQuestions: data.completedQuestions,
      totalQuestions: data.totalQuestions,
      allCompleted: data.allCompleted,
      rewards: data.rewards,
      explanation: data.explanation
    };
  } catch (error) {
    console.error('Fehler beim Lösen des Multi-Question-Rätsels:', error);
    return {
      success: false,
      isCorrect: false,
      message: 'Netzwerkfehler beim Lösen des Rätsels',
      attempts: 0,
      maxAttempts: 0,
      completedQuestions: [],
      totalQuestions: 0,
      allCompleted: false,
      error: 'Netzwerkfehler'
    };
  }
}

/**
 * Multi-Question-Rätsel in einem Raum abrufen
 */
export async function getRoomMultiQuestionPuzzles(roomId: string): Promise<{
  success: boolean;
  puzzles?: MultiQuestionPuzzleData[];
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

    // Filtere nur Multi-Question-Rätsel
    const multiQuestionPuzzles = data.puzzles?.filter((puzzle: any) => {
      const puzzleType = puzzle.type || puzzle.puzzleType;
      return puzzleType === 'multi_question' || puzzleType === 'multiple_choice';
    }) || [];

    return {
      success: true,
      puzzles: multiQuestionPuzzles
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Raum-Multi-Question-Rätsel:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen der Raum-Rätsel'
    };
  }
} 