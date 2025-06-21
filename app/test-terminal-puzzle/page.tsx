'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Play, Trophy } from 'lucide-react';
import PuzzleTerminal from '@/components/game/puzzle-terminal';

interface Puzzle {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  type: string;
  maxAttempts: number;
  timeLimitSeconds?: number;
  rewardExp: number;
  hints: string[];
}

export default function TestTerminalPuzzle() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<string | null>(null);

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Debug-API verwenden (ohne Authentifizierung)
      const response = await fetch('/api/debug/puzzles');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.puzzles) {
        // Filtere nach Terminal-Rätseln
        const terminalPuzzles = data.puzzles.filter((puzzle: any) => 
          puzzle.type === 'terminal' || puzzle.type === 'command'
        );
        
        if (terminalPuzzles.length > 0) {
          setPuzzles(terminalPuzzles);
        } else {
          // Fallback zu Mock-Daten
          setPuzzles(getMockTerminalPuzzles());
        }
      } else {
        // Fallback zu Mock-Daten
        setPuzzles(getMockTerminalPuzzles());
      }
    } catch (error) {
      console.error('Fehler beim Laden der Terminal-Rätsel:', error);
      // Fallback zu Mock-Daten
      setPuzzles(getMockTerminalPuzzles());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockTerminalPuzzles = (): Puzzle[] => [
    {
      id: 'terminal_1',
      name: 'System-Zugriff',
      description: 'Finde den korrekten Befehl, um Zugriff auf das System zu erhalten.',
      difficulty: 2,
      type: 'terminal',
      maxAttempts: 5,
      timeLimitSeconds: 300,
      rewardExp: 150,
      hints: [
        'Der Befehl beginnt mit "ssh"',
        'Du brauchst einen Benutzernamen',
        'Der Benutzername ist "admin"',
        'Der vollständige Befehl ist "ssh admin@server"'
      ]
    },
    {
      id: 'terminal_2',
      name: 'Datei-Suche',
      description: 'Suche nach einer versteckten Datei im System.',
      difficulty: 1,
      type: 'terminal',
      maxAttempts: 3,
      rewardExp: 100,
      hints: [
        'Verwende den "find" Befehl',
        'Suche nach Dateien mit Punkt am Anfang',
        'Der Befehl ist "find . -name ".*" -type f"'
      ]
    },
    {
      id: 'terminal_3',
      name: 'Netzwerk-Scan',
      description: 'Scanne das Netzwerk nach offenen Ports.',
      difficulty: 3,
      type: 'terminal',
      maxAttempts: 7,
      timeLimitSeconds: 600,
      rewardExp: 200,
      hints: [
        'Verwende einen Port-Scanner',
        'Der Befehl beginnt mit "nmap"',
        'Scanne alle Ports mit "-p-"',
        'Der vollständige Befehl ist "nmap -p- 192.168.1.1"'
      ]
    }
  ];

  const handleSolve = (puzzleId: string, isCorrect: boolean) => {
    console.log(`Rätsel ${puzzleId} gelöst: ${isCorrect}`);
    setSelectedPuzzle(null);
  };

  const handleClose = () => {
    setSelectedPuzzle(null);
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Einfach';
      case 2: return 'Leicht';
      case 3: return 'Mittel';
      case 4: return 'Schwer';
      case 5: return 'Sehr schwer';
      default: return 'Unbekannt';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400 text-lg">Lade Terminal-Rätsel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-red-400 text-xl font-bold mb-4">Fehler</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button onClick={loadPuzzles} className="bg-blue-600 hover:bg-blue-700">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-4 flex items-center justify-center gap-3">
            <Terminal className="h-8 w-8" />
            Terminal-Rätsel Demo
          </h1>
          <p className="text-gray-300">
            Teste die Terminal-Rätsel-Komponente mit echten Datenbank-Rätseln oder Mock-Daten
          </p>
        </div>

        {puzzles.length === 0 ? (
          <Card className="bg-black/50 border-red-500">
            <CardContent className="p-6 text-center">
              <p className="text-red-400">Keine Terminal-Rätsel gefunden</p>
              <p className="text-gray-400 text-sm mt-2">
                Weder in der Datenbank noch als Mock-Daten verfügbar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {puzzles.map((puzzle) => (
              <Card key={puzzle.id} className="bg-black/50 border-green-500 hover:border-green-400 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg text-green-400 flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      {puzzle.name}
                    </CardTitle>
                    <Badge className={`${getDifficultyColor(puzzle.difficulty)} text-white`}>
                      {getDifficultyText(puzzle.difficulty)}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm">{puzzle.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Versuche: {puzzle.maxAttempts}</span>
                    <span>Hinweise: {puzzle.hints.length}</span>
                    {puzzle.timeLimitSeconds && (
                      <span>Zeit: {Math.floor(puzzle.timeLimitSeconds / 60)}:{(puzzle.timeLimitSeconds % 60).toString().padStart(2, '0')}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Trophy className="h-4 w-4" />
                      <span className="text-sm">+{puzzle.rewardExp} XP</span>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedPuzzle(puzzle.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Starten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Terminal-Rätsel Modal */}
        {selectedPuzzle && (
          <PuzzleTerminal
            puzzleId={selectedPuzzle}
            onSolve={handleSolve}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
} 