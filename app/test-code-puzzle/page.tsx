'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, AlertTriangle } from 'lucide-react';
import PuzzleCodeInput from '@/components/game/puzzle-code-input';

// Mock-Daten für Code-Eingabe-Rätsel
const mockCodePuzzles = [
  {
    puzzleId: 'code_lock_1',
    name: 'Sicherheitscode',
    description: 'Finde den 4-stelligen Sicherheitscode für das Schloss.',
    difficulty: 1,
    timeLimitSeconds: 120,
    maxAttempts: 5,
    rewardExp: 50,
    hints: [
      'Der Code ist eine Jahreszahl',
      'Es ist ein Jahr aus dem 20. Jahrhundert',
      'Das Jahr endet mit einer 5'
    ],
    solution: '1945'
  },
  {
    puzzleId: 'password_hash_1',
    name: 'Passwort-Hash',
    description: 'Entschlüssele den MD5-Hash und finde das ursprüngliche Passwort.',
    difficulty: 3,
    timeLimitSeconds: 300,
    maxAttempts: 10,
    rewardExp: 100,
    hints: [
      'Das Passwort ist ein einfaches Wort',
      'Es hat 6 Buchstaben',
      'Es beginnt mit einem "H"'
    ],
      solution: 'hacker'
  },
  {
    puzzleId: 'sequence_code_1',
    name: 'Zahlenfolge',
    description: 'Finde die nächste Zahl in der Folge: 2, 4, 8, 16, ?',
    difficulty: 2,
    timeLimitSeconds: 180,
    maxAttempts: 3,
    rewardExp: 75,
    hints: [
      'Jede Zahl wird mit sich selbst multipliziert',
      '2 × 2 = 4, 4 × 2 = 8, 8 × 2 = 16'
    ],
    solution: '32'
  }
];

export default function TestCodePuzzle() {
  const [activePuzzle, setActivePuzzle] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolve = (puzzleId: string, isCorrect: boolean) => {
    console.log(`Code-Rätsel ${puzzleId} gelöst: ${isCorrect ? 'Richtig' : 'Falsch'}`);
    setActivePuzzle(null);
    
    if (isCorrect) {
      console.log('Glückwunsch! Code-Rätsel erfolgreich gelöst!');
    } else {
      console.log('Das war leider falsch. Versuche es nochmal!');
    }
  };

  const handleClose = () => {
    setActivePuzzle(null);
  };

  const loadDatabasePuzzles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug-API verwenden (ohne Authentifizierung)
      console.log('Testing debug API for code puzzles...');
      const debugResponse = await fetch('/api/debug/puzzles?roomId=bedroom');
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Debug API response:', debugData);
        
        if (debugData.success && debugData.puzzles && debugData.puzzles.length > 0) {
          // Filtere nur Code-Eingabe-Rätsel
          const codePuzzles = debugData.puzzles.filter((puzzle: any) => {
            const puzzleType = puzzle.type || puzzle.puzzleType;
            return puzzleType === 'code' || puzzleType === 'password' || puzzleType === 'sequence';
          });
          
          if (codePuzzles.length > 0) {
            setUseMockData(false);
            console.log('Using database code puzzles:', codePuzzles.length);
            return;
          } else {
            console.log('No code puzzles found in debug API');
          }
        } else {
          console.log('No puzzles found in debug API');
        }
      } else {
        console.log('Debug API failed:', debugResponse.status);
      }

      // Fallback zu Mock-Daten
      setUseMockData(true);
      setError('Keine Datenbank-Code-Rätsel gefunden. Verwende Demo-Daten.');
    } catch (error) {
      console.error('Fehler beim Laden der Code-Rätsel:', error);
      setUseMockData(true);
      setError('Netzwerkfehler. Verwende Demo-Daten.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadDatabasePuzzles();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/90 border-green-500">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-lg">Lade Code-Rätsel...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/90 border-green-500">
          <CardHeader>
            <CardTitle className="text-2xl text-green-400">
              Code-Eingabe Rätsel-System
            </CardTitle>
            <p className="text-gray-300">
              Teste das Code-Eingabe-Rätsel-System mit Passwort-Feldern und Validierung
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockCodePuzzles.map((puzzle) => (
                <Card key={puzzle.puzzleId} className="bg-gray-900/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      {puzzle.name}
                    </CardTitle>
                    <p className="text-sm text-gray-400">
                      {puzzle.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${puzzle.difficulty === 1 ? 'bg-green-500' : puzzle.difficulty === 2 ? 'bg-yellow-500' : 'bg-orange-500'} text-white`}>
                        {puzzle.difficulty === 1 ? 'Einfach' : puzzle.difficulty === 2 ? 'Leicht' : 'Mittel'}
                      </Badge>
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        {puzzle.timeLimitSeconds}s
                      </Badge>
                      <Badge variant="outline" className="border-purple-500 text-purple-400">
                        {puzzle.maxAttempts} Versuche
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setActivePuzzle(puzzle)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Code-Rätsel starten
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                Code-Eingabe Features:
              </h3>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• <strong>Passwort-Feld</strong> - Sichere Eingabe mit Show/Hide-Toggle</li>
                <li>• <strong>Enter-Taste</strong> - Code mit Enter absenden</li>
                <li>• <strong>Zeitlimit</strong> - Countdown-Timer für Zeitdruck</li>
                <li>• <strong>Versuche-Limit</strong> - Maximale Anzahl Versuche</li>
                <li>• <strong>Hinweise-System</strong> - Progressive Hinweise verfügbar</li>
                <li>• <strong>Sofortige Validierung</strong> - Antwort wird sofort geprüft</li>
                <li>• <strong>Responsive Design</strong> - Funktioniert auf allen Geräten</li>
                <li>• <strong>Accessibility</strong> - Barrierefreie Bedienung</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gray-500/10 border border-gray-500 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Für Entwickler:
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                Die PuzzleCodeInput-Komponente unterstützt:
              </p>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                <li>Verschiedene Code-Typen (Passwörter, Zahlen, Sequenzen)</li>
                <li>Zeitlimit und Versuche-Limit</li>
                <li>Progressive Hinweise</li>
                <li>Automatische Validierung</li>
                <li>Responsive und accessible Design</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code-Rätsel-Modal */}
      {activePuzzle && (
        <PuzzleCodeInput
          puzzleId={activePuzzle.puzzleId}
          onSolve={handleSolve}
          onClose={handleClose}
        />
      )}
    </div>
  );
} 