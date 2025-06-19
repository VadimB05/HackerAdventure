import { NextRequest, NextResponse } from 'next/server';

/**
 * Alle Räume für Admin abrufen
 * GET /api/admin/rooms
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
        requiredLevel: 1,
        missionId: 'tutorial',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'basement',
        name: 'Keller',
        description: 'Ein dunkler Keller mit alten Computern',
        isLocked: false,
        requiredLevel: 1,
        missionId: 'basement_investigation',
        createdAt: '2024-01-01T00:00:00Z'
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

/**
 * Neuen Raum erstellen
 * POST /api/admin/rooms
 * Body: { name: string, description: string, requiredLevel: number, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, requiredLevel = 1 } = body;

    // Validierung
    if (!name || !description) {
      return NextResponse.json({
        success: false,
        error: 'name und description sind erforderlich'
      }, { status: 400 });
    }

    // Platzhalter-Logik für Test
    const newRoom = {
      id: `room_${Date.now()}`,
      name,
      description,
      requiredLevel,
      isLocked: false,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Raum erfolgreich erstellt',
      room: newRoom
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen des Raums'
    }, { status: 500 });
  }
} 