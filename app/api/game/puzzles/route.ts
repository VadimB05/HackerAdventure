import { NextRequest, NextResponse } from 'next/server';

/**
 * Alle verfügbaren Rätsel abrufen
 * GET /api/game/puzzles
 */
export async function GET(request: NextRequest) {
  try {
    // Platzhalter-Daten für Test
    const puzzles = [
      {
        id: 'terminal_puzzle_1',
        name: 'Terminal-Hack',
        type: 'terminal',
        difficulty: 1,
        roomId: 'basement',
        isCompleted: false
      },
      {
        id: 'click_puzzle_1',
        name: 'Versteckter USB-Stick',
        type: 'point_and_click',
        difficulty: 2,
        roomId: 'basement',
        isCompleted: true
      },
      {
        id: 'logic_puzzle_1',
        name: 'Passwort-Knacken',
        type: 'logic',
        difficulty: 3,
        roomId: 'city_view',
        isCompleted: false
      }
    ];

    return NextResponse.json({
      success: true,
      puzzles,
      count: puzzles.length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen der Rätsel'
    }, { status: 500 });
  }
} 