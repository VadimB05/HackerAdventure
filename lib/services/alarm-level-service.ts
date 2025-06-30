/**
 * Alarm-Level-Service
 * 
 * WICHTIG: Dieser Service darf nur im Backend (Server-Side) verwendet werden!
 * Im Frontend verwende die API-Route /api/game/alarm-level
 */

import { executeQuery, executeUpdate, executeTransaction } from '@/lib/database';

export interface AlarmLevelHistory {
  id: number;
  user_id: number;
  alarm_level: number;
  reason: string;
  puzzle_id?: string;
  mission_id?: string;
  created_at: string;
}

export interface PlayerAlarmStats {
  current_alarm_level: number;
  max_alarm_level_reached: number;
  total_alarm_increases: number;
}

export class AlarmLevelService {
  /**
   * Erhöht das Alarm-Level eines Spielers
   */
  static async increaseAlarmLevel(
    userId: number, 
    reason: string, 
    puzzleId?: string, 
    missionId?: string
  ): Promise<{ success: boolean; newLevel: number; error?: string }> {
    try {
      // Aktuelles Alarm-Level abrufen
      const currentStats = await this.getPlayerAlarmStats(userId);
      const newLevel = Math.min(currentStats.current_alarm_level + 1, 10);

      // Transaktion mit allen Queries
      await executeTransaction([
        {
          query: `
            UPDATE player_stats 
            SET current_alarm_level = ?, 
                max_alarm_level_reached = GREATEST(max_alarm_level_reached, ?),
                total_alarm_increases = total_alarm_increases + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `,
          params: [newLevel, newLevel, userId]
        },
        {
          query: `
            INSERT INTO alarm_level_history (user_id, alarm_level, reason, puzzle_id, mission_id)
            VALUES (?, ?, ?, ?, ?)
          `,
          params: [userId, newLevel, reason, puzzleId || null, missionId || null]
        }
      ]);

      return { success: true, newLevel };
    } catch (error) {
      console.error('Fehler beim Erhöhen des Alarm-Levels:', error);
      return { 
        success: false, 
        newLevel: 0, 
        error: 'Fehler beim Erhöhen des Alarm-Levels' 
      };
    }
  }

  /**
   * Setzt das Alarm-Level auf 0 zurück
   */
  static async resetAlarmLevel(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await executeUpdate(`
        UPDATE player_stats 
        SET current_alarm_level = 0, 
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [userId]);

      return { success: true };
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Alarm-Levels:', error);
      return { 
        success: false, 
        error: 'Fehler beim Zurücksetzen des Alarm-Levels' 
      };
    }
  }

  /**
   * Ruft die Alarm-Level-Statistiken eines Spielers ab
   */
  static async getPlayerAlarmStats(userId: number): Promise<PlayerAlarmStats> {
    try {
      const result = await executeQuery(`
        SELECT current_alarm_level, max_alarm_level_reached, total_alarm_increases
        FROM player_stats 
        WHERE user_id = ?
      `, [userId]);

      if (result.length === 0) {
        // Spieler-Statistiken erstellen falls nicht vorhanden
        await executeQuery(`
          INSERT INTO player_stats (user_id, current_alarm_level, max_alarm_level_reached, total_alarm_increases)
          VALUES (?, 0, 0, 0)
        `, [userId]);

        return {
          current_alarm_level: 0,
          max_alarm_level_reached: 0,
          total_alarm_increases: 0
        };
      }

      return result[0] as PlayerAlarmStats;
    } catch (error) {
      console.error('Fehler beim Abrufen der Alarm-Level-Statistiken:', error);
      return {
        current_alarm_level: 0,
        max_alarm_level_reached: 0,
        total_alarm_increases: 0
      };
    }
  }

  /**
   * Ruft die Alarm-Level-Historie eines Spielers ab
   */
  static async getAlarmLevelHistory(
    userId: number, 
    limit: number = 10
  ): Promise<AlarmLevelHistory[]> {
    try {
      const result = await executeQuery(`
        SELECT id, user_id, alarm_level, reason, puzzle_id, mission_id, created_at
        FROM alarm_level_history 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [userId, limit]);

      return result as AlarmLevelHistory[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Alarm-Level-Historie:', error);
      return [];
    }
  }

  /**
   * Erstellt Spieler-Statistiken falls nicht vorhanden
   */
  static async ensurePlayerStats(userId: number): Promise<void> {
    try {
      const result = await executeQuery(`
        SELECT id FROM player_stats WHERE user_id = ?
      `, [userId]);

      if (result.length === 0) {
        await executeQuery(`
          INSERT INTO player_stats (user_id, current_alarm_level, max_alarm_level_reached, total_alarm_increases)
          VALUES (?, 0, 0, 0)
        `, [userId]);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Spieler-Statistiken:', error);
    }
  }
} 