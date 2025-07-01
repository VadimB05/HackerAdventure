import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle, executeQuery } from '@/lib/database';

export async function GET(request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  try {
    const { missionId } = await context.params;

    console.log('Loading mission:', missionId);

    // Mission laden
    const mission = await executeQuerySingle(`
      SELECT mission_id, name, description, reward_bitcoins, reward_exp
      FROM missions
      WHERE mission_id = ?
    `, [missionId]);

    if (!mission) {
      console.log('Mission not found:', missionId);
      return NextResponse.json({ 
        success: false, 
        error: 'Mission nicht gefunden' 
      }, { status: 404 });
    }

    console.log('Mission found:', mission);

    // Schritte/Rätsel laden (alle Puzzles für Räume dieser Mission)
    const steps = await executeQuery(`
      SELECT p.puzzle_id, p.name, p.description, p.puzzle_type, p.room_id
      FROM puzzles p
      JOIN rooms r ON p.room_id = r.room_id
      WHERE r.mission_id = ?
      ORDER BY p.id
    `, [missionId]);

    console.log('Steps found:', steps.length);

    // Dynamische Schritte: Nur Puzzles/Terminals (keine Einführung mehr)
    const missionSteps = steps.map((puzzle: any) => ({
      id: puzzle.puzzle_id,
      type: puzzle.puzzle_type === 'terminal_command' ? 'terminal' : 'puzzle',
      title: puzzle.name,
      description: puzzle.description,
      puzzleId: puzzle.puzzle_id,
      roomId: puzzle.room_id,
    }));

    console.log('Mission steps created:', missionSteps.length);

    const response = {
      success: true,
      mission: {
        missionId: mission.mission_id,
        name: mission.name,
        description: mission.description,
        steps: missionSteps,
        rewardBitcoins: mission.reward_bitcoins,
        rewardExp: mission.reward_exp,
      }
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in mission API:', error);
    
    // Spezifische Fehlermeldungen basierend auf dem Fehlertyp
    let errorMessage = 'Interner Server-Fehler';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('ER_CON_COUNT_ERROR')) {
        errorMessage = 'Datenbankverbindung überlastet. Bitte versuchen Sie es später erneut.';
        statusCode = 503;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Datenbank nicht erreichbar. Bitte überprüfen Sie die Verbindung.';
        statusCode = 503;
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Datenbankverbindung zeitüberschritten. Bitte versuchen Sie es erneut.';
        statusCode = 504;
      } else {
        errorMessage = `Datenbankfehler: ${error.message}`;
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: statusCode });
  }
} 