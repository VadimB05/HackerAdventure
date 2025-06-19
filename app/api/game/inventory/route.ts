import { NextRequest, NextResponse } from 'next/server';

/**
 * Spieler-Inventar abrufen
 * GET /api/game/inventory
 */
export async function GET(request: NextRequest) {
  try {
    // Platzhalter-Daten für Test
    const inventory = [
      {
        id: 'laptop',
        name: 'Laptop',
        type: 'tool',
        quantity: 1,
        description: 'Ein alter aber funktionsfähiger Laptop'
      },
      {
        id: 'usb_stick',
        name: 'USB-Stick',
        type: 'tool',
        quantity: 2,
        description: 'Ein USB-Stick mit unbekanntem Inhalt'
      },
      {
        id: 'keycard',
        name: 'Zugangskarte',
        type: 'key',
        quantity: 1,
        description: 'Eine magnetische Zugangskarte'
      }
    ];

    return NextResponse.json({
      success: true,
      inventory,
      count: inventory.length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen des Inventars'
    }, { status: 500 });
  }
}

/**
 * Item zum Inventar hinzufügen
 * POST /api/game/inventory
 * Body: { itemId: string, quantity?: number }
 */
export async function POST(request: NextRequest) {
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

    // Platzhalter-Logik für Test
    return NextResponse.json({
      success: true,
      message: `Item ${itemId} erfolgreich hinzugefügt`,
      item: {
        id: itemId,
        quantity
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Hinzufügen des Items'
    }, { status: 500 });
  }
} 