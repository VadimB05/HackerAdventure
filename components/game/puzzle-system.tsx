'use client';

import React, { useState, useEffect } from 'react';
import { getPuzzle, type PuzzleData } from '@/lib/services/puzzle-service';
import PuzzleMultipleChoice from './puzzle-multiple-choice';

interface PuzzleSystemProps {
  puzzleId: string;
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export default function PuzzleSystem({
  puzzleId,
  onSolve,
  onClose
}: PuzzleSystemProps) {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPuzzle();
  }, [puzzleId]);

  const loadPuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getPuzzle(puzzleId);

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
  };

  const handleSolve = (puzzleId: string, isCorrect: boolean) => {
    onSolve(puzzleId, isCorrect);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-black/80 border border-green-500 rounded-lg p-8">
          <div className="text-green-400 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg">Lade Rätsel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
        />
      );

    case 'code':
      // TODO: PuzzleCode-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Code-Rätsel</h3>
              <p className="mb-6">Code-Rätsel-Komponente noch nicht implementiert</p>
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

    case 'terminal_command':
      // TODO: PuzzleTerminal-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-green-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-green-400 text-center">
              <h3 className="text-xl font-bold mb-4">Terminal-Rätsel</h3>
              <p className="mb-6">Terminal-Rätsel-Komponente noch nicht implementiert</p>
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

    case 'password':
      // TODO: PuzzlePassword-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

    case 'logic':
      // TODO: PuzzleLogic-Komponente implementieren
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

    default:
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-red-500 rounded-lg p-8 max-w-md mx-4">
            <div className="text-red-400 text-center">
              <h3 className="text-xl font-bold mb-4">Unbekannter Rätseltyp</h3>
              <p className="mb-6">Rätseltyp "{puzzleData.type}" wird nicht unterstützt</p>
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