import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeQuery } from '@/lib/database';

/**
 * Spieler-Inventar abrufen
 * GET /api/game/inventory
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;

      // Inventar aus Datenbank abrufen
      const inventory = await executeQuery<{
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
      const formattedInventory = inventory.map(item => ({
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
        inventory: formattedInventory,
        count: formattedInventory.length
      }, { status: 200 });
    } catch (error) {
      console.error('Fehler beim Abrufen des Inventars:', error);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Abrufen des Inventars'
      }, { status: 500 });
    }
  })(request);
}

/**
 * Item zum Inventar hinzufügen (Legacy - verwende /api/game/pick für das Aufsammeln)
 * POST /api/game/inventory
 * Body: { itemId: string, quantity?: number }
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await request.json();
      const { itemId, quantity = 1 } = body;

      // Validierung
      if (!itemId) {
        return NextResponse.json({
          success: false,
          error: 'itemId ist erforderlich'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Verwende /api/game/pick für das Aufsammeln von Items aus Räumen'
      }, { status: 400 });
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Items:', error);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Hinzufügen des Items'
      }, { status: 500 });
    }
  })(request);
} 