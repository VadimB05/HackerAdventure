import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/database';

/**
 * Alle Rätsel für Admin abrufen
 * GET /api/admin/puzzles
 */
export async function GET(request: NextRequest) {
  try {
    // Admin-Authentifizierung über Header
    const authHeader = request.headers.get('x-user-info');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const userInfo = JSON.parse(decodeURIComponent(authHeader));
    if (!userInfo.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Rechte erforderlich'
      }, { status: 403 });
    }

    // Alle Rätsel mit Raum-Informationen abrufen
    const puzzles = await executeQuery<{
      id: number;
      puzzle_id: string;
      room_id: string;
      name: string;
      description: string;
      puzzle_type: string;
      difficulty: number;
      solution: string;
      hints: string;
      max_attempts: number;
      time_limit_seconds: number | null;
      is_required: boolean;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
      room_name: string;
    }>(
      `SELECT 
        p.*,
        r.name as room_name
      FROM puzzles p
      LEFT JOIN rooms r ON p.room_id = r.room_id
      ORDER BY p.created_at DESC`
    );

    // Rätsel-Daten für jeden Typ abrufen
    const puzzleData = await executeQuery<{
      puzzle_id: string;
      data_type: string;
      data_key: string;
      data_value: string;
    }>(
      'SELECT * FROM puzzle_data ORDER BY puzzle_id, data_type, data_key'
    );

    // Daten strukturieren
    const structuredPuzzles = puzzles.map(puzzle => {
      const data = puzzleData
        .filter(pd => pd.puzzle_id === puzzle.puzzle_id)
        .reduce((acc, pd) => {
          if (!acc[pd.data_type]) {
            acc[pd.data_type] = {};
          }
          try {
            acc[pd.data_type][pd.data_key] = JSON.parse(pd.data_value);
          } catch {
            acc[pd.data_type][pd.data_key] = pd.data_value;
          }
          return acc;
        }, {} as any);

      return {
        id: puzzle.puzzle_id,
        name: puzzle.name,
        description: puzzle.description,
        type: puzzle.puzzle_type,
        difficulty: puzzle.difficulty,
        roomId: puzzle.room_id,
        roomName: puzzle.room_name,
        solution: JSON.parse(puzzle.solution),
        hints: JSON.parse(puzzle.hints || '[]'),
        maxAttempts: puzzle.max_attempts,
        timeLimitSeconds: puzzle.time_limit_seconds,
        isRequired: puzzle.is_required,
        isHidden: puzzle.is_hidden,
        data: data,
        createdAt: puzzle.created_at,
        updatedAt: puzzle.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      puzzles: structuredPuzzles,
      count: structuredPuzzles.length
    }, { status: 200 });
  } catch (error) {
    console.error('Fehler beim Abrufen der Rätsel:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen der Rätsel'
    }, { status: 500 });
  }
}

/**
 * Neues Rätsel erstellen
 * POST /api/admin/puzzles
 */
export async function POST(request: NextRequest) {
  try {
    // Admin-Authentifizierung über Header
    const authHeader = request.headers.get('x-user-info');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const userInfo = JSON.parse(decodeURIComponent(authHeader));
    if (!userInfo.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin-Rechte erforderlich'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      roomId,
      difficulty = 1,
      maxAttempts = 3,
      timeLimitSeconds,
      isRequired = false,
      isHidden = false,
      hints = [],
      solution,
      data = {}
    } = body;

    // Validierung
    if (!name || !type || !roomId || !solution) {
      return NextResponse.json({
        success: false,
        error: 'name, type, roomId und solution sind erforderlich'
      }, { status: 400 });
    }

    // Prüfen ob Raum existiert
    const room = await executeQuerySingle(
      'SELECT room_id FROM rooms WHERE room_id = ?',
      [roomId]
    );

    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Raum nicht gefunden'
      }, { status: 404 });
    }

    // Puzzle-ID generieren
    const puzzleId = `puzzle_${type}_${Date.now()}`;

    // Rätsel erstellen
    await executeQuery(
      `INSERT INTO puzzles (
        puzzle_id, room_id, name, description, puzzle_type, difficulty,
        solution, hints, max_attempts, time_limit_seconds, is_required, is_hidden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        puzzleId,
        roomId,
        name,
        description || '',
        type,
        difficulty,
        JSON.stringify(solution),
        JSON.stringify(hints),
        maxAttempts,
        timeLimitSeconds || null,
        isRequired,
        isHidden
      ]
    );

    // Rätsel-spezifische Daten speichern
    console.log('DATA:', data);
    for (const [dataType, typeData] of Object.entries(data)) {
      for (const [key, value] of Object.entries(typeData as any)) {
        await executeQuery(
          'INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES (?, ?, ?, ?)',
          [puzzleId, dataType, key, JSON.stringify(value)]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rätsel erfolgreich erstellt',
      puzzleId
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen des Rätsels'
    }, { status: 500 });
  }
} 