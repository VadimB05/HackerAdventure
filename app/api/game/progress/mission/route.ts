import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // TODO: Echte Authentifizierung implementieren
    const userId = 1; // Später aus Session extrahieren

    const body = await request.json();
    const { missionId, isCompleted, puzzlesCompleted, roomsVisited } = body;

    if (!missionId || isCompleted === undefined) {
      return NextResponse.json(
        { success: false, error: 'missionId und isCompleted sind erforderlich' },
        { status: 400 }
      );
    }

    // Mission-Daten abrufen
    const mission = await executeQuerySingle<{
      id: number;
      mission_id: string;
      name: string;
      reward_exp: number;
      reward_bitcoins: number;
    }>(
      'SELECT id, mission_id, name, reward_exp, reward_bitcoins FROM missions WHERE mission_id = ?',
      [missionId]
    );

    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission nicht gefunden' },
        { status: 404 }
      );
    }

    // Aktuellen Mission-Fortschritt abrufen oder erstellen
    let progress = await executeQuerySingle<{
      id: number;
      is_completed: boolean;
      completed_at: string | null;
    }>(
      'SELECT * FROM mission_progress WHERE user_id = ? AND mission_id = ?',
      [userId, missionId]
    );

    if (!progress) {
      // Neuen Fortschritt erstellen
      await executeQuery(
        'INSERT INTO mission_progress (user_id, mission_id, is_completed, completed_at) VALUES (?, ?, ?, ?)',
        [userId, missionId, isCompleted, isCompleted ? new Date().toISOString() : null]
      );
    } else if (isCompleted && !progress.is_completed) {
      // Mission zum ersten Mal abschließen
      await executeQuery(
        'UPDATE mission_progress SET is_completed = ?, completed_at = ? WHERE user_id = ? AND mission_id = ?',
        [true, new Date().toISOString(), userId, missionId]
      );
    }

    // Belohnungen vergeben, wenn Mission zum ersten Mal abgeschlossen wurde
    let rewards = null;
    if (isCompleted && (!progress || !progress.is_completed)) {
      // Spieler-Statistiken aktualisieren
      await executeQuery(
        'UPDATE game_states SET experience_points = experience_points + ?, bitcoins = bitcoins + ? WHERE user_id = ?',
        [mission.reward_exp, mission.reward_bitcoins, userId]
      );

      // Level berechnen und aktualisieren
      const gameState = await executeQuerySingle<{
        experience_points: number;
        level: number;
      }>(
        'SELECT experience_points, level FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (gameState) {
        const newLevel = Math.floor(gameState.experience_points / 100) + 1;
        if (newLevel > gameState.level) {
          await executeQuery(
            'UPDATE game_states SET level = ? WHERE user_id = ?',
            [newLevel, userId]
          );
        }
      }

      rewards = {
        exp: mission.reward_exp,
        bitcoins: mission.reward_bitcoins
      };
    }

    // Aktualisierten Fortschritt zurückgeben
    const updatedProgress = await executeQuerySingle<{
      is_completed: boolean;
      completed_at: string | null;
    }>(
      'SELECT is_completed, completed_at FROM mission_progress WHERE user_id = ? AND mission_id = ?',
      [userId, missionId]
    );

    return NextResponse.json({
      success: true,
      progress: {
        missionId,
        isCompleted: updatedProgress?.is_completed || false,
        completedAt: updatedProgress?.completed_at || null,
        puzzlesCompleted: puzzlesCompleted || [],
        roomsVisited: roomsVisited || []
      },
      rewards
    });

  } catch (error) {
    console.error('Fehler beim Speichern des Mission-Fortschritts:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 