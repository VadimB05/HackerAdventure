import { NextRequest, NextResponse } from 'next/server';

/**
 * Spezifischen Raum abrufen
 * GET /api/game/rooms/[roomId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;

    // Platzhalter-Daten für Test
    const roomData = {
      id: roomId,
      name: `Raum ${roomId}`,
      description: `Beschreibung für Raum ${roomId}`,
      backgroundImage: `/images/rooms/${roomId}.jpg`,
      isLocked: roomId === 'city_view',
      requiredLevel: roomId === 'city_view' ? 2 : 1,
      objects: [
        { id: 'computer', type: 'interactive', position: { x: 100, y: 200 } },
        { id: 'desk', type: 'static', position: { x: 300, y: 150 } }
      ],
      puzzles: [
        { id: 'puzzle_1', type: 'terminal', isCompleted: false },
        { id: 'puzzle_2', type: 'point_and_click', isCompleted: true }
      ]
    };

    return NextResponse.json({
      success: true,
      room: roomData
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen des Raums'
    }, { status: 500 });
  }
} 