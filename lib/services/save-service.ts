/**
 * Save Service für automatisches und manuelles Speichern des Spielstands
 */

export interface SaveEvent {
  type: 'puzzle_solved' | 'mission_completed' | 'room_entered' | 'item_collected' | 'manual_save' | 'game_started' | 'intro_modal_completed';
  data: any;
  timestamp: string;
}

export interface SaveResult {
  success: boolean;
  message: string;
  saveId?: string;
  error?: string;
}

/**
 * Automatisches Speichern nach wichtigen Ereignissen
 */
export async function autoSave(
  userId: number,
  event: SaveEvent
): Promise<SaveResult> {
  try {
    const response = await fetch('/api/game/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        event,
        isAutoSave: true
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Automatisches Speichern fehlgeschlagen',
        error: data.error || 'Unbekannter Fehler'
      };
    }

    return {
      success: true,
      message: 'Spielstand automatisch gespeichert',
      saveId: data.saveId
    };
  } catch (error) {
    console.error('Fehler beim automatischen Speichern:', error);
    return {
      success: false,
      message: 'Netzwerkfehler beim automatischen Speichern',
      error: 'Netzwerkfehler'
    };
  }
}

/**
 * Manuelles Speichern des Spielstands
 */
export async function manualSave(userId: number): Promise<SaveResult> {
  try {
    const response = await fetch('/api/game/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        event: {
          type: 'manual_save',
          data: { reason: 'Manueller Speichervorgang' },
          timestamp: new Date().toISOString()
        },
        isAutoSave: false
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Manuelles Speichern fehlgeschlagen',
        error: data.error || 'Unbekannter Fehler'
      };
    }

    return {
      success: true,
      message: 'Spielstand erfolgreich gespeichert',
      saveId: data.saveId
    };
  } catch (error) {
    console.error('Fehler beim manuellen Speichern:', error);
    return {
      success: false,
      message: 'Netzwerkfehler beim manuellen Speichern',
      error: 'Netzwerkfehler'
    };
  }
}

/**
 * Speicherpunkte abrufen
 */
export async function getSavePoints(userId: number): Promise<{
  success: boolean;
  savePoints?: Array<{
    id: string;
    timestamp: string;
    eventType: string;
    description: string;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/save?userId=${userId}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Abrufen der Speicherpunkte'
      };
    }

    return {
      success: true,
      savePoints: data.savePoints
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Speicherpunkte:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen der Speicherpunkte'
    };
  }
}

/**
 * Spielstand von einem Speicherpunkt laden
 */
export async function loadFromSavePoint(
  userId: number,
  saveId: string
): Promise<{
  success: boolean;
  gameState?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/save/${saveId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Laden des Spielstands'
      };
    }

    return {
      success: true,
      gameState: data.gameState
    };
  } catch (error) {
    console.error('Fehler beim Laden des Spielstands:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Laden des Spielstands'
    };
  }
}

/**
 * Speicherpunkt löschen
 */
export async function deleteSavePoint(
  userId: number,
  saveId: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/save/${saveId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Löschen des Speicherpunkts'
      };
    }

    return {
      success: true,
      message: 'Speicherpunkt erfolgreich gelöscht'
    };
  } catch (error) {
    console.error('Fehler beim Löschen des Speicherpunkts:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Löschen des Speicherpunkts'
    };
  }
} 