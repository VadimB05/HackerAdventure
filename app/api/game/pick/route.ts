import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeUpdate, executeQuery } from '@/lib/database';

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
      await executeUpdate('START TRANSACTION');

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

        // Transaktion bestätigen
        await executeUpdate('COMMIT');

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
          type: item.item_type,
          quantity: item.quantity,
          description: item.description,
          rarity: item.rarity,
          value: item.value,
          isStackable: item.is_stackable,
          maxStackSize: item.max_stack_size
        }));

        return NextResponse.json({
          success: true,
          message: `${itemDetails.name} erfolgreich aufgesammelt`,
          item: {
            id: itemDetails.item_id,
            name: itemDetails.name,
            type: itemDetails.item_type,
            quantity: roomItem.quantity,
            description: itemDetails.description,
            rarity: itemDetails.rarity
          },
          inventory: formattedInventory,
          count: formattedInventory.length
        }, { status: 201 });

      } catch (error) {
        // Transaktion rückgängig machen bei Fehler
        await executeUpdate('ROLLBACK');
        throw error;
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