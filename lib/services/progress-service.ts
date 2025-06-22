/**
 * Progress Service für Spielfortschritt-Verwaltung
 */

export interface PuzzleProgress {
  puzzleId: string;
  isCompleted: boolean;
  attempts: number;
  bestTimeSeconds: number | null;
  completedAt: string | null;
  hintsUsed: number;
}

export interface MissionProgress {
  missionId: string;
  isCompleted: boolean;
  completedAt: string | null;
  puzzlesCompleted: string[];
  roomsVisited: string[];
}

export interface GameProgress {
  userId: number;
  currentRoom: string;
  currentMission: string | null;
  bitcoins: number;
  experiencePoints: number;
  level: number;
  puzzleProgress: PuzzleProgress[];
  missionProgress: MissionProgress[];
  inventory: string[];
}

export interface ProgressUpdateRequest {
  puzzleId?: string;
  missionId?: string;
  roomId?: string;
  itemId?: string;
  isCompleted?: boolean;
  attempts?: number;
  timeSpent?: number;
  hintsUsed?: number;
}

/**
 * Rätsel-Fortschritt speichern
 */
export async function savePuzzleProgress(
  userId: number, 
  puzzleId: string, 
  isCompleted: boolean,
  attempts: number,
  timeSpent?: number,
  hintsUsed: number = 0
): Promise<{
  success: boolean;
  progress?: PuzzleProgress;
  error?: string;
}> {
  try {
    const response = await fetch('/api/game/progress/puzzle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        puzzleId,
        isCompleted,
        attempts,
        timeSpent,
        hintsUsed
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Speichern des Rätsel-Fortschritts'
      };
    }

    return {
      success: true,
      progress: data.progress
    };
  } catch (error) {
    console.error('Fehler beim Speichern des Rätsel-Fortschritts:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Speichern des Rätsel-Fortschritts'
    };
  }
}

/**
 * Mission-Fortschritt speichern
 */
export async function saveMissionProgress(
  userId: number,
  missionId: string,
  isCompleted: boolean,
  puzzlesCompleted: string[] = [],
  roomsVisited: string[] = []
): Promise<{
  success: boolean;
  progress?: MissionProgress;
  error?: string;
}> {
  try {
    const response = await fetch('/api/game/progress/mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        missionId,
        isCompleted,
        puzzlesCompleted,
        roomsVisited
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Speichern des Mission-Fortschritts'
      };
    }

    return {
      success: true,
      progress: data.progress
    };
  } catch (error) {
    console.error('Fehler beim Speichern des Mission-Fortschritts:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Speichern des Mission-Fortschritts'
    };
  }
}

/**
 * Spieler-Fortschritt abrufen
 */
export async function getGameProgress(userId: number): Promise<{
  success: boolean;
  progress?: GameProgress;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/progress?userId=${userId}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Abrufen des Spieler-Fortschritts'
      };
    }

    return {
      success: true,
      progress: data.progress
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Spieler-Fortschritts:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen des Spieler-Fortschritts'
    };
  }
}

/**
 * Raum wechseln und Fortschritt speichern
 */
export async function changeRoom(
  userId: number,
  roomId: string,
  missionId?: string
): Promise<{
  success: boolean;
  newRoom?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/game/progress/room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        roomId,
        missionId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Raumwechsel'
      };
    }

    return {
      success: true,
      newRoom: data.newRoom
    };
  } catch (error) {
    console.error('Fehler beim Raumwechsel:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Raumwechsel'
    };
  }
}

/**
 * Item verwenden und Fortschritt aktualisieren
 */
export async function useItem(
  userId: number,
  itemId: string,
  targetId?: string // Rätsel-ID, Raum-ID, etc.
): Promise<{
  success: boolean;
  itemUsed?: boolean;
  progressUpdated?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/game/progress/item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        itemId,
        targetId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Verwenden des Items'
      };
    }

    return {
      success: true,
      itemUsed: data.itemUsed,
      progressUpdated: data.progressUpdated
    };
  } catch (error) {
    console.error('Fehler beim Verwenden des Items:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Verwenden des Items'
    };
  }
} 