import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Spielstand speichern (automatisch oder manuell)
 * POST /api/game/save
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const body = await request.json();
      const { event, isAutoSave = false } = body;

      if (!event || !event.type) {
        return NextResponse.json({
          success: false,
          error: 'Event-Daten sind erforderlich'
        }, { status: 400 });
      }

      // Aktuellen Spielstand abrufen
      const gameState = await executeQuerySingle<{
        id: number;
        current_room: string;
        inventory: string;
        progress: string;
        bitcoins: number;
        experience_points: number;
        level: number;
        current_mission: string | null;
      }>(
        'SELECT * FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (!gameState) {
        return NextResponse.json({
          success: false,
          error: 'Kein Spielstand gefunden'
        }, { status: 404 });
      }

      // Speicherpunkt-ID generieren
      const saveId = uuidv4();
      const timestamp = new Date().toISOString();

      // Speicherpunkt in der Datenbank erstellen
      await executeUpdate(
        `INSERT INTO save_points (
          save_id, user_id, event_type, event_data, game_state_snapshot, 
          is_auto_save, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          saveId,
          userId,
          event.type,
          JSON.stringify(event.data),
          JSON.stringify({
            currentRoom: gameState.current_room,
            inventory: JSON.parse(gameState.inventory || '[]'),
            progress: JSON.parse(gameState.progress || '{}'),
            bitcoins: gameState.bitcoins,
            experiencePoints: gameState.experience_points,
            level: gameState.level,
            currentMission: gameState.current_mission
          }),
          isAutoSave,
          timestamp
        ]
      );

      // Bei automatischem Speichern alte Auto-Saves löschen (max. 10 behalten)
      if (isAutoSave) {
        const oldAutoSaves = await executeQuery<{ save_id: string }>(
          'SELECT save_id FROM save_points WHERE user_id = ? AND is_auto_save = true ORDER BY created_at DESC LIMIT 10, 1000',
          [userId]
        );

        if (oldAutoSaves.length > 0) {
          const oldSaveIds = oldAutoSaves.map(save => save.save_id);
          await executeUpdate(
            'DELETE FROM save_points WHERE save_id IN (?)',
            [oldSaveIds]
          );
        }
      }

      // Erfolgs-Response
      return NextResponse.json({
        success: true,
        message: isAutoSave ? 'Spielstand automatisch gespeichert' : 'Spielstand erfolgreich gespeichert',
        saveId,
        timestamp,
        eventType: event.type
      }, { status: 201 });

    } catch (error) {
      console.error('Fehler beim Speichern des Spielstands:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
}

/**
 * Speicherpunkte abrufen
 * GET /api/game/save
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Speicherpunkte abrufen
      const savePoints = await executeQuery<{
        save_id: string;
        event_type: string;
        event_data: string;
        is_auto_save: boolean;
        created_at: string;
      }>(
        `SELECT save_id, event_type, event_data, is_auto_save, created_at 
         FROM save_points 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      // Speicherpunkte formatieren
      const formattedSavePoints = savePoints.map(save => {
        const eventData = JSON.parse(save.event_data || '{}');
        let description = '';

        switch (save.event_type) {
          case 'puzzle_solved':
            description = `Rätsel gelöst: ${eventData.puzzleName || 'Unbekanntes Rätsel'}`;
            break;
          case 'mission_completed':
            description = `Mission abgeschlossen: ${eventData.missionName || 'Unbekannte Mission'}`;
            break;
          case 'room_entered':
            description = `Raum betreten: ${eventData.roomName || 'Unbekannter Raum'}`;
            break;
          case 'item_collected':
            description = `Item gesammelt: ${eventData.itemName || 'Unbekanntes Item'}`;
            break;
          case 'manual_save':
            description = 'Manueller Speicherpunkt';
            break;
          default:
            description = 'Speicherpunkt';
        }

        return {
          id: save.save_id,
          timestamp: save.created_at,
          eventType: save.event_type,
          description,
          isAutoSave: save.is_auto_save,
          eventData
        };
      });

      return NextResponse.json({
        success: true,
        savePoints: formattedSavePoints,
        total: formattedSavePoints.length
      }, { status: 200 });

    } catch (error) {
      console.error('Fehler beim Abrufen der Speicherpunkte:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 