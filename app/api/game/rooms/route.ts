import { NextRequest, NextResponse } from 'next/server';

/**
 * Alle verfügbaren Räume abrufen
 * GET /api/game/rooms
 */
export async function GET(request: NextRequest) {
  try {
    // Platzhalter-Daten für Test
    const rooms = [
      {
        id: 'intro',
        name: 'Einführung',
        description: 'Willkommen in der Welt des ethischen Hackings',
        isLocked: false,
        requiredLevel: 1
      },
      {
        id: 'basement',
        name: 'Keller',
        description: 'Ein dunkler Keller mit alten Computern',
        isLocked: false,
        requiredLevel: 1
      },
      {
        id: 'city_view',
        name: 'Stadtansicht',
        description: 'Überblick über die digitale Stadt',
        isLocked: true,
        requiredLevel: 2
      }
    ];

    return NextResponse.json({
      success: true,
      rooms,
      count: rooms.length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen der Räume'
    }, { status: 500 });
  }
} 