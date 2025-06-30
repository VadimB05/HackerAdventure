import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle, executeTransaction } from '@/lib/database';

/**
 * Mission-Progress prüfen und aktualisieren
 * POST /api/game/progress/mission
 * Body: { roomId: string }
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const body = await request.json();
      const { roomId } = body;

      console.log(`[DEBUG] Mission-Progress-API aufgerufen für roomId: ${roomId}, userId: ${userId}`);

      let missionId: string | null = null;

      if (roomId) {
        // Mission-ID für den Raum abrufen
        const room = await executeQuerySingle<{mission_id: string}>(
          'SELECT mission_id FROM rooms WHERE room_id = ?',
          [roomId]
        );

        console.log(`[DEBUG] Raum gefunden:`, room);

        if (room && room.mission_id) {
          missionId = room.mission_id;
        }
      }

      // Fallback: Aktuelle Mission des Spielers abrufen
      if (!missionId) {
        const currentMission = await executeQuerySingle<{current_mission: string}>(
          'SELECT current_mission FROM game_states WHERE user_id = ?',
          [userId]
        );

        if (currentMission && currentMission.current_mission) {
          missionId = currentMission.current_mission;
          console.log(`[DEBUG] Verwende aktuelle Mission: ${missionId}`);
        } else {
          // Fallback: Erste verfügbare Mission verwenden
          const firstMission = await executeQuerySingle<{mission_id: string}>(
            'SELECT mission_id FROM missions ORDER BY required_level ASC LIMIT 1',
            []
          );

          if (firstMission) {
            missionId = firstMission.mission_id;
            console.log(`[DEBUG] Verwende erste verfügbare Mission: ${missionId}`);
          }
        }
      }

      if (!missionId) {
        console.log(`[DEBUG] Keine Mission gefunden`);
        return NextResponse.json({
          success: false,
          error: 'Keine Mission gefunden'
        }, { status: 404 });
      }

      console.log(`[DEBUG] Mission-ID: ${missionId}`);

      // Alle erforderlichen Rätsel der Mission abrufen
      const missionPuzzles = await executeQuery<{puzzle_id: string, is_required: boolean}>(
        `SELECT p.puzzle_id, p.is_required 
         FROM puzzles p 
         JOIN rooms r ON p.room_id = r.room_id 
         WHERE r.mission_id = ? AND p.is_required = true`,
        [missionId]
      );

      console.log(`[DEBUG] Mission-Rätsel gefunden: ${missionPuzzles.length}`);

      if (missionPuzzles.length === 0) {
        console.log(`[DEBUG] Keine erforderlichen Rätsel für Mission: ${missionId}`);
        return NextResponse.json({
          success: false,
          error: 'Keine erforderlichen Rätsel für diese Mission gefunden'
        }, { status: 404 });
      }

      // Gelöste Rätsel abrufen
      const solvedPuzzles = await executeQuery<{puzzle_id: string}>(
        `SELECT pp.puzzle_id 
         FROM puzzle_progress pp 
         WHERE pp.user_id = ? AND pp.is_completed = true AND pp.puzzle_id IN (${missionPuzzles.map(() => '?').join(',')})`,
        [userId, ...missionPuzzles.map(p => p.puzzle_id)]
      );

      console.log(`[DEBUG] Gelöste Rätsel: ${solvedPuzzles.length}/${missionPuzzles.length}`);

      const isMissionCompleted = solvedPuzzles.length === missionPuzzles.length;

      console.log(`[DEBUG] Mission abgeschlossen: ${isMissionCompleted}`);

      // Mission-Progress aktualisieren
      const transactionQueries = [];

      // Mission-Belohnungen abrufen
      const mission = await executeQuerySingle<{reward_bitcoins: number, reward_exp: number}>(
        'SELECT reward_bitcoins, reward_exp FROM missions WHERE mission_id = ?',
        [missionId]
      );

      console.log(`[DEBUG] Mission-Belohnungen:`, mission);

      if (isMissionCompleted) {
        console.log(`[DEBUG] Markiere Mission als abgeschlossen und vergebe Belohnungen`);
        
        // Mission als abgeschlossen markieren
        transactionQueries.push({
          query: `INSERT INTO mission_progress (user_id, mission_id, is_completed, completed_at) 
                  VALUES (?, ?, true, NOW()) 
                  ON DUPLICATE KEY UPDATE 
                  is_completed = true, 
                  completed_at = NOW()`,
          params: [userId, missionId]
        });

        if (mission) {
          // Bitcoin-Belohnung vergeben
          if (mission.reward_bitcoins > 0) {
            transactionQueries.push({
              query: 'UPDATE game_states SET bitcoins = bitcoins + ? WHERE user_id = ?',
              params: [mission.reward_bitcoins, userId]
            });
          }

          // XP-Belohnung vergeben
          if (mission.reward_exp > 0) {
            transactionQueries.push({
              query: 'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
              params: [mission.reward_exp, userId]
            });
          }

          // Statistik aktualisieren
          transactionQueries.push({
            query: 'UPDATE player_stats SET missions_completed = missions_completed + 1, total_bitcoins_earned = total_bitcoins_earned + ?, total_exp_earned = total_exp_earned + ? WHERE user_id = ?',
            params: [mission.reward_bitcoins, mission.reward_exp, userId]
          });
        }
      }

      // Transaktion ausführen
      if (transactionQueries.length > 0) {
        console.log(`[DEBUG] Führe ${transactionQueries.length} Transaktionen aus`);
        await executeTransaction(transactionQueries);
      }

      const response = {
        success: true,
        missionId: missionId,
        isCompleted: isMissionCompleted,
        solvedPuzzles: solvedPuzzles.length,
        totalPuzzles: missionPuzzles.length,
        rewards: {
          bitcoins: mission?.reward_bitcoins || 0,
          exp: mission?.reward_exp || 0
        }
      };

      console.log(`[DEBUG] Response:`, response);

      return NextResponse.json(response);

    } catch (error) {
      console.error('Fehler beim Prüfen des Mission-Progress:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 