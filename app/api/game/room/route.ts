import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery } from '@/lib/database';

/**
 * Raumdaten abrufen
 * GET /api/game/room?roomId=X
 * 
 * Liest die Raumdaten aus der DB:
 * - Beschreibung, Hintergrund
 * - Liste der Objekte (Puzzles, Items, NPCs)
 * - Verbindungen zu anderen Räumen
 * - Level-Anforderungen
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { searchParams } = new URL(request.url);
      const roomId = searchParams.get('roomId') || searchParams.get('id');

      // Validierung der Eingabeparameter
      if (!roomId) {
        return NextResponse.json({
          success: false,
          error: 'roomId Parameter ist erforderlich'
        }, { status: 400 });
      }

      // Prüfen ob nur Items abgerufen werden sollen
      const itemsOnly = searchParams.get('items') === 'true';

      if (itemsOnly) {
        // Nur Items im Raum abrufen
        const roomItems = await executeQuery<{
          id: number;
          item_id: string;
          quantity: number;
          position_x: number;
          position_y: number;
          name: string;
          description: string;
          type: string;
          rarity: string;
          value: number;
          is_stackable: boolean;
          max_stack_size: number;
          icon: string | null;
        }>(
          `SELECT 
            ri.id,
            ri.item_id,
            ri.quantity,
            ri.position_x,
            ri.position_y,
            i.name,
            i.description,
            i.type,
            i.rarity,
            i.value,
            i.is_stackable,
            i.max_stack_size,
            i.icon
          FROM room_items ri
          JOIN items i ON ri.item_id = i.id
          WHERE ri.room_id = ? AND ri.is_available = true
          ORDER BY ri.created_at DESC`,
          [roomId]
        );

        // Items in das erwartete Format konvertieren
        const items = roomItems.map(row => ({
          id: row.item_id,
          name: row.name,
          type: row.type,
          quantity: row.quantity,
          description: row.description,
          rarity: row.rarity,
          value: row.value,
          isStackable: row.is_stackable,
          maxStackSize: row.max_stack_size,
          icon: row.icon,
          position: {
            x: row.position_x,
            y: row.position_y
          }
        }));

        return NextResponse.json({
          success: true,
          items,
          count: items.length
        });
      }

      // Raumdaten aus der Datenbank abrufen
      const roomData = await executeQuerySingle<{
        id: number;
        room_id: string;
        mission_id: string | null;
        name: string;
        description: string;
        background_image: string | null;
        is_locked: boolean;
        required_level: number;
        required_items: string;
        required_puzzles: string;
        connections: string;
        ambient_sound: string | null;
        created_at: string;
        updated_at: string;
      }>(
        'SELECT * FROM rooms WHERE room_id = ?',
        [roomId]
      );

      if (!roomData) {
        return NextResponse.json({
          success: false,
          error: 'Raum nicht gefunden'
        }, { status: 404 });
      }

      // Prüfen ob Spieler das Level für diesen Raum hat
      const userLevel = await executeQuerySingle<{ level: number }>(
        'SELECT level FROM game_states WHERE user_id = ?',
        [userId]
      );

      if (!userLevel || userLevel.level < roomData.required_level) {
        return NextResponse.json({
          success: false,
          error: `Level ${roomData.required_level} erforderlich (aktuell: ${userLevel?.level || 0})`
        }, { status: 403 });
      }

      // Prüfen ob Raum gesperrt ist
      if (roomData.is_locked) {
        return NextResponse.json({
          success: false,
          error: 'Raum ist gesperrt'
        }, { status: 403 });
      }

      // Rätsel in diesem Raum abrufen
      const puzzles = await executeQuery<{
        id: number;
        puzzle_id: string;
        room_id: string;
        name: string;
        description: string;
        puzzle_type: string;
        difficulty: number;
        solution: string;
        hints: string;
        max_attempts: number;
        time_limit_seconds: number | null;
        reward_money: number;
        reward_exp: number;
        reward_items: string;
        is_required: boolean;
        is_hidden: boolean;
      }>(
        'SELECT * FROM puzzles WHERE room_id = ? ORDER BY is_required DESC, difficulty ASC',
        [roomId]
      );

      // Items in diesem Raum abrufen
      const roomItems = await executeQuery<{
        id: number;
        item_id: string;
        quantity: number;
        position_x: number;
        position_y: number;
        name: string;
        description: string;
        type: string;
        rarity: string;
        value: number;
        is_stackable: boolean;
        max_stack_size: number;
        icon: string | null;
      }>(
        `SELECT 
          ri.id,
          ri.item_id,
          ri.quantity,
          ri.position_x,
          ri.position_y,
          i.name,
          i.description,
          i.type,
          i.rarity,
          i.value,
          i.is_stackable,
          i.max_stack_size,
          i.icon
         FROM room_items ri
        JOIN items i ON ri.item_id = i.id
        WHERE ri.room_id = ? AND ri.is_available = true
        ORDER BY ri.created_at DESC`,
        [roomId]
      );

      // Spieler-Fortschritt bei Rätseln abrufen
      const puzzleProgress = await executeQuery<{
        puzzle_id: string;
        is_completed: boolean;
        attempts: number;
        best_time_seconds: number | null;
        completed_at: string | null;
        hints_used: number;
      }>(
        'SELECT puzzle_id, is_completed, attempts, best_time_seconds, completed_at, hints_used FROM puzzle_progress WHERE user_id = ? AND puzzle_id IN (SELECT puzzle_id FROM puzzles WHERE room_id = ?)',
        [userId, roomId]
      );

      // Missiondaten abrufen (falls Raum zu Mission gehört)
      let missionData = null;
      if (roomData.mission_id) {
        missionData = await executeQuerySingle<{
          mission_id: string;
          name: string;
          description: string;
          difficulty: number;
          required_level: number;
          reward_money: number;
          reward_exp: number;
        }>(
          'SELECT * FROM missions WHERE mission_id = ?',
          [roomData.mission_id]
        );
      }

      // JSON-Strings parsen
      const parsedRoomData = {
        roomId: roomData.room_id,
        name: roomData.name,
        description: roomData.description,
        backgroundImage: roomData.background_image,
        ambientSound: roomData.ambient_sound,
        isLocked: roomData.is_locked,
        requiredLevel: roomData.required_level,
        requiredItems: JSON.parse(roomData.required_items || '[]'),
        requiredPuzzles: JSON.parse(roomData.required_puzzles || '[]'),
        connections: JSON.parse(roomData.connections || '{}'),
        missionId: roomData.mission_id,
        createdAt: roomData.created_at,
        updatedAt: roomData.updated_at
      };

      // Rätsel formatieren
      const formattedPuzzles = puzzles.map(puzzle => {
        const progress = puzzleProgress.find(p => p.puzzle_id === puzzle.puzzle_id);
        return {
          puzzleId: puzzle.puzzle_id,
          name: puzzle.name,
          description: puzzle.description,
          puzzleType: puzzle.puzzle_type,
          difficulty: puzzle.difficulty,
          solution: JSON.parse(puzzle.solution),
          hints: JSON.parse(puzzle.hints || '[]'),
          maxAttempts: puzzle.max_attempts,
          timeLimitSeconds: puzzle.time_limit_seconds,
          rewardMoney: puzzle.reward_money,
          rewardExp: puzzle.reward_exp,
          rewardItems: JSON.parse(puzzle.reward_items || '[]'),
          isRequired: puzzle.is_required,
          isHidden: puzzle.is_hidden,
          progress: progress ? {
            isCompleted: progress.is_completed,
            attempts: progress.attempts,
            bestTimeSeconds: progress.best_time_seconds,
            completedAt: progress.completed_at,
            hintsUsed: progress.hints_used
          } : {
            isCompleted: false,
            attempts: 0,
            bestTimeSeconds: null,
            completedAt: null,
            hintsUsed: 0
          }
        };
      });

      // Items formatieren
      const items = roomItems.map(row => ({
        id: row.item_id,
        name: row.name,
        type: row.type,
        quantity: row.quantity,
        description: row.description,
        rarity: row.rarity,
        value: row.value,
        isStackable: row.is_stackable,
        maxStackSize: row.max_stack_size,
        icon: row.icon,
        position: {
          x: row.position_x,
          y: row.position_y
        }
      }));

      // Mission formatieren
      const formattedMissionData = missionData ? {
        missionId: missionData.mission_id,
        name: missionData.name,
        description: missionData.description,
        difficulty: missionData.difficulty,
        requiredLevel: missionData.required_level,
        rewardMoney: missionData.reward_money,
        rewardExp: missionData.reward_exp
      } : null;

      return NextResponse.json({
        success: true,
        room: parsedRoomData,
        puzzles: formattedPuzzles,
        items: items,
        mission: formattedMissionData,
        userLevel: userLevel?.level || 1
      });

    } catch (error) {
      console.error('Fehler beim Abrufen der Raumdaten:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 