'use client';

import React, { useState, useRef, useEffect } from 'react';
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

interface TerminalCommand {
  command: string;
  output: string;
  timestamp: Date;
}

interface PuzzleTerminalProps {
  puzzleId: string;
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export default function PuzzleTerminal({
  puzzleId,
  onSolve,
  onClose
}: PuzzleTerminalProps) {
  // Puzzle-Daten
  const [puzzleData, setPuzzleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Terminal-State
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Spiel-State
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  
  // Timer für Zeitlimit
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
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

  // Puzzle laden
  const loadPuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Versuche zuerst die Debug-API
      const result = await fetch(`/api/debug/puzzles/${puzzleId}`);
      const data = await result.json();

      if (result.ok && data.success) {
        // Debug-API Format zu Terminal-Format konvertieren
        const puzzle = data.puzzle;
        setPuzzleData({
          id: puzzle.puzzleId || puzzle.id,
          name: puzzle.name,
          description: puzzle.description,
          difficulty: puzzle.difficulty,
          maxAttempts: puzzle.maxAttempts,
          timeLimitSeconds: puzzle.timeLimitSeconds,
          rewardExp: puzzle.rewardExp,
          rewardBitcoins: puzzle.rewardMoney || 0.0001,
          hints: puzzle.hints || [],
          solution: puzzle.solution || '',
          progress: {
            attempts: 0,
            hintsUsed: 0,
            isCompleted: false
          }
        });
        setAttempts(0);
        
        // Timer starten wenn Zeitlimit vorhanden
        if (puzzle.timeLimitSeconds) {
          setTimeRemaining(puzzle.timeLimitSeconds);
        }
        
        // Willkommensnachricht hinzufügen
        addCommandToHistory('system', `Willkommen im Terminal-Rätsel: ${puzzle.name}\n${puzzle.description}\n\nVerfügbare Befehle: help, hint, clear, status`);
      } else {
        // Fallback zu Mock-Daten
        setPuzzleData({
          id: puzzleId,
          name: 'Terminal-Rätsel',
          description: 'Löse das Terminal-Rätsel mit den richtigen Befehlen',
          difficulty: 2,
          maxAttempts: 3,
          timeLimitSeconds: 300,
          rewardExp: 100,
          rewardBitcoins: 0.0003,
          hints: ['Tipp 1: Versuche "help"', 'Tipp 2: Schaue dir die Ausgaben genau an'],
          solution: 'ls',
          progress: {
            attempts: 0,
            hintsUsed: 0,
            isCompleted: false
          }
        });
        setAttempts(0);
        setTimeRemaining(300);
        
        addCommandToHistory('system', `Willkommen im Terminal-Rätsel (Demo-Modus)\nLöse das Terminal-Rätsel mit den richtigen Befehlen\n\nVerfügbare Befehle: help, hint, clear, status`);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Rätsels:', error);
      // Fallback zu Mock-Daten bei Fehler
      setPuzzleData({
        id: puzzleId,
        name: 'Terminal-Rätsel',
        description: 'Löse das Terminal-Rätsel mit den richtigen Befehlen',
        difficulty: 2,
        maxAttempts: 3,
        timeLimitSeconds: 300,
        rewardExp: 100,
        rewardBitcoins: 0.0003,
        hints: ['Tipp 1: Versuche "help"', 'Tipp 2: Schaue dir die Ausgaben genau an'],
        solution: 'ls',
        progress: {
          attempts: 0,
          hintsUsed: 0,
          isCompleted: false
        }
      });
      setAttempts(0);
      setTimeRemaining(300);
      
      addCommandToHistory('system', `Willkommen im Terminal-Rätsel (Demo-Modus)\nLöse das Terminal-Rätsel mit den richtigen Befehlen\n\nVerfügbare Befehle: help, hint, clear, status`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPuzzle();
  }, [puzzleId]);

  const addCommandToHistory = (command: string, output: string) => {
    const newCommand: TerminalCommand = {
      command,
      output,
      timestamp: new Date()
    };
    setCommandHistory(prev => [...prev, newCommand]);
  };

  const handleCommandSubmit = async () => {
    if (!currentCommand.trim() || isSubmitting) return;

    const command = currentCommand.trim().toLowerCase();
    setCurrentCommand('');
    setHistoryIndex(-1);

    // Spezielle Befehle behandeln
    if (command === 'help') {
      addCommandToHistory(command, 
        'Verfügbare Befehle:\n' +
        '  help     - Zeigt diese Hilfe an\n' +
        '  hint     - Zeigt einen Hinweis an\n' +
        '  clear    - Löscht die Terminal-Ausgabe\n' +
        '  status   - Zeigt den aktuellen Status\n' +
        '  [andere] - Versucht das Rätsel zu lösen'
      );
      return;
    }

    if (command === 'clear') {
      setCommandHistory([]);
      return;
    }

    if (command === 'status') {
      addCommandToHistory(command, 
        `Status:\n` +
        `  Versuche: ${attempts}/${puzzleData?.maxAttempts || 0}\n` +
        `  Zeit: ${timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : 'Unbegrenzt'}\n` +
        `  Hinweise: ${currentHintIndex}/${puzzleData?.hints?.length || 0}`
      );
      return;
    }

    if (command === 'hint') {
      handleHint();
      return;
    }

    // Rätsel-Lösung versuchen
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/debug/puzzles/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleId,
          questionId: '1', // Terminal-Rätsel haben nur eine "Frage"
          answer: command,
          timeSpent: puzzleData?.timeLimitSeconds ? puzzleData.timeLimitSeconds - (timeRemaining || 0) : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsCorrect(result.isCorrect);
        setAttempts(result.attempts);
        
        if (result.isCorrect) {
          addCommandToHistory(command, '✅ Korrekt! Rätsel gelöst!');
          setShowResult(true);
          setTimeout(() => {
            setShowResult(false);
            setShowTrophy(true);
          }, 2000);
        } else {
          addCommandToHistory(command, '❌ Falsch. Versuche einen anderen Befehl.');
          setShowResult(true);
          setTimeout(() => {
            setShowResult(false);
          }, 3000);
        }
      } else {
        addCommandToHistory(command, `❌ Fehler: ${result.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Netzwerkfehler:', error);
      addCommandToHistory(command, '❌ Netzwerkfehler beim Lösen des Rätsels');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHint = () => {
    if (puzzleData && currentHintIndex < puzzleData.hints.length) {
      const hint = puzzleData.hints[currentHintIndex];
      addCommandToHistory('hint', `💡 Hinweis ${currentHintIndex + 1}: ${hint}`);
      setCurrentHintIndex(prev => prev + 1);
    } else {
      addCommandToHistory('hint', '❌ Keine weiteren Hinweise verfügbar.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommandSubmit();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl mx-4"
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
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Trophy className="h-5 w-5" />
                    <span>+{puzzleData.rewardExp} XP</span>
                  </div>
                </div>
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
                      <div key={index} className="space-y-1">
                        {cmd.command !== 'system' && (
                          <div className="flex items-center text-green-400">
                            <span className="text-blue-400 mr-2">$</span>
                            <span>{cmd.command}</span>
                          </div>
                        )}
                        <div className="text-gray-300 whitespace-pre-wrap ml-4">
                          {cmd.output}
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
                    onClick={handleCommandSubmit}
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
                      onClick={handleHint}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                      disabled={isSubmitting}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Hinweis ({currentHintIndex + 1}/{puzzleData.hints.length})
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