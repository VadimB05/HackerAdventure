'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Database, Zap } from 'lucide-react';
import MultiQuestionPuzzle from './multi-question-puzzle';
import { getRoomMultiQuestionPuzzles, type MultiQuestionPuzzleData } from '@/lib/services/multi-question-puzzle-service';

export default function PuzzleDemo() {
  const [activePuzzle, setActivePuzzle] = useState<MultiQuestionPuzzleData | null>(null);
  const [puzzles, setPuzzles] = useState<MultiQuestionPuzzleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Mock-Daten für Fallback
  const mockPuzzles: MultiQuestionPuzzleData[] = [
    {
      puzzleId: 'demo-1',
      roomId: 'bedroom',
      name: 'Netzwerk-Grundlagen',
      description: 'Teste dein Wissen über Netzwerkprotokolle und deren Funktionsweise.',
      type: 'multi_question',
      difficulty: 1,
      questions: [
        {
          id: 1,
          question: 'Welches Protokoll arbeitet auf der Transportschicht des TCP/IP-Modells?',
          options: [
            'HTTP (Hypertext Transfer Protocol)',
            'TCP (Transmission Control Protocol)', 
            'IP (Internet Protocol)',
            'DNS (Domain Name System)'
          ],
          correct_answer: 'b',
          explanation: 'TCP (Transmission Control Protocol) arbeitet auf der Transportschicht und stellt eine zuverlässige, verbindungsorientierte Datenübertragung sicher.'
        },
        {
          id: 2,
          question: 'Welches Protokoll wird für die Namensauflösung verwendet?',
          options: [
            'HTTP',
            'FTP',
            'DNS',
            'SMTP'
          ],
          correct_answer: 'c',
          explanation: 'DNS (Domain Name System) übersetzt Domain-Namen in IP-Adressen.'
        },
        {
          id: 3,
          question: 'Welches Protokoll ist verbindungslos?',
          options: [
            'TCP',
            'UDP',
            'HTTP',
            'FTP'
          ],
          correct_answer: 'b',
          explanation: 'UDP (User Datagram Protocol) ist verbindungslos und bietet keine Garantien für die Paketreihenfolge.'
        }
      ],
      hints: [
        'Das Protokoll arbeitet auf der Transportschicht',
        'Es ist verbindungsorientiert',
        'Es garantiert die Reihenfolge der Pakete'
      ],
      maxAttempts: 5,
      timeLimitSeconds: 300,
      rewardExp: 75,
      rewardItems: [],
      isRequired: true,
      isHidden: false,
      progress: {
        isCompleted: false,
        attempts: 0,
        bestTimeSeconds: null,
        completedAt: null,
        hintsUsed: 0,
        completedQuestions: []
      }
    },
    {
      puzzleId: 'demo-2',
      roomId: 'bedroom',
      name: 'Sicherheitsprotokolle',
      description: 'Fragen zu Verschlüsselungsmethoden und Sicherheitsstandards.',
      type: 'multi_question',
      difficulty: 2,
      questions: [
        {
          id: 1,
          question: 'Welches Protokoll wird heutzutage für sichere HTTPS-Verbindungen verwendet?',
          options: [
            'SSL (Secure Sockets Layer)',
            'SSH (Secure Shell)',
            'TLS (Transport Layer Security)',
            'FTP (File Transfer Protocol)'
          ],
          correct_answer: 'c',
          explanation: 'TLS (Transport Layer Security) ist das moderne Protokoll für sichere Web-Verbindungen. Es ist der Nachfolger von SSL und wird für HTTPS verwendet.'
        },
        {
          id: 2,
          question: 'Welche Verschlüsselungsart verwendet zwei verschiedene Schlüssel?',
          options: [
            'Symmetrische Verschlüsselung',
            'Asymmetrische Verschlüsselung',
            'Hash-Funktionen',
            'Steganographie'
          ],
          correct_answer: 'b',
          explanation: 'Asymmetrische Verschlüsselung verwendet ein Schlüsselpaar: einen öffentlichen und einen privaten Schlüssel.'
        }
      ],
      hints: [
        'Es verwendet asymmetrische Verschlüsselung',
        'Es arbeitet auf der Transportschicht',
        'Es ist der Nachfolger von SSL'
      ],
      maxAttempts: 4,
      timeLimitSeconds: 240,
      rewardExp: 50,
      rewardItems: [],
      isRequired: true,
      isHidden: false,
      progress: {
        isCompleted: false,
        attempts: 0,
        bestTimeSeconds: null,
        completedAt: null,
        hintsUsed: 0,
        completedQuestions: []
      }
    }
  ];

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug-API verwenden (ohne Authentifizierung)
      console.log('Testing debug API...');
      const debugResponse = await fetch('/api/debug/puzzles?roomId=bedroom');
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Debug API response:', debugData);
        
        if (debugData.success && debugData.puzzles && debugData.puzzles.length > 0) {
          // Konvertiere zu MultiQuestionPuzzleData Format
          const convertedPuzzles = debugData.puzzles.map((puzzle: any) => ({
            ...puzzle,
            progress: {
              isCompleted: false,
              attempts: 0,
              bestTimeSeconds: null,
              completedAt: null,
              hintsUsed: 0,
              completedQuestions: []
            }
          }));
          
          setPuzzles(convertedPuzzles);
          setUseMockData(false);
          console.log('Using database puzzles:', convertedPuzzles.length);
          return;
        } else {
          console.log('No puzzles found in debug API');
        }
      } else {
        console.log('Debug API failed:', debugResponse.status);
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
  };

  const handleSolve = (puzzleId: string, isCorrect: boolean) => {
    console.log(`Rätsel ${puzzleId} gelöst: ${isCorrect ? 'Richtig' : 'Falsch'}`);
    setActivePuzzle(null);
    
    if (isCorrect) {
      console.log('Glückwunsch! Rätsel erfolgreich gelöst!');
    } else {
      console.log('Das war leider falsch. Versuche es nochmal!');
    }
  };

  const handleClose = () => {
    setActivePuzzle(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/90 border-green-500">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-lg">Lade Rätsel...</p>
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
              Multi-Question Rätsel-System
            </CardTitle>
            <p className="text-gray-300">
              Teste das produktive Multi-Question-Rätsel-System mit Datenbank-Integration
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
              {puzzles.map((puzzle) => (
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
                        {puzzle.questions.length} Fragen
                      </Badge>
                      <Badge variant="outline" className="border-purple-500 text-purple-400">
                        {puzzle.timeLimitSeconds}s
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setActivePuzzle(puzzle)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Rätsel starten
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                Produktive Features:
              </h3>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• <strong>Datenbank-Integration</strong> - Echte Rätsel aus der Datenbank</li>
                <li>• <strong>Mehrere Fragen pro Rätsel</strong> - Jedes Rätsel enthält 2-3 Fragen</li>
                <li>• <strong>Globale Versuche</strong> - Versuche gelten für alle Fragen im Rätsel</li>
                <li>• <strong>Antworten ändern</strong> - Du kannst falsche Antworten korrigieren</li>
                <li>• <strong>Fragen-Navigation</strong> - Vor und zurück zwischen Fragen</li>
                <li>• <strong>Fortschrittsanzeige</strong> - Sieh deinen Fortschritt durch alle Fragen</li>
                <li>• <strong>Nur XP-Belohnungen</strong> - Rätsel geben nur Erfahrungspunkte</li>
                <li>• <strong>Automatischer Fallback</strong> - Mock-Daten wenn keine DB-Verbindung</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gray-500/10 border border-gray-500 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Für Entwickler:
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                Um echte Datenbank-Rätsel zu testen:
              </p>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                <li>Führe das SQL-Script <code className="bg-gray-800 px-1 rounded">scripts/setup-multi-question-puzzles.sql</code> aus</li>
                <li>Stelle sicher, dass die Datenbank läuft und erreichbar ist</li>
                <li>Die Demo lädt automatisch echte Rätsel, falls verfügbar</li>
                <li>Bei Problemen wird automatisch auf Mock-Daten zurückgegriffen</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rätsel-Modal */}
      {activePuzzle && (
        <MultiQuestionPuzzle
          puzzleId={activePuzzle.puzzleId}
          onSolve={handleSolve}
          onClose={handleClose}
        />
      )}
    </div>
  );
} 