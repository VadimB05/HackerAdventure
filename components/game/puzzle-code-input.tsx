import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Lightbulb, Trophy, Lock, Eye, EyeOff } from 'lucide-react';
import { solvePuzzle, type PuzzleData } from '@/lib/services/puzzle-service';
import { useGameState } from '@/lib/contexts/game-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PuzzleCodeInputProps {
  puzzleId: string;
  puzzleData?: PuzzleData;
  onSolve: (puzzleId: string, isCorrect: boolean, alarmLevelIncreased?: boolean) => void;
  onClose: () => void;
  useMockData?: boolean;
}

export default function PuzzleCodeInput({
  puzzleId,
  puzzleData: initialPuzzleData,
  onSolve,
  onClose,
  useMockData = false
}: PuzzleCodeInputProps) {
  const [puzzleData, setPuzzleData] = useState(initialPuzzleData);
  const [codeInput, setCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [roomId, setRoomId] = useState('intro');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [resetInfo, setResetInfo] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFirstMaxAttempts, setIsFirstMaxAttempts] = useState(false);

  const { alarmLevel, addAlarmNotifyNotification } = useGameState();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [lastAlarmLevel, setLastAlarmLevel] = useState(0);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  // Timer für Zeitlimit
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timeLimit && timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [timeLimit]);

  // Timer für Zeitlimit
  useEffect(() => {
    if (puzzleData?.timeLimitSeconds && timeRemaining !== null) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [puzzleData?.timeLimitSeconds, timeRemaining]);

  // Rätsel laden
  const loadPuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // States zurücksetzen
      setShowResult(false);
      setIsCorrect(false);
      setShowTrophy(false);

      // Wenn puzzleData als Prop vorhanden ist, verwende diese
      if (puzzleData) {
        console.log('Verwende puzzleData aus Props:', puzzleData);
        
        // Versuche aus der API-Response laden
        const attemptsFromApi = puzzleData.progress?.attempts || 0;
        console.log(`[DEBUG] Lade Versuche aus API: ${attemptsFromApi}/${puzzleData.maxAttempts}`);
        setAttempts(attemptsFromApi);
        setMaxAttempts(puzzleData.maxAttempts);
        
        // Timer starten wenn Zeitlimit vorhanden
        if (puzzleData.timeLimitSeconds && puzzleData.timeLimitSeconds > 0) {
          setTimeLimit(puzzleData.timeLimitSeconds);
          setTimeRemaining(puzzleData.timeLimitSeconds);
          startTimer();
        }
        
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
      console.log('[DEBUG] Geladenes Puzzle:', puzzle);
      
      // Versuche aus der API-Response laden
      const attemptsFromApi = puzzle.progress?.attempts || 0;
      console.log(`[DEBUG] Lade Versuche aus API: ${attemptsFromApi}/${puzzle.maxAttempts}`);
      setAttempts(attemptsFromApi);
      setMaxAttempts(puzzle.maxAttempts);
      
      // Ergebnis-States zurücksetzen
      setShowResult(false);
      setIsCorrect(false);
      setShowTrophy(false);
      
      // Timer starten wenn Zeitlimit vorhanden
      if (puzzle.timeLimitSeconds && puzzle.timeLimitSeconds > 0) {
        setTimeRemaining(puzzle.timeLimitSeconds);
      }

    } catch (error) {
      console.error('Fehler beim Laden des Rätsels:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  }, [puzzleId, puzzleData, startTimer]);

  // Versuche in der Datenbank zurücksetzen
  const resetPuzzleAttempts = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/puzzles/${puzzleId}/reset-attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('[DEBUG] Versuche erfolgreich zurückgesetzt');
          setAttempts(0);
        }
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Versuche:', error);
    }
  }, [puzzleId]);

  // Lade Puzzle-Daten beim ersten Laden
  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  // Reset alle States beim Öffnen des Rätsels
  useEffect(() => {
    if (puzzleId) {
      console.log('[DEBUG] Rätsel geöffnet - setze alle States zurück');
      setShowResult(false);
      setIsCorrect(false);
      setShowTrophy(false);
      setCodeInput('');
      setError(null);
    }
  }, [puzzleId]);

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

  const handleCodeChange = (value: string) => {
    setCodeInput(value);
    // Reset result wenn neuer Code eingegeben wird
    if (showResult) {
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const [showAlarmModal, setShowAlarmModal] = useState(false);

  const handleSubmit = async () => {
    if (!codeInput.trim() || isSubmitting) return;

    console.log(`[DEBUG] Submit - Aktuelle Versuche: ${attempts}/${maxAttempts}`);

    // Prüfe ob maximale Versuche erreicht sind - ABER NICHT BLOCKIEREN
    if (attempts >= maxAttempts) {
      console.log(`[DEBUG] Maximale Versuche erreicht (${attempts}/${maxAttempts}) - warte auf API-Response`);
      return;
    }

    try {
      setIsSubmitting(true);
      setShowResult(false);

      console.log(`[DEBUG] Sende Antwort an API: ${codeInput.trim()}`);

      const response = await fetch(`/api/game/puzzles/${puzzleId}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answer: codeInput.trim(),
          timeSpent: puzzleData?.timeLimitSeconds ? puzzleData.timeLimitSeconds - (timeRemaining || 0) : 0
        }),
      });

      const data = await response.json();
      console.log(`[DEBUG] API Response:`, data);

      if (response.ok && data.success) {
        // Versuche aktualisieren
        console.log(`[DEBUG] Versuche aktualisiert: ${data.attempts}/${data.maxAttempts}`);
        setAttempts(data.attempts);

        // Alarm-Level-Logik behandeln
        if (data.alarmLevelIncreased) {
          console.log(`[DEBUG] Alarm-Level erhöht auf ${data.newAlarmLevel}`);
          
          if (data.isFirstAlarmLevel) {
            // Erstes Alarm-Level: Modal wird automatisch vom Game-Context angezeigt
            console.log('[DEBUG] Erstes Alarm-Level - Modal wird angezeigt');
          } else {
            // Weiteres Alarm-Level: Normale Benachrichtigung
            console.log('[DEBUG] Weiteres Alarm-Level - Normale Benachrichtigung');
          }
          
          onClose();
          setTimeout(() => {
            addAlarmNotifyNotification('Dein Alarm Level ist gestiegen!');
            onSolve(puzzleId, false, true);
          }, 300);
          return;
        }

        if (data.isCorrect) {
          setIsCorrect(true);
          setShowResult(true);
          
          setTimeout(() => {
            onSolve(puzzleId, true);
          }, 2000);
        } else {
          setIsCorrect(false);
          setShowResult(true);
        }
      } else {
        // Prüfe ob es ein "Maximale Versuche" Fehler ist
        if (data.error && data.error.includes('Maximale Anzahl Versuche')) {
          console.log(`[DEBUG] API Fehler: Maximale Versuche - Puzzle wird geschlossen`);
          
          // Prüfe ob es das erste Mal ist
          const hasSeenExplanation = localStorage.getItem(`explanation_seen_${puzzleId}`);
          if (!hasSeenExplanation) {
            setIsFirstMaxAttempts(true);
            setShowExplanation(true);
            localStorage.setItem(`explanation_seen_${puzzleId}`, 'true');
          } else {
            // Puzzle schließen mit kurzem Hinweis
            setTimeout(() => {
              onClose();
            }, 3000);
          }
          return;
        } else {
          console.error('Fehler beim Lösen des Rätsels:', data.error);
        }
      }
    } catch (error) {
      console.error('Fehler beim Lösen des Rätsels:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHint = () => {
    if (puzzleData && currentHintIndex < puzzleData.hints.length) {
      setShowHint(true);
      setCurrentHintIndex(prev => prev + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
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
              <CardTitle className="text-2xl text-green-400">Rätsel bereits gelöst!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-300">
                Du hast dieses Rätsel bereits erfolgreich gelöst.
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
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl mx-4"
        >
          <Card className="bg-black/90 border-green-500 text-green-400">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-xl text-green-400">{puzzleData.name}</CardTitle>
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
                  <h3 className="text-xl font-bold text-green-400 mb-2">Rätsel gelöst!</h3>
                  <p className="text-gray-300 mb-4">Glückwunsch! Du hast das Rätsel erfolgreich abgeschlossen.</p>
                  <Button
                    onClick={() => onSolve(puzzleId, true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Rätsel schließen
                  </Button>
                </motion.div>
              )}

              {/* Code-Eingabe */}
              {!showTrophy && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Lock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Code eingeben
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Gib den korrekten Code oder Wert ein
                    </p>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={codeInput}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Code eingeben..."
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                      disabled={isSubmitting || (showResult && isCorrect)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Erklärung bei maximalen Versuchen */}
              {showExplanation && isFirstMaxAttempts && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500 rounded-lg"
                >
                  <h4 className="font-semibold text-red-400 mb-2">⚠️ Maximale Versuche erreicht!</h4>
                  <p className="text-gray-300 mb-3">
                    Du hast die maximale Anzahl Versuche erreicht. Das Alarm-Level wurde erhöht und die Versuche wurden zurückgesetzt.
                  </p>
                  {puzzleData.data?.code_input?.explanation && (
                    <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-600">
                      <h5 className="font-semibold text-green-400 mb-1">Lösung:</h5>
                      <p className="text-gray-300">{puzzleData.data.code_input.explanation}</p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        setShowExplanation(false);
                        onClose();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Verstanden
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Aktionen */}
              {!showTrophy && (
                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2">
                    {/* Hinweis-Button */}
                    {puzzleData.hints.length > 0 && currentHintIndex < puzzleData.hints.length && (
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
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={!codeInput.trim() || isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? 'Prüfe...' : 'Code absenden'}
                    </Button>
                  </div>
                </div>
              )}

              {resetInfo && (
                <Alert className="border-yellow-500 bg-yellow-500/10">
                  <AlertDescription className="text-yellow-400">
                    Die Versuche wurden zurückgesetzt. Das Alarm-Level wurde erhöht!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Dialog open={showAlarmModal} onOpenChange={open => setShowAlarmModal(open)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Dein Alarm Level ist gestiegen</DialogTitle>
          </DialogHeader>
          <Button className="mt-4 w-full" onClick={() => setShowAlarmModal(false)}>
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
} 