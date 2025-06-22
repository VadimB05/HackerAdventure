import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // TODO: Echte Authentifizierung implementieren
    const userId = 1; // Später aus Session extrahieren

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'roomId ist erforderlich' },
        { status: 400 }
      );
    }

    // Spieler-Status abrufen
    const gameState = await executeQuerySingle<{
      level: number;
      inventory: string;
      current_room: string;
    }>(
      'SELECT level, inventory, current_room FROM game_states WHERE user_id = ?',
      [userId]
    );

    if (!gameState) {
      return NextResponse.json(
        { success: false, error: 'Spieler-Status nicht gefunden' },
        { status: 404 }
      );
    }

    // Verfügbare Exits für den Raum abrufen
    const exits = await executeQuery<{
      id: string;
      name: string;
      description: string;
      target_room_id: string;
      is_locked: boolean;
      required_level: number;
      required_items: string;
      unlock_message: string;
    }>(
      `SELECT 
        e.id,
        e.name,
        e.description,
        e.target_room_id,
        e.is_locked,
        e.required_level,
        e.required_items,
        e.unlock_message
      FROM room_exits e
      WHERE e.source_room_id = ?`,
      [roomId]
    );

    // Exits mit Verfügbarkeits-Status formatieren
    const availableExits = exits.map(exit => {
      let isUnlocked = !exit.is_locked;
      let unlockMessage = exit.unlock_message;

      // Level-Anforderung prüfen
      if (exit.is_locked && gameState.level >= exit.required_level) {
        isUnlocked = true;
        unlockMessage = `Level ${exit.required_level} erreicht!`;
      }

      // Item-Anforderungen prüfen
      if (exit.is_locked && exit.required_items) {
        try {
          const requiredItems = JSON.parse(exit.required_items);
          const playerInventory = JSON.parse(gameState.inventory || '[]');
          
          const hasAllItems = requiredItems.every((item: string) => 
            playerInventory.includes(item)
          );
          
          if (hasAllItems) {
            isUnlocked = true;
            unlockMessage = `Benötigte Items gefunden!`;
          }
        } catch (error) {
          console.error('Fehler beim Parsen der Item-Anforderungen:', error);
        }
      }

      return {
        id: exit.id,
        name: exit.name,
        description: exit.description,
        roomId: exit.target_room_id,
        isUnlocked,
        unlockMessage: isUnlocked ? unlockMessage : undefined
      };
    });

    return NextResponse.json({
      success: true,
      exits: availableExits,
      currentRoom: gameState.current_room
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Exits:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 