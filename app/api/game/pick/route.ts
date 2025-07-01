import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeUpdate, executeQuery, connectDB } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Item aufsammeln
 * POST /api/game/pick
 * Body: { itemId: string, roomId: string }
 * 
 * Prüft ob das Item im Raum vorhanden ist und fügt es dem Spieler-Inventar hinzu.
 * Gibt aktualisierte Inventardaten zurück.
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    const db = await connectDB();
    try {
      const userId = req.user!.id;
      const { itemId, roomId } = await request.json();

      // Validierung der Eingabedaten
      if (!itemId || !roomId) {
        return NextResponse.json({
          success: false,
          error: 'itemId und roomId sind erforderlich'
        }, { status: 400 });
      }

      // Prüfen ob das Item im Raum vorhanden ist
      const roomItem = await executeQuerySingle<{
        id: number;
        room_id: string;
        item_id: string;
        quantity: number;
      }>(
        'SELECT * FROM room_items WHERE room_id = ? AND item_id = ?',
        [roomId, itemId]
      );

      if (!roomItem) {
        return NextResponse.json({
          success: false,
          error: 'Item ist in diesem Raum nicht vorhanden'
        }, { status: 404 });
      }

      // Prüfen ob der Spieler das Item bereits hat
      const existingInventoryItem = await executeQuerySingle<{
        id: number;
        user_id: number;
        item_id: string;
        quantity: number;
      }>(
        'SELECT * FROM player_inventory WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );

      // Item-Details abrufen
      const itemDetails = await executeQuerySingle<{
        item_id: string;
        name: string;
        description: string;
        item_type: string;
        rarity: string;
        value: number;
        is_stackable: boolean;
        max_stack_size: number;
      }>(
        'SELECT * FROM items WHERE item_id = ?',
        [itemId]
      );

      if (!itemDetails) {
        return NextResponse.json({
          success: false,
          error: 'Item nicht gefunden'
        }, { status: 404 });
      }

      // Transaktion starten
      await db.query('START TRANSACTION');
      try {
        if (existingInventoryItem) {
          // Item bereits vorhanden - Menge erhöhen (falls stapelbar)
          if (itemDetails.is_stackable) {
            const newQuantity = Math.min(
              existingInventoryItem.quantity + roomItem.quantity,
              itemDetails.max_stack_size
            );
            await executeUpdate(
              'UPDATE player_inventory SET quantity = ? WHERE user_id = ? AND item_id = ?',
              [newQuantity, userId, itemId]
            );
          } else {
            await db.query('ROLLBACK');
            return NextResponse.json({
              success: false,
              error: 'Item bereits im Inventar vorhanden und nicht stapelbar'
            }, { status: 409 });
          }
        } else {
          // Neues Item zum Inventar hinzufügen
          await executeUpdate(
            'INSERT INTO player_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
            [userId, itemId, roomItem.quantity]
          );
        }

        // Item aus dem Raum entfernen
        await executeUpdate(
          'DELETE FROM room_items WHERE room_id = ? AND item_id = ?',
          [roomId, itemId]
        );

        // Automatischen Savepoint erstellen für Item-Sammlung
        try {
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

          if (gameState) {
            // Savepoint-ID generieren
            const saveId = uuidv4();
            const timestamp = new Date().toISOString();

            // Savepoint in der Datenbank erstellen
            await executeUpdate(
              `INSERT INTO save_points (
                save_id, user_id, event_type, event_data, game_state_snapshot, 
                is_auto_save, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                saveId,
                userId,
                'item_collected',
                JSON.stringify({
                  itemId: itemId,
                  itemName: itemDetails.name,
                  roomId: roomId,
                  quantity: roomItem.quantity
                }),
                JSON.stringify({
                  currentRoom: gameState.current_room,
                  inventory: JSON.parse(gameState.inventory || '[]'),
                  progress: JSON.parse(gameState.progress || '{}'),
                  bitcoins: gameState.bitcoins,
                  experiencePoints: gameState.experience_points,
                  level: gameState.level,
                  currentMission: gameState.current_mission
                }),
                true, // Auto-Save
                timestamp
              ]
            );

            console.log(`Savepoint erstellt für Item-Sammlung: ${itemDetails.name}`);
          }
        } catch (saveError) {
          // Savepoint-Fehler nicht kritisch - nur loggen
          console.error('Fehler beim Erstellen des Savepoints:', saveError);
        }

        // Transaktion bestätigen
        await db.query('COMMIT');

        // Aktualisiertes Inventar abrufen
        const updatedInventory = await executeQuery<{
          item_id: string;
          name: string;
          description: string;
          item_type: string;
          rarity: string;
          value: number;
          is_stackable: boolean;
          max_stack_size: number;
          quantity: number;
        }>(
          `SELECT i.*, pi.quantity
           FROM player_inventory pi
           JOIN items i ON i.item_id = pi.item_id
           WHERE pi.user_id = ?
           ORDER BY i.rarity DESC, i.value DESC, i.name ASC`,
          [userId]
        );

        // Inventar formatieren
        const formattedInventory = updatedInventory.map(item => ({
          id: item.item_id,
          name: item.name,
          description: item.description,
          type: item.item_type,
          rarity: item.rarity,
          value: item.value,
          isStackable: item.is_stackable,
          maxStackSize: item.max_stack_size,
          quantity: item.quantity
        }));

        return NextResponse.json({
          success: true,
          message: `${itemDetails.name} aufgesammelt!`,
          inventory: formattedInventory
        });
      } catch (err) {
        await db.query('ROLLBACK');
        console.error('Fehler beim Aufsammeln des Items:', err);
        return NextResponse.json({
          success: false,
          error: 'Interner Serverfehler beim Aufsammeln des Items'
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Fehler beim Aufsammeln des Items:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Serverfehler beim Aufsammeln des Items'
      }, { status: 500 });
    }
  })(request);
} 