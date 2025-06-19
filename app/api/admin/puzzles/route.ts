import { NextRequest, NextResponse } from 'next/server';

/**
 * Alle Rätsel für Admin abrufen
 * GET /api/admin/puzzles
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
        solution: { command: 'hack system' },
        hints: ['Versuche es mit einem Hack-Befehl'],
        rewardMoney: 50,
        rewardExp: 25,
        isRequired: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'click_puzzle_1',
        name: 'Versteckter USB-Stick',
        type: 'point_and_click',
        difficulty: 2,
        roomId: 'basement',
        solution: { coordinates: { x: 150, y: 200 } },
        hints: ['Schau unter dem Tisch'],
        rewardMoney: 30,
        rewardExp: 15,
        isRequired: false,
        createdAt: '2024-01-01T00:00:00Z'
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

/**
 * Neues Rätsel erstellen
 * POST /api/admin/puzzles
 * Body: { name: string, type: string, roomId: string, solution: object, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, roomId, solution, difficulty = 1 } = body;

    // Validierung
    if (!name || !type || !roomId || !solution) {
      return NextResponse.json({
        success: false,
        error: 'name, type, roomId und solution sind erforderlich'
      }, { status: 400 });
    }

    // Platzhalter-Logik für Test
    const newPuzzle = {
      id: `puzzle_${Date.now()}`,
      name,
      type,
      roomId,
      solution,
      difficulty,
      isRequired: false,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Rätsel erfolgreich erstellt',
      puzzle: newPuzzle
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen des Rätsels'
    }, { status: 500 });
  }
} 