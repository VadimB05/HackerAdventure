import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery, executeQuerySingle } from '@/lib/database';

/**
 * Mission-Status für eine Stadt prüfen
 * GET /api/game/city/[cityId]/missions-status
 * 
 * Prüft ob alle erforderlichen Missionen in einer Stadt abgeschlossen sind
 * Wird verwendet um zu entscheiden ob "Step Forward" verfügbar ist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { cityId } = await params;

      console.log(`[DEBUG] Mission-Status prüfen für cityId: ${cityId}, userId: ${userId}`);

      // Prüfen ob die Stadt existiert
      const city = await executeQuerySingle<{city_id: string, name: string}>(
        'SELECT city_id, name FROM cities WHERE city_id = ?',
        [cityId]
      );

      if (!city) {
        console.log(`[DEBUG] Stadt nicht gefunden: ${cityId}`);
        return NextResponse.json({
          success: false,
          error: 'Stadt nicht gefunden'
        }, { status: 404 });
      }

      // Alle erforderlichen Missionen für diese Stadt abrufen
      const cityMissions = await executeQuery<{
        mission_id: string,
        building_number: number,
        building_name: string,
        is_required: boolean
      }>(
        'SELECT mission_id, building_number, building_name, is_required FROM city_missions WHERE city_id = ? AND is_required = true ORDER BY building_number',
        [cityId]
      );

      console.log(`[DEBUG] Gefundene Missionen für ${cityId}: ${cityMissions.length}`);

      if (cityMissions.length === 0) {
        console.log(`[DEBUG] Keine erforderlichen Missionen für Stadt: ${cityId}`);
        return NextResponse.json({
          success: true,
          cityId: cityId,
          cityName: city.name,
          allMissionsCompleted: true, // Wenn keine Missionen, dann "abgeschlossen"
          totalMissions: 0,
          completedMissions: 0,
          missions: []
        });
      }

      // Mission-IDs extrahieren
      const missionIds = cityMissions.map(m => m.mission_id);

      // Abgeschlossene Missionen abrufen
      const completedMissions = await executeQuery<{
        mission_id: string,
        is_completed: boolean,
        completed_at: string
      }>(
        `SELECT mission_id, is_completed, completed_at 
         FROM mission_progress 
         WHERE user_id = ? AND mission_id IN (${missionIds.map(() => '?').join(',')}) AND is_completed = true`,
        [userId, ...missionIds]
      );

      console.log(`[DEBUG] Abgeschlossene Missionen: ${completedMissions.length}/${cityMissions.length}`);

      // Status für jede Mission erstellen
      const missionStatus = cityMissions.map(cityMission => {
        const completed = completedMissions.find(cm => cm.mission_id === cityMission.mission_id);
        return {
          missionId: cityMission.mission_id,
          buildingNumber: cityMission.building_number,
          buildingName: cityMission.building_name,
          isRequired: cityMission.is_required,
          isCompleted: !!completed,
          completedAt: completed?.completed_at || null
        };
      });

      // Prüfen ob alle erforderlichen Missionen abgeschlossen sind
      const requiredMissions = cityMissions.filter(m => m.is_required);
      const completedRequiredMissions = completedMissions.filter(cm => 
        requiredMissions.some(rm => rm.mission_id === cm.mission_id)
      );

      const allMissionsCompleted = requiredMissions.length > 0 && 
        completedRequiredMissions.length === requiredMissions.length;

      console.log(`[DEBUG] Alle Missionen abgeschlossen: ${allMissionsCompleted}`);

      const response = {
        success: true,
        cityId: cityId,
        cityName: city.name,
        allMissionsCompleted: allMissionsCompleted,
        totalMissions: cityMissions.length,
        completedMissions: completedMissions.length,
        requiredMissions: requiredMissions.length,
        completedRequiredMissions: completedRequiredMissions.length,
        missions: missionStatus
      };

      console.log(`[DEBUG] Response:`, response);

      return NextResponse.json(response);

    } catch (error) {
      console.error('Fehler beim Prüfen des Mission-Status:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 