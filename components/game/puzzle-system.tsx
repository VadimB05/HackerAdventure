'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPuzzle, type PuzzleData } from '@/lib/services/puzzle-service';
import PuzzleMultipleChoice from './puzzle-multiple-choice';
import PuzzleCodeInput from './puzzle-code-input';
import PuzzleTerminal from './puzzle-terminal';

interface PuzzleSystemProps {
  puzzleId: string;
  onSolve: (puzzleId: string, isCorrect: boolean, alarmLevelIncreased?: boolean) => void;
  onClose: () => void;
  useDebugApi?: boolean;
}

export default function PuzzleSystem({
  puzzleId,
  onSolve,
  onClose,
  useDebugApi = false
}: PuzzleSystemProps) {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      
      if (useDebugApi) {
        // Debug-API verwenden (ohne Authentifizierung)
        const response = await fetch(`/api/debug/puzzles/${puzzleId}`);
        const data = await response.json();
        
        if (data.success && data.puzzle) {
          // Debug-API Format zu PuzzleData Format konvertieren
          const puzzle = data.puzzle;
          result = {
            success: true,
            puzzle: {
              puzzleId: puzzle.puzzleId || puzzle.id,
              roomId: puzzle.roomId || 'bedroom',
              name: puzzle.name,
              description: puzzle.description,
              type: puzzle.type || 'code',
              difficulty: puzzle.difficulty,
              maxAttempts: puzzle.maxAttempts,
              timeLimitSeconds: puzzle.timeLimitSeconds,
              isRequired: puzzle.isRequired || false,
              isHidden: puzzle.isHidden || false,
              hints: puzzle.hints || [],
              data: puzzle.questions || {},
              progress: {
                attempts: 0,
                hintsUsed: 0,
                isCompleted: false,
                bestTimeSeconds: null,
                completedAt: null
              }
            }
          };
        } else {
          result = {
            success: false,
            error: data.error || 'Fehler beim Laden des Rätsels'
          };
        }
      } else {
        // Normale API verwenden (mit Authentifizierung)
        result = await getPuzzle(puzzleId);
      }

      if (result.success && result.puzzle) {
        setPuzzleData(result.puzzle);
      } else {
        setError(result.error || 'Fehler beim Laden des Rätsels');
      }
    } catch (error) {
      console.error('Fehler beim Laden des Rätsels:', error);
      setError('Netzwerkfehler beim Laden des Rätsels');
    } finally {
      setIsLoading(false);
    }
  }, [puzzleId, useDebugApi]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  const handleSolve = (puzzleId: string, isCorrect: boolean, alarmLevelIncreased?: boolean) => {
    onSolve(puzzleId, isCorrect, alarmLevelIncreased);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
        <div className="bg-black/80 border border-green-500 rounded-lg p-8">
          <div className="text-green-400 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg">Lade R&auml;tsel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
        <div className="bg-black/80 border border-red-500 rounded-lg p-8 max-w-md mx-4">
          <div className="text-red-400 text-center">
            <h3 className="text-xl font-bold mb-4">Fehler</h3>
            <p className="mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={loadPuzzle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Erneut versuchen
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzleData) {
    return null;
  }

  // Rätseltyp-spezifische Komponenten rendern
  switch (puzzleData.type) {
    case 'multiple_choice':
      return (
        <PuzzleMultipleChoice
          puzzleId={puzzleId}
          puzzleData={puzzleData}
          onSolve={handleSolve}
          onClose={onClose}
          useMockData={useDebugApi}
        />
      );

    case 'code':
      return (
        <PuzzleCodeInput
          puzzleId={puzzleId}
          puzzleData={puzzleData}
          onSolve={handleSolve}
          onClose={onClose}
        />
      );

    case 'terminal_command':
    case 'terminal':
      return (
        <PuzzleTerminal
          puzzleId={puzzleId}
          puzzleData={puzzleData}
          onSolve={handleSolve}
          onClose={onClose}
        />
      );

    case 'password':
      // TODO: PuzzlePassword-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Passwort-Rätsel</h3>
              <p className="mb-6">Passwort-Rätsel-Komponente noch nicht implementiert</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      );

    case 'sequence':
      // TODO: PuzzleSequence-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Zahlenfolge-Rätsel</h3>
              <p className="mb-6">Zahlenfolge-Rätsel-Komponente noch nicht implementiert</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      );

    case 'pattern':
      // TODO: PuzzlePattern-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Muster-Rätsel</h3>
              <p className="mb-6">Muster-Rätsel-Komponente noch nicht implementiert</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      );

    case 'logic':
      // TODO: PuzzleLogic-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Logik-Rätsel</h3>
              <p className="mb-6">Logik-Rätsel-Komponente noch nicht implementiert</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      );

    case 'point_and_click':
      // TODO: PuzzlePointAndClick-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Point & Click-Rätsel</h3>
              <p className="mb-6">Point & Click-Rätsel-Komponente noch nicht implementiert</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-red-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-red-400 text-center">
              <h3 className="text-xl font-bold mb-4">Unbekannter Rätseltyp</h3>
              <p className="mb-6">Rätseltyp &quot;{puzzleData.type}&quot; wird nicht unterstützt</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      );
  }
} 