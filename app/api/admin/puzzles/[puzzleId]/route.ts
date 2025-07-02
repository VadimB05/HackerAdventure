import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/database';

/**
 * Einzelnes Rätsel abrufen
 * GET /api/admin/puzzles/[puzzleId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
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

    const { puzzleId } = await params;

    // Rätsel-Grunddaten abrufen
    const puzzle = await executeQuerySingle<{
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
      WHERE p.puzzle_id = ?`,
      [puzzleId]
    );

    if (!puzzle) {
      return NextResponse.json({
        success: false,
        error: 'Rätsel nicht gefunden'
      }, { status: 404 });
    }

    // Rätsel-spezifische Daten abrufen
    const puzzleData = await executeQuery<{
      data_type: string;
      data_key: string;
      data_value: string;
    }>(
      'SELECT * FROM puzzle_data WHERE puzzle_id = ? ORDER BY data_type, data_key',
      [puzzleId]
    );

    // Daten strukturieren
    const data = puzzleData.reduce((acc, pd) => {
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

    const puzzleResponse = {
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

    return NextResponse.json({
      success: true,
      puzzle: puzzleResponse
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen des Rätsels'
    }, { status: 500 });
  }
}

/**
 * Rätsel aktualisieren
 * PUT /api/admin/puzzles/[puzzleId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
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

    const { puzzleId } = await params;
    const body = await request.json();
    const {
      name,
      description,
      type,
      roomId,
      difficulty,
      maxAttempts,
      timeLimitSeconds,
      isRequired,
      isHidden,
      hints,
      solution,
      data
    } = body;

    // Prüfen ob Rätsel existiert
    const existingPuzzle = await executeQuerySingle(
      'SELECT puzzle_id FROM puzzles WHERE puzzle_id = ?',
      [puzzleId]
    );

    if (!existingPuzzle) {
      return NextResponse.json({
        success: false,
        error: 'Rätsel nicht gefunden'
      }, { status: 404 });
    }

    // Prüfen ob Raum existiert (falls geändert)
    if (roomId) {
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
    }

    // Rätsel aktualisieren
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (type !== undefined) {
      updateFields.push('puzzle_type = ?');
      updateValues.push(type);
    }
    if (roomId !== undefined) {
      updateFields.push('room_id = ?');
      updateValues.push(roomId);
    }
    if (difficulty !== undefined) {
      updateFields.push('difficulty = ?');
      updateValues.push(difficulty);
    }
    if (maxAttempts !== undefined) {
      updateFields.push('max_attempts = ?');
      updateValues.push(maxAttempts);
    }
    if (timeLimitSeconds !== undefined) {
      updateFields.push('time_limit_seconds = ?');
      updateValues.push(timeLimitSeconds);
    }
    if (isRequired !== undefined) {
      updateFields.push('is_required = ?');
      updateValues.push(isRequired);
    }
    if (isHidden !== undefined) {
      updateFields.push('is_hidden = ?');
      updateValues.push(isHidden);
    }
    if (hints !== undefined) {
      updateFields.push('hints = ?');
      updateValues.push(JSON.stringify(hints));
    }
    if (solution !== undefined) {
      updateFields.push('solution = ?');
      updateValues.push(JSON.stringify(solution));
    }

    if (updateFields.length > 0) {
      updateValues.push(puzzleId);
      await executeQuery(
        `UPDATE puzzles SET ${updateFields.join(', ')} WHERE puzzle_id = ?`,
        updateValues
      );
    }

    // Rätsel-spezifische Daten aktualisieren
    if (data) {
      // Alte Daten löschen
      await executeQuery(
        'DELETE FROM puzzle_data WHERE puzzle_id = ?',
        [puzzleId]
      );

      // Neue Daten einfügen
      for (const [dataType, typeData] of Object.entries(data)) {
        for (const [key, value] of Object.entries(typeData as any)) {
          await executeQuery(
            'INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES (?, ?, ?, ?)',
            [puzzleId, dataType, key, JSON.stringify(value)]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rätsel erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren des Rätsels'
    }, { status: 500 });
  }
}

/**
 * Rätsel löschen
 * DELETE /api/admin/puzzles/[puzzleId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
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

    const { puzzleId } = await params;

    // Prüfen ob Rätsel existiert
    const existingPuzzle = await executeQuerySingle(
      'SELECT puzzle_id FROM puzzles WHERE puzzle_id = ?',
      [puzzleId]
    );

    if (!existingPuzzle) {
      return NextResponse.json({
        success: false,
        error: 'Rätsel nicht gefunden'
      }, { status: 404 });
    }

    // Rätsel-spezifische Daten löschen (CASCADE)
    await executeQuery(
      'DELETE FROM puzzle_data WHERE puzzle_id = ?',
      [puzzleId]
    );

    // Rätsel löschen
    await executeQuery(
      'DELETE FROM puzzles WHERE puzzle_id = ?',
      [puzzleId]
    );

    return NextResponse.json({
      success: true,
      message: 'Rätsel erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Rätsels:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Löschen des Rätsels'
    }, { status: 500 });
  }
} 