import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle, executeTransaction } from '@/lib/database';

/**
 * Mission-Belohnungen vergeben
 * POST /api/game/missions/[missionId]/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { missionId } = await params;

      console.log(`[DEBUG] Mission-Belohnungen vergeben für missionId: ${missionId}, userId: ${userId}`);

      // Prüfen, ob die Mission bereits abgeschlossen wurde
      const existingProgress = await executeQuerySingle<{is_completed: boolean}>(
        'SELECT is_completed FROM mission_progress WHERE user_id = ? AND mission_id = ?',
        [userId, missionId]
      );

      if (!existingProgress?.is_completed) {
        console.log(`[DEBUG] Mission noch nicht abgeschlossen`);
        return NextResponse.json({
          success: false,
          error: 'Mission noch nicht abgeschlossen'
        }, { status: 400 });
      }

      // Prüfen, ob Belohnungen bereits vergeben wurden
      const existingRewards = await executeQuerySingle<{rewards_claimed: boolean}>(
        'SELECT rewards_claimed FROM mission_progress WHERE user_id = ? AND mission_id = ?',
        [userId, missionId]
      );

      if (existingRewards?.rewards_claimed) {
        console.log(`[DEBUG] Belohnungen bereits vergeben`);
        return NextResponse.json({
          success: false,
          error: 'Belohnungen bereits vergeben'
        }, { status: 400 });
      }

      // Mission-Belohnungen abrufen
      const mission = await executeQuerySingle<{reward_bitcoins: number, reward_exp: number}>(
        'SELECT reward_bitcoins, reward_exp FROM missions WHERE mission_id = ?',
        [missionId]
      );

      if (!mission) {
        console.log(`[DEBUG] Mission nicht gefunden`);
        return NextResponse.json({
          success: false,
          error: 'Mission nicht gefunden'
        }, { status: 404 });
      }

      console.log(`[DEBUG] Mission-Belohnungen:`, mission);

      const transactionQueries = [];

      // Bitcoin-Belohnung vergeben
      if (mission.reward_bitcoins > 0) {
        transactionQueries.push({
          query: 'UPDATE game_states SET bitcoins = bitcoins + ? WHERE user_id = ?',
          params: [mission.reward_bitcoins, userId]
        });
        console.log(`[DEBUG] Bitcoin-Belohnung: +${mission.reward_bitcoins} BTC`);
      }

      // XP-Belohnung vergeben
      if (mission.reward_exp > 0) {
        transactionQueries.push({
          query: 'UPDATE game_states SET experience_points = experience_points + ?, level = FLOOR(1 + SQRT(experience_points / 100)) WHERE user_id = ?',
          params: [mission.reward_exp, userId]
        });
        console.log(`[DEBUG] XP-Belohnung: +${mission.reward_exp} XP`);
      }

      // Mission-Statistik aktualisieren
      if (mission.reward_bitcoins > 0 || mission.reward_exp > 0) {
        transactionQueries.push({
          query: 'UPDATE player_stats SET missions_completed = missions_completed + 1, total_bitcoins_earned = total_bitcoins_earned + ?, total_exp_earned = total_exp_earned + ? WHERE user_id = ?',
          params: [mission.reward_bitcoins, mission.reward_exp, userId]
        });
      }

      // Belohnungen als vergeben markieren
      transactionQueries.push({
        query: 'UPDATE mission_progress SET rewards_claimed = true, claimed_at = NOW() WHERE user_id = ? AND mission_id = ?',
        params: [userId, missionId]
      });

      // Transaktion ausführen
      if (transactionQueries.length > 0) {
        console.log(`[DEBUG] Führe ${transactionQueries.length} Transaktionen aus`);
        await executeTransaction(transactionQueries);
      }

      // Aktualisierte Bitcoin-Balance abrufen
      const updatedBalance = await executeQuerySingle<{bitcoins: number}>(
        'SELECT bitcoins FROM game_states WHERE user_id = ?',
        [userId]
      );

      const response = {
        success: true,
        missionId: missionId,
        rewards: {
          bitcoins: mission.reward_bitcoins,
          exp: mission.reward_exp
        },
        newBalance: updatedBalance?.bitcoins || 0
      };

      console.log(`[DEBUG] Response:`, response);

      return NextResponse.json(response);

    } catch (error) {
      console.error('Fehler beim Vergeben der Mission-Belohnungen:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 