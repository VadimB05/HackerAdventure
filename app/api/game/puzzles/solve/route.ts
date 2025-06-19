import { NextRequest, NextResponse } from 'next/server';

/**
 * Rätsel lösen
 * POST /api/game/puzzles/solve
 * Body: { puzzleId: string, answer: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puzzleId, answer } = body;

    // Validierung
    if (!puzzleId || !answer) {
      return NextResponse.json({
        success: false,
        error: 'puzzleId und answer sind erforderlich'
      }, { status: 400 });
    }

    // Platzhalter-Logik für Test
    const isCorrect = answer.toLowerCase().includes('hack') || answer.toLowerCase().includes('password');

    if (isCorrect) {
      return NextResponse.json({
        success: true,
        message: 'Rätsel erfolgreich gelöst!',
        puzzleId,
        reward: {
          money: 50,
          experience: 25,
          items: ['usb_stick']
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Falsche Antwort. Versuche es erneut.',
        puzzleId
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Lösen des Rätsels'
    }, { status: 500 });
  }
} 