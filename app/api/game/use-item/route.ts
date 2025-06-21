import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export interface UseItemRequest {
  itemId: string;
  targetObjectId: string;
  roomId: string;
}

export interface UseItemResponse {
  success: boolean;
  message?: string;
  error?: string;
  inventory?: any[];
  unlockedFeatures?: string[];
  newPuzzles?: any[];
  roomChanges?: any;
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const body: UseItemRequest = await request.json();

      // Validierung der Eingabeparameter
      if (!body.itemId || !body.targetObjectId || !body.roomId) {
        return NextResponse.json({
          success: false,
          error: 'itemId, targetObjectId und roomId sind erforderlich'
        }, { status: 400 });
      }

      // Prüfen ob Spieler das Item im Inventar hat
      const playerItem = await executeQuerySingle<{
        id: number;
        item_id: string;
        quantity: number;
      }>(
        'SELECT * FROM player_inventory WHERE user_id = ? AND item_id = ?',
        [userId, body.itemId]
      );

      if (!playerItem || playerItem.quantity <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Item nicht im Inventar verfügbar'
        }, { status: 400 });
      }

      // Raum-Objekt abrufen
      const roomObject = await executeQuerySingle<{
        id: number;
        object_id: string;
        room_id: string;
        name: string;
        type: string;
        compatible_items: string;
        required_items: string;
        is_interactable: boolean;
        status: string;
      }>(
        'SELECT * FROM room_objects WHERE object_id = ? AND room_id = ?',
        [body.targetObjectId, body.roomId]
      );

      if (!roomObject) {
        return NextResponse.json({
          success: false,
          error: 'Zielobjekt nicht gefunden'
        }, { status: 404 });
      }

      if (!roomObject.is_interactable) {
        return NextResponse.json({
          success: false,
          error: 'Objekt ist nicht interaktiv'
        }, { status: 400 });
      }

      // Kompatibilität prüfen
      const compatibleItems = JSON.parse(roomObject.compatible_items || '[]');
      const requiredItems = JSON.parse(roomObject.required_items || '[]');
      
      const isCompatible = compatibleItems.includes(body.itemId);
      const isRequired = requiredItems.includes(body.itemId);

      if (!isCompatible && !isRequired) {
        return NextResponse.json({
          success: false,
          error: 'Item ist nicht mit diesem Objekt kompatibel'
        }, { status: 400 });
      }

      // Transaktion starten
      await executeQuery('START TRANSACTION');

      try {
        // Item aus Inventar entfernen (falls es verbraucht wird)
        let itemConsumed = false;
        let newInventory = null;

        // Bestimmte Items werden verbraucht
        const consumableItems = ['energy_drink', 'hacking_manual'];
        if (consumableItems.includes(body.itemId)) {
          await executeQuery(
            'UPDATE player_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0',
            [userId, body.itemId]
          );
          
          // Items mit 0 Menge entfernen
          await executeQuery(
            'DELETE FROM player_inventory WHERE user_id = ? AND item_id = ? AND quantity <= 0',
            [userId, body.itemId]
          );
          
          itemConsumed = true;
        }

        // Spezifische Logik für verschiedene Item-Objekt-Kombinationen
        let message = 'Item erfolgreich verwendet';
        let unlockedFeatures: string[] = [];
        let newPuzzles: any[] = [];
        let roomChanges: any = {};

        // USB-Stick auf Computer
        if (body.targetObjectId === 'computer' && body.itemId === 'usb_stick') {
          message = 'USB-Stick erfolgreich eingesteckt. Neue Hacking-Tools verfügbar!';
          unlockedFeatures = ['advanced_hacking', 'terminal_access'];
          
          // Neues Rätsel freischalten
          await executeQuery(
            'INSERT INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts, hints_used) VALUES (?, ?, false, 0, 0)',
            [userId, 'computer_hacking_puzzle']
          );
          
          newPuzzles = [{
            id: 'computer_hacking_puzzle',
            name: 'Erweiterte Hacking-Tools',
            description: 'Neue Terminal-Funktionen freigeschaltet'
          }];
        }

        // Zugangskarte auf Tür
        else if (body.targetObjectId === 'door' && body.itemId === 'keycard') {
          message = 'Tür erfolgreich geöffnet!';
          unlockedFeatures = ['basement_access', 'city_access'];
          
          // Raum-Status aktualisieren
          await executeQuery(
            'UPDATE room_objects SET status = ? WHERE object_id = ? AND room_id = ?',
            ['unlocked', body.targetObjectId, body.roomId]
          );
          
          roomChanges = {
            doorStatus: 'unlocked',
            newConnections: ['basement', 'city']
          };
        }

        // Energy Drink auf Smartphone
        else if (body.targetObjectId === 'smartphone' && body.itemId === 'energy_drink') {
          message = 'Energy Drink konsumiert. Du fühlst dich energiegeladen!';
          
          // Spieler-Energie erhöhen
          await executeQuery(
            'UPDATE game_states SET energy = LEAST(energy + 50, 100) WHERE user_id = ?',
            [userId]
          );
        }

        // Aktualisiertes Inventar abrufen
        if (itemConsumed) {
          const updatedInventory = await executeQuery<{
            id: number;
            item_id: string;
            quantity: number;
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
              pi.id,
              pi.item_id,
              pi.quantity,
              i.name,
              i.description,
              i.type,
              i.rarity,
              i.value,
              i.is_stackable,
              i.max_stack_size,
              i.icon
            FROM player_inventory pi
            JOIN items i ON pi.item_id = i.id
            WHERE pi.user_id = ? AND pi.quantity > 0
            ORDER BY i.rarity DESC, i.value DESC`,
            [userId]
          );

          newInventory = updatedInventory.map(row => ({
            id: row.item_id,
            name: row.name,
            type: row.type,
            quantity: row.quantity,
            description: row.description,
            rarity: row.rarity,
            value: row.value,
            isStackable: row.is_stackable,
            maxStackSize: row.max_stack_size,
            icon: row.icon
          }));
        }

        // Transaktion bestätigen
        await executeQuery('COMMIT');

        return NextResponse.json({
          success: true,
          message,
          inventory: newInventory,
          unlockedFeatures,
          newPuzzles,
          roomChanges,
          itemConsumed
        });

      } catch (error) {
        // Transaktion rückgängig machen
        await executeQuery('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Fehler beim Verwenden des Items:', error);
      return NextResponse.json({
        success: false,
        error: 'Interner Server-Fehler'
      }, { status: 500 });
    }
  })(request);
} 