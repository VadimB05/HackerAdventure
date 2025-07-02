'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Lightbulb, 
  Trophy,
  ChevronRight
} from 'lucide-react';
import { useGameState } from './game-context';
import { PuzzleData } from '@/lib/services/puzzle-service';

interface TerminalCommand {
  type: 'user' | 'system';
  command: string;
  timestamp: Date;
}

interface PuzzleTerminalProps {
  puzzleId: string;
  puzzleData?: PuzzleData;
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export default function PuzzleTerminal({
  puzzleId,
  puzzleData,
  onSolve,
  onClose
}: PuzzleTerminalProps) {
  // Game-Context für Alarm-Level
  const { increaseAlarmLevel, alarmLevel } = useGameState();
  
  // Puzzle-Daten
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [lastAlarmLevel, setLastAlarmLevel] = useState(0);
  
  // Terminal-State
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Spiel-State
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  
  // Timer für Zeitlimit
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Terminal-Referenz für Auto-Scroll
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer für Zeitlimit
  useEffect(() => {
    if (puzzleData?.timeLimitSeconds && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          }
          return 0;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [puzzleData, timeRemaining]);

  // Auto-Scroll zum Ende des Terminals
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Focus auf Input beim Laden
  useEffect(() => {
    if (inputRef.current && !isLoading && !error && !showTrophy) {
      inputRef.current.focus();
    }
  }, [isLoading, error, showTrophy]);

  // Focus auf Input nach dem Leeren (für Terminal-Verhalten)
  useEffect(() => {
    if (inputRef.current && currentCommand === '' && !isSubmitting) {
      // Kurze Verzögerung, damit der Benutzer die Ausgabe sehen kann
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentCommand, isSubmitting]);

  // Versuche in der Datenbank zurücksetzen
  const resetPuzzleAttempts = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/puzzles/${puzzleId}/reset-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: 'Alarm-Level erhöht - Versuche zurückgesetzt'
        }),
      });
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Versuche:', error);
    }
  }, [puzzleId]);

  const addCommandToHistory = useCallback((type: 'user' | 'system', command: string) => {
    const newCommand: TerminalCommand = {
      type,
      command,
      timestamp: new Date()
    };
    setCommandHistory(prev => [...prev, newCommand]);
  }, []);

  const startTimer = useCallback(() => {
    if (timeLimit && timeLimit > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          } else {
            clearInterval(timer);
            return 0;
          }
        });
      }, 1000);
      
      // Timer-Referenz speichern für Cleanup
      timerRef.current = timer;
    }
  }, [timeLimit]);

  // Prüfe Alarm-Level-Änderungen und setze Versuche zurück
  useEffect(() => {
    if (alarmLevel > lastAlarmLevel) {
      console.log(`Alarm-Level erhöht von ${lastAlarmLevel} auf ${alarmLevel} - setze Versuche zurück`);
      setLastAlarmLevel(alarmLevel);
      
      // Versuche zurücksetzen
      resetPuzzleAttempts();
      
      // Rätsel NICHT schließen - nur Versuche zurücksetzen
      // Das Rätsel soll weiter spielbar bleiben
    }
  }, [alarmLevel, lastAlarmLevel, resetPuzzleAttempts]);

  // Puzzle laden
  const loadPuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wenn puzzleData als Prop vorhanden ist, verwende diese
      if (puzzleData) {
        console.log('Verwende puzzleData aus Props:', puzzleData);
        
        // Versuche aus der API-Response laden
        const attemptsFromApi = puzzleData.progress?.attempts || 0;
        console.log(`Lade Versuche aus API: ${attemptsFromApi}/${puzzleData.maxAttempts}`);
        setAttempts(attemptsFromApi);
        setMaxAttempts(puzzleData.maxAttempts);
        
        // Timer starten wenn Zeitlimit vorhanden
        if (puzzleData.timeLimitSeconds && puzzleData.timeLimitSeconds > 0) {
          setTimeLimit(puzzleData.timeLimitSeconds);
          setTimeRemaining(puzzleData.timeLimitSeconds);
          startTimer();
        }
        
        // Willkommensnachricht hinzufügen
        addCommandToHistory('system', `Willkommen im Terminal-Rätsel: ${puzzleData.name}\n${puzzleData.description}\n\nVerfügbare Befehle: help, hint, clear, status`);
        
        setIsLoading(false);
        return;
      }

      // Fallback: Lade Puzzle von API
      const response = await fetch(`/api/game/puzzles/${puzzleId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden des Rätsels');
      }

      if (!data.success || !data.puzzle) {
        throw new Error('Ungültige Antwort vom Server');
      }

      const puzzle = data.puzzle;
      console.log('Geladenes Puzzle:', puzzle);
      
      // Versuche aus der API-Response laden
      const attemptsFromApi = puzzle.progress?.attempts || 0;
      console.log(`Lade Versuche aus API: ${attemptsFromApi}/${puzzle.maxAttempts}`);
      setAttempts(attemptsFromApi);
      setMaxAttempts(puzzle.maxAttempts);
      
      // Timer starten wenn Zeitlimit vorhanden
      if (puzzle.timeLimitSeconds && puzzle.timeLimitSeconds > 0) {
        setTimeLimit(puzzle.timeLimitSeconds);
        setTimeRemaining(puzzle.timeLimitSeconds);
        startTimer();
      }
      
      // Willkommensnachricht hinzufügen
      addCommandToHistory('system', `Willkommen im Terminal-Rätsel: ${puzzle.name}\n${puzzle.description}\n\nVerfügbare Befehle: help, hint, clear, status`);

    } catch (error) {
      console.error('Fehler beim Laden des Rätsels:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  }, [puzzleId, puzzleData, startTimer, addCommandToHistory]);

  useEffect(() => {
    if (puzzleData) {
      // Versuche aus der API-Response laden
      const attemptsFromApi = puzzleData.progress?.attempts || 0;
      console.log(`Lade Versuche aus API: ${attemptsFromApi}/${puzzleData.maxAttempts}`);
      setAttempts(attemptsFromApi);
      setMaxAttempts(puzzleData.maxAttempts);
    }
  }, [puzzleData]);

  // Lade Puzzle-Daten beim ersten Laden
  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  // Reset alle States beim Öffnen des Rätsels
  useEffect(() => {
    if (puzzleId) {
      console.log('[DEBUG] Rätsel geöffnet - setze alle States zurück');
      setCommandHistory([]);
      setCurrentCommand('');
      setShowHint(false);
      setCurrentHintIndex(0);
    }
  }, [puzzleId]);

  const handleSubmit = async (command: string) => {
    if (!command.trim()) return;

    // Befehl zur Historie hinzufügen
    addCommandToHistory('user', command);
    
    // Input-Feld leeren (wie in einem echten Terminal)
    setCurrentCommand('');
    setHistoryIndex(-1);

    // Spezielle Befehle behandeln
    if (command.toLowerCase() === 'help') {
      addCommandToHistory('system', 'Verfügbare Befehle:\n- hint: Zeige einen Hinweis\n- clear: Lösche Terminal\n- status: Zeige aktuellen Status\n- [dein Befehl]: Führe Befehl aus');
      return;
    }

    if (command.toLowerCase() === 'clear') {
      setCommandHistory([]);
      return;
    }

    if (command.toLowerCase() === 'status') {
      addCommandToHistory('system', `Status:\n- Versuche: ${attempts}/${maxAttempts}\n- Zeit: ${timeRemaining || 'Unbegrenzt'}\n- Hinweise verfügbar: ${puzzleData?.hints?.length || 0}`);
      return;
    }

    if (command.toLowerCase() === 'hint') {
      if (puzzleData?.hints && puzzleData.hints.length > 0) {
        const hint = puzzleData.hints[currentHintIndex % puzzleData.hints.length];
        addCommandToHistory('system', `Hinweis: ${hint}`);
        setCurrentHintIndex(prev => prev + 1);
        
        // Hinweis nach 5 Sekunden ausblenden
        setTimeout(() => {
          setShowHint(false);
        }, 5000);
      } else {
        addCommandToHistory('system', 'Keine Hinweise verfügbar.');
      }
      return;
    }

    // Prüfe ob maximale Versuche erreicht sind
    if (attempts >= maxAttempts) {
      addCommandToHistory('system', 'Maximale Anzahl Versuche erreicht. Alarm-Level wird erhöht!');
      increaseAlarmLevel('Maximale Versuche im Terminal-Rätsel erreicht');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/game/puzzles/${puzzleId}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answer: command,
          timeSpent: timeLimit ? timeLimit - (timeRemaining || 0) : 0
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Versuche aktualisieren
        setAttempts(data.attempts);

        if (data.isCorrect) {
          addCommandToHistory('system', `${data.message}\nRätsel gelöst!`);
          
          onSolve(puzzleId, true);
        } else {
          addCommandToHistory('system', `${data.message}\nVersuche: ${data.attempts}/${data.maxAttempts}`);
          
          // Prüfe ob maximale Versuche erreicht sind
          if (data.maxAttemptsReached) {
            addCommandToHistory('system', 'Maximale Anzahl Versuche erreicht. Alarm-Level wird erhöht!');
            increaseAlarmLevel('Maximale Versuche im Terminal-Rätsel erreicht');
          }
        }
      } else {
        // Prüfe ob es ein "Maximale Versuche" Fehler ist
        if (data.error && data.error.includes('Maximale Anzahl Versuche')) {
          addCommandToHistory('system', 'Maximale Anzahl Versuche erreicht. Alarm-Level wird erhöht!');
          increaseAlarmLevel('Maximale Versuche im Terminal-Rätsel erreicht');
        } else {
          addCommandToHistory('system', `Fehler: ${data.error || 'Unbekannter Fehler'}`);
        }
      }
    } catch (error) {
      console.error('Fehler beim Lösen des Rätsels:', error);
      addCommandToHistory('system', 'Netzwerkfehler beim Lösen des Rätsels');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const command = commandHistory[commandHistory.length - 1 - newIndex].command;
        if (command !== 'system') {
          setCurrentCommand(command);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const command = commandHistory[commandHistory.length - 1 - newIndex].command;
        if (command !== 'system') {
          setCurrentCommand(command);
        }
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-black/80 border border-green-500 rounded-lg p-8">
          <div className="text-green-400 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg">Lade Terminal-Rätsel...</p>
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

  if (puzzleData.progress?.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl mx-4"
        >
          <Card className="bg-black/90 border-green-500 text-green-400">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="h-16 w-16 text-yellow-400" />
              </div>
              <CardTitle className="text-2xl text-green-400">Terminal-Rätsel bereits gelöst!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-300">
                Du hast dieses Terminal-Rätsel bereits erfolgreich gelöst.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={onClose} variant="outline" className="border-green-500 text-green-400">
                  Schließen
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl mx-4"
      >
        <Card className="bg-black/90 border-green-500 text-green-400">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                {puzzleData.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${getDifficultyColor(puzzleData.difficulty)} text-white`}>
                  {getDifficultyText(puzzleData.difficulty)}
                </Badge>
                {puzzleData.timeLimitSeconds && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">{puzzleData.description}</p>

            {/* Versuche */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Versuche: {attempts}/{puzzleData.maxAttempts}</span>
              <span>Hinweise: {currentHintIndex}/{puzzleData.hints?.length || 0}</span>
              {puzzleData.timeLimitSeconds && timeRemaining !== null && (
                <span>Zeit: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Zeitlimit-Warnung */}
            {timeRemaining !== null && timeRemaining <= 30 && timeRemaining > 0 && (
              <Alert className="border-red-500 bg-red-500/10">
                <Clock className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Nur noch {timeRemaining} Sekunden!
                </AlertDescription>
              </Alert>
            )}

            {/* Hinweis */}
            {showHint && puzzleData.hints[currentHintIndex - 1] && (
              <Alert className="border-yellow-500 bg-yellow-500/10">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  {puzzleData.hints[currentHintIndex - 1]}
                </AlertDescription>
              </Alert>
            )}

            {/* Ergebnis */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Alert className={isCorrect ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <AlertDescription className={isCorrect ? "text-green-400" : "text-red-400"}>
                      {isCorrect 
                        ? 'Richtige Antwort! Rätsel gelöst!' 
                        : 'Falsche Antwort. Versuche es nochmal!'
                      }
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trophäe - Rätsel gelöst */}
            {showTrophy && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-center"
              >
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Terminal-Rätsel gelöst!</h3>
                <p className="text-gray-300 mb-4">Glückwunsch! Du hast das Terminal-Rätsel erfolgreich abgeschlossen.</p>
                <Button
                  onClick={() => onSolve(puzzleId, true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Rätsel schließen
                </Button>
              </motion.div>
            )}

            {/* Terminal-Ausgabe */}
            {!showTrophy && (
              <div className="space-y-4">
                <div className="text-center">
                  <Terminal className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Terminal
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Gib Befehle ein, um das Rätsel zu lösen
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 font-mono text-sm h-48 overflow-y-auto" ref={terminalRef}>
                  <div className="space-y-2">
                    {commandHistory.map((cmd, index) => (
                      <div key={index} className="mb-2">
                        <div className="text-green-400">
                          {cmd.type === 'user' ? '$ ' : ''}{cmd.command}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Befehlszeile */}
                <div className="flex items-center space-x-2 bg-gray-900 border border-gray-600 rounded-lg p-3">
                  <span className="text-blue-400 font-mono">$</span>
                  <Input
                    ref={inputRef}
                    type="text"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Befehl eingeben..."
                    className="flex-1 bg-transparent text-green-400 font-mono border-none focus:ring-0 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={() => handleSubmit(currentCommand)}
                    disabled={!currentCommand.trim() || isSubmitting}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? '...' : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Aktionen */}
            {!showTrophy && (
              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  {/* Hinweis-Button */}
                  {puzzleData.hints?.length > 0 && currentHintIndex < puzzleData.hints.length && (
                    <Button
                      onClick={() => handleSubmit('hint')}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      Hinweis
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-500 text-gray-400 hover:bg-gray-500/10"
                    disabled={isSubmitting}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {/* Maximale Versuche erreicht */}
            {attempts >= puzzleData.maxAttempts && (
              <Alert className="border-red-500 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Maximale Anzahl Versuche erreicht. Das Terminal-Rätsel ist gescheitert.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 