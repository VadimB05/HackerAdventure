import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle } from '@/lib/database';

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

    const body = await request.json();
    const { roomId, missionId } = body;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'roomId ist erforderlich' },
        { status: 400 }
      );
    }

    // Raum-Daten abrufen
    const room = await executeQuerySingle<{
      id: number;
      room_id: string;
      name: string;
      is_locked: boolean;
      required_level: number;
      required_items: string;
      mission_id: string | null;
    }>(
      'SELECT * FROM rooms WHERE room_id = ?',
      [roomId]
    );

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Raum nicht gefunden' },
        { status: 404 }
      );
    }

    // Spieler-Status abrufen
    const gameState = await executeQuerySingle<{
      level: number;
      inventory: string;
      current_room: string;
    }>(
      'SELECT level, inventory, current_room FROM game_states WHERE user_id = ?',
      [userId]
    );

    if (!gameState) {
      return NextResponse.json(
        { success: false, error: 'Spieler-Status nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Raum gesperrt ist
    if (room.is_locked) {
      // Level-Anforderung prüfen
      if (gameState.level < room.required_level) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Level ${room.required_level} erforderlich (aktuell: ${gameState.level})` 
          },
          { status: 403 }
        );
      }

      // Item-Anforderungen prüfen
      if (room.required_items) {
        try {
          const requiredItems = JSON.parse(room.required_items);
          const playerInventory = JSON.parse(gameState.inventory || '[]');
          
          for (const requiredItem of requiredItems) {
            if (!playerInventory.includes(requiredItem)) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: `Item "${requiredItem}" erforderlich` 
                },
                { status: 403 }
              );
            }
          }
        } catch (error) {
          console.error('Fehler beim Parsen der Item-Anforderungen:', error);
        }
      }
    }

    // Mission-Anforderungen prüfen
    if (roomId === 'city1') {
      // Prüfe ob mission1_crypto_bank abgeschlossen ist
      const missionProgress = await executeQuerySingle<{is_completed: boolean}>(
        'SELECT is_completed FROM mission_progress WHERE user_id = ? AND mission_id = ?',
        [userId, 'mission1_crypto_bank']
      );

      if (!missionProgress || !missionProgress.is_completed) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Du musst zuerst die Crypto Bank Mission abschließen, bevor du die Stadt betreten kannst.' 
          },
          { status: 403 }
        );
      }
    }

    // Prüfe ob alle Missionen in city1 abgeschlossen sind, bevor zu city2 gewechselt werden kann
    if (roomId === 'city2') {
      // Alle erforderlichen Missionen für city1 abrufen
      const city1Missions = await executeQuery<{mission_id: string}>(
        'SELECT mission_id FROM city_missions WHERE city_id = ? AND is_required = true',
        ['city1']
      );

      if (city1Missions.length > 0) {
        // Prüfe ob alle Missionen abgeschlossen sind
        const missionIds = city1Missions.map(m => m.mission_id);
        const completedMissions = await executeQuery<{mission_id: string}>(
          `SELECT mission_id FROM mission_progress WHERE user_id = ? AND mission_id IN (${missionIds.map(() => '?').join(',')}) AND is_completed = true`,
          [userId, ...missionIds]
        );

        if (completedMissions.length < city1Missions.length) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Du musst zuerst alle Missionen in dieser Stadt abschließen, bevor du zur nächsten Stadt weitergehen kannst.' 
            },
            { status: 403 }
          );
        }
      }
    }

    // Raumwechsel durchführen
    await executeQuery(
      'UPDATE game_states SET current_room = ?, current_mission = ? WHERE user_id = ?',
      [roomId, missionId || room.mission_id, userId]
    );

    // Raum-Besuch protokollieren (Tabelle existiert noch nicht)
    // await executeQuery(
    //   'INSERT INTO room_visits (user_id, room_id, mission_id) VALUES (?, ?, ?)',
    //   [userId, roomId, missionId || room.mission_id]
    // );

    // Statistiken aktualisieren
    await executeQuery(
      'UPDATE player_stats SET rooms_visited = rooms_visited + 1 WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      success: true,
      newRoom: roomId,
      roomName: room.name,
      message: `Willkommen im ${room.name}!`
    });

    } catch (error) {
      console.error('Fehler beim Raumwechsel:', error);
      return NextResponse.json(
        { success: false, error: 'Interner Server-Fehler' },
        { status: 500 }
      );
    }
  })(request);
} 