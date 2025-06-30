import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { executeUpdate, executeQuerySingle } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ puzzleId: string }> }
) {
  return requireAuth(async (req) => {
    try {
      const userId = req.user!.id;
      const { puzzleId } = await params;
      const body = await request.json();
      const { reason } = body;

      console.log(`[DEBUG] User ID: ${userId}`);
      console.log(`[DEBUG] Puzzle ID: ${puzzleId}`);
      console.log(`[DEBUG] Grund: ${reason}`);

      // Prüfe ob Puzzle-Progress-Eintrag existiert
      const existingProgress = await executeQuerySingle<{attempts: number}>(
        'SELECT attempts FROM puzzle_progress WHERE user_id = ? AND puzzle_id = ?',
        [userId, puzzleId]
      );
      console.log(`[DEBUG] Vorherige Versuche: ${existingProgress?.attempts || 'Kein Eintrag'}`);

      // Versuche in der Datenbank zurücksetzen
      const result = await executeUpdate(
        'UPDATE puzzle_progress SET attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND puzzle_id = ?',
        [userId, puzzleId]
      );

      console.log(`[DEBUG] Update Result: ${JSON.stringify(result)}`);

      if (result.affectedRows === 0) {
        // Puzzle-Progress-Eintrag existiert nicht, erstelle einen
        const insertResult = await executeUpdate(
          'INSERT INTO puzzle_progress (user_id, puzzle_id, attempts, is_completed, hints_used) VALUES (?, ?, 0, FALSE, 0)',
          [userId, puzzleId]
        );
        console.log(`[DEBUG] Insert Result: ${JSON.stringify(insertResult)}`);
        console.log(`Neuen Puzzle-Progress-Eintrag für ${puzzleId} erstellt`);
      } else {
        console.log(`Versuche für Puzzle ${puzzleId} zurückgesetzt`);
      }

      // Prüfe das Ergebnis
      const finalProgress = await executeQuerySingle<{attempts: number}>(
        'SELECT attempts FROM puzzle_progress WHERE user_id = ? AND puzzle_id = ?',
        [userId, puzzleId]
      );
      console.log(`[DEBUG] Finale Versuche: ${finalProgress?.attempts || 'Kein Eintrag'}`);

      return NextResponse.json({
        success: true,
        message: 'Versuche erfolgreich zurückgesetzt',
        puzzleId,
        reason,
        debug: {
          userId,
          affectedRows: result.affectedRows,
          finalAttempts: finalProgress?.attempts
        }
      });

    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Versuche:', error);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Zurücksetzen der Versuche',
        debug: { error: error instanceof Error ? error.message : 'Unknown error' }
      }, { status: 500 });
    }
  })(request);
} 