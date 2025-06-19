import { NextRequest, NextResponse } from 'next/server';
import { withAuth, JWTPayload } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/database';

// Spielstatus abrufen
async function getGameState(request: NextRequest) {
  try {
    const user = (request as any).user as JWTPayload;
    
    const gameState = await executeQuery(
      'SELECT * FROM game_states WHERE user_id = ?',
      [user.userId]
    );

    if (gameState.length === 0) {
      // Neuen Spielstatus erstellen
      await executeUpdate(
        'INSERT INTO game_states (user_id, current_mission, money, inventory, created_at) VALUES (?, 1, 100, ?, NOW())',
        [user.userId, JSON.stringify([])]
      );
      
      return NextResponse.json({
        currentMission: 1,
        money: 100,
        inventory: [],
        isNewGame: true
      });
    }

    const state = gameState[0] as any;
    
    return NextResponse.json({
      currentMission: state.current_mission,
      money: state.money,
      inventory: JSON.parse(state.inventory || '[]'),
      isNewGame: false
    });

  } catch (error) {
    console.error('Fehler beim Abrufen des Spielstatus:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Spielstatus' },
      { status: 500 }
    );
  }
}

// Spielstatus aktualisieren
async function updateGameState(request: NextRequest) {
  try {
    const user = (request as any).user as JWTPayload;
    const { currentMission, money, inventory } = await request.json();

    await executeUpdate(
      'UPDATE game_states SET current_mission = ?, money = ?, inventory = ?, updated_at = NOW() WHERE user_id = ?',
      [currentMission, money, JSON.stringify(inventory), user.userId]
    );

    return NextResponse.json({
      message: 'Spielstatus erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Spielstatus:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Spielstatus' },
      { status: 500 }
    );
  }
}

// Geschützte Routen mit Authentifizierung
export const GET = withAuth(getGameState);
export const PUT = withAuth(updateGameState); 