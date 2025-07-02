'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  AlertTriangle, 
  Loader2,
  Code,
  List,
  Terminal
} from 'lucide-react';
import PuzzleCard from './puzzle-card';

interface Puzzle {
  id: string;
  name: string;
  description: string;
  type: 'multiple_choice' | 'code' | 'terminal';
  difficulty: number;
  timeLimitSeconds?: number;
  maxAttempts: number;
  hints?: string[];
  isCompleted?: boolean;
}

interface PuzzleListProps {
  title: string;
  description: string;
  puzzleType?: 'multiple_choice' | 'code' | 'terminal';
  roomId?: string;
  onPuzzleSelect: (puzzleId: string) => void;
  onPuzzleSolve?: (puzzleId: string, isCorrect: boolean) => void;
  mockPuzzles?: Puzzle[];
}

export default function PuzzleList({ 
  title, 
  description, 
  puzzleType, 
  roomId, 
  onPuzzleSelect, 
  onPuzzleSolve,
  mockPuzzles = []
}: PuzzleListProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const loadPuzzles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug-API verwenden (ohne Authentifizierung)
      const apiUrl = roomId 
        ? `/api/debug/puzzles?roomId=${roomId}`
        : '/api/debug/puzzles';
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.puzzles && data.puzzles.length > 0) {
          let filteredPuzzles = data.puzzles;
          
          // Filtere nach Puzzle-Typ wenn angegeben
          if (puzzleType) {
            filteredPuzzles = data.puzzles.filter((puzzle: any) => {
              const type = puzzle.type || puzzle.puzzleType;
              return type === puzzleType;
            });
          }
          
          if (filteredPuzzles.length > 0) {
            // Stelle sicher, dass jedes Puzzle eine eindeutige ID hat
            const puzzlesWithIds = filteredPuzzles.map((puzzle: any, index: number) => ({
              ...puzzle,
              id: puzzle.id || puzzle.puzzle_id || puzzle.puzzleId || `puzzle-${index}`
            }));
            
            setPuzzles(puzzlesWithIds);
            setUseMockData(false);
            return;
          }
        }
      }

      // Fallback zu Mock-Daten
      setPuzzles(mockPuzzles);
      setUseMockData(true);
      setError('Keine Datenbank-Rätsel gefunden. Verwende Demo-Daten.');
    } catch (error) {
      console.error('Fehler beim Laden der Rätsel:', error);
      setPuzzles(mockPuzzles);
      setUseMockData(true);
      setError('Netzwerkfehler. Verwende Demo-Daten.');
    } finally {
      setIsLoading(false);
    }
  }, [puzzleType, roomId, mockPuzzles]);

  useEffect(() => {
    loadPuzzles();
  }, [loadPuzzles]);

  const getPuzzleIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <List className="w-6 h-6" />;
      case 'code': return <Code className="w-6 h-6" />;
      case 'terminal': return <Terminal className="w-6 h-6" />;
      default: return <List className="w-6 h-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-black/90 border-green-500">
            <CardContent className="p-8 text-center">
              <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg">Lade Rätsel...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-black/90 border-green-500">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {getPuzzleIcon(puzzleType || 'multiple_choice')}
              <CardTitle className="text-2xl text-green-400">
                {title}
              </CardTitle>
            </div>
            <p className="text-gray-300">
              {description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status-Anzeige */}
            <Alert className={useMockData ? "border-yellow-500 bg-yellow-500/10" : "border-green-500 bg-green-500/10"}>
              {useMockData ? (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              ) : (
                <Database className="h-4 w-4 text-green-400" />
              )}
              <AlertDescription className={useMockData ? "text-yellow-400" : "text-green-400"}>
                {useMockData 
                  ? 'Demo-Modus: Verwende Mock-Daten (keine Datenbank-Verbindung)'
                  : 'Produktiv-Modus: Verbunden mit Datenbank'
                }
              </AlertDescription>
            </Alert>

            {/* Fehler-Anzeige */}
            {error && (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Rätsel-Grid */}
            {puzzles.length === 0 ? (
              <Card className="bg-gray-900/50 border-red-500">
                <CardContent className="p-6 text-center">
                  <p className="text-red-400">Keine Rätsel gefunden</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Weder in der Datenbank noch als Mock-Daten verfügbar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {puzzles.map((puzzle, index) => (
                  <PuzzleCard
                    key={puzzle.id || `puzzle-${index}`}
                    puzzle={puzzle}
                    onSelect={onPuzzleSelect}
                    onSolve={onPuzzleSolve}
                  />
                ))}
              </div>
            )}

            {/* Statistiken */}
            <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
              <span>{puzzles.length} Rätsel verfügbar</span>
              {puzzleType && (
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  Typ: {puzzleType}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 